const RecordedSession = require('../models/RecordedSession');
const WatchProgress = require('../models/WatchProgress');
const VideoService = require('../services/VideoService');
const { TIER_HIERARCHY } = require('../middleware/authorize');

// GET /api/recordings (Public listing with optional auth progress enrichment)
const getRecordings = async (req, res, next) => {
  try {
    const { medium, page = 1, limit = 12 } = req.query;
    const filter = { isPublished: true };
    if (medium) filter.mediumId = medium;

    const skip = (Number(page) - 1) * Number(limit);
    const [recordings, total] = await Promise.all([
      RecordedSession.find(filter)
        .populate('mediumId', 'name slug coverImage')
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RecordedSession.countDocuments(filter),
    ]);

    // Strip protected stream URLs from public listing — never expose in public GET
    const sanitized = recordings.map((r) => {
      const obj = r.toObject();
      delete obj.muxPlaybackId;
      delete obj.videoUrl;
      delete obj.streamUrl;
      return obj;
    });

    // If user is authenticated, attach their watch progress
    if (req.user) {
      const userProgress = await WatchProgress.find({
        userId: req.user._id,
        recordingId: { $in: recordings.map((r) => r._id) },
      }).lean();

      const progressMap = new Map(
        userProgress.map((p) => [p.recordingId.toString(), p])
      );

      sanitized.forEach((item) => {
        const prog = progressMap.get(item._id.toString());
        if (prog) {
          item.watchProgress = {
            progressSeconds: prog.progressSeconds,
            durationSeconds: prog.durationSeconds,
            progressPercentage: prog.progressPercentage,
            isCompleted: prog.isCompleted,
            lastWatchedAt: prog.lastWatchedAt,
          };
        }
      });
    }

    res.json({
      success: true,
      data: sanitized,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recordings/:id/play (Subscription-gated with server-side authorization)
const playRecording = async (req, res, next) => {
  try {
    const recording = await RecordedSession.findById(req.params.id).populate('mediumId', 'name slug');
    if (!recording || !recording.isPublished) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    // Strict server-side subscription verification
    if (req.user.role !== 'admin') {
      if (req.user.subscriptionStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required to watch this recording.',
          code: 'SUBSCRIPTION_REQUIRED',
          requiredTier: recording.requiredTier,
        });
      }

      if (req.user.subscriptionExpiresAt && new Date(req.user.subscriptionExpiresAt) < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please renew to watch this recording.',
          code: 'SUBSCRIPTION_EXPIRED',
          requiredTier: recording.requiredTier,
        });
      }

      const userTier = (req.user.subscriptionTier || '').toLowerCase();
      const userTierLevel = TIER_HIERARCHY[userTier] || 0;
      const requiredTierLevel = TIER_HIERARCHY[(recording.requiredTier || 'basic').toLowerCase()] || 1;

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          message: `This recording requires a ${recording.requiredTier.toUpperCase()} subscription.`,
          code: 'UPGRADE_REQUIRED',
          requiredTier: recording.requiredTier,
          currentTier: req.user.subscriptionTier,
        });
      }
    }

    // Generate signed/authorized playback URL
    const rawTarget = recording.muxPlaybackId || recording.videoUrl;
    if (!rawTarget) {
      return res.status(404).json({ success: false, message: 'No video stream configured for this session' });
    }

    const playbackUrl = await VideoService.getSignedUrl(rawTarget);

    // Fetch existing user watch progress to resume
    const existingProgress = await WatchProgress.findOne({
      userId: req.user._id,
      recordingId: recording._id,
    });

    res.json({
      success: true,
      playbackUrl,
      title: recording.title,
      description: recording.description,
      instructor: recording.instructor,
      durationSeconds: recording.durationSeconds,
      requiredTier: recording.requiredTier,
      initialPositionSeconds: existingProgress?.progressSeconds || 0,
      progressPercentage: existingProgress?.progressPercentage || 0,
      isCompleted: existingProgress?.isCompleted || false,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/recordings/:id/progress (Track watch progress)
const updateProgress = async (req, res, next) => {
  try {
    const { progressSeconds = 0, durationSeconds = 0 } = req.body;
    const recordingId = req.params.id;
    const userId = req.user._id;

    const recording = await RecordedSession.findById(recordingId).select('durationSeconds');
    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    const totalDuration = durationSeconds || recording.durationSeconds || 1;
    const percentage = Math.min(
      100,
      Math.max(0, Math.round((Number(progressSeconds) / totalDuration) * 100))
    );
    const isCompleted = percentage >= 90;

    const progress = await WatchProgress.findOneAndUpdate(
      { userId, recordingId },
      {
        progressSeconds: Number(progressSeconds),
        durationSeconds: totalDuration,
        progressPercentage: percentage,
        isCompleted,
        lastWatchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      data: {
        recordingId: progress.recordingId,
        progressSeconds: progress.progressSeconds,
        durationSeconds: progress.durationSeconds,
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.isCompleted,
        lastWatchedAt: progress.lastWatchedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recordings/:id/progress (Get user progress for single recording)
const getProgress = async (req, res, next) => {
  try {
    const progress = await WatchProgress.findOne({
      userId: req.user._id,
      recordingId: req.params.id,
    });

    res.json({
      success: true,
      data: progress || {
        progressSeconds: 0,
        durationSeconds: 0,
        progressPercentage: 0,
        isCompleted: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recordings/continue-watching (Get user's in-progress recordings)
const getContinueWatching = async (req, res, next) => {
  try {
    const progressItems = await WatchProgress.find({
      userId: req.user._id,
      progressPercentage: { $gt: 0, $lt: 95 },
    })
      .sort({ lastWatchedAt: -1 })
      .limit(10)
      .populate({
        path: 'recordingId',
        match: { isPublished: true },
        populate: { path: 'mediumId', select: 'name slug coverImage' },
      });

    // Filter out any where recording was deleted or unpublished
    const activeItems = progressItems
      .filter((p) => p.recordingId)
      .map((p) => {
        const recObj = p.recordingId.toObject();
        delete recObj.muxPlaybackId;
        delete recObj.videoUrl;
        delete recObj.streamUrl;

        return {
          _id: p._id,
          recording: recObj,
          progressSeconds: p.progressSeconds,
          durationSeconds: p.durationSeconds,
          progressPercentage: p.progressPercentage,
          isCompleted: p.isCompleted,
          lastWatchedAt: p.lastWatchedAt,
        };
      });

    res.json({ success: true, data: activeItems });
  } catch (error) {
    next(error);
  }
};

// POST /api/recordings (admin)
const createRecording = async (req, res, next) => {
  try {
    const recording = await RecordedSession.create(req.body);
    await recording.populate('mediumId', 'name slug');
    res.status(201).json({ success: true, data: recording });
  } catch (error) {
    next(error);
  }
};

// PUT /api/recordings/:id (admin)
const updateRecording = async (req, res, next) => {
  try {
    const recording = await RecordedSession.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('mediumId', 'name slug');
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });
    res.json({ success: true, data: recording });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/recordings/:id (admin)
const deleteRecording = async (req, res, next) => {
  try {
    const recording = await RecordedSession.findByIdAndDelete(req.params.id);
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });
    await WatchProgress.deleteMany({ recordingId: req.params.id });
    res.json({ success: true, message: 'Recording deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecordings,
  playRecording,
  updateProgress,
  getProgress,
  getContinueWatching,
  createRecording,
  updateRecording,
  deleteRecording,
};
