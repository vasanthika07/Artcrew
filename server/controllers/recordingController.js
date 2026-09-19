const RecordedSession = require('../models/RecordedSession');
const VideoService = require('../services/VideoService');

// GET /api/recordings
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

    // Strip stream URLs from public listing — only include thumbnail
    const sanitized = recordings.map((r) => {
      const obj = r.toObject();
      delete obj.muxPlaybackId;
      delete obj.streamUrl;
      return obj;
    });

    res.json({ success: true, data: sanitized, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    next(error);
  }
};

// GET /api/recordings/:id/play (subscription-gated)
const playRecording = async (req, res, next) => {
  try {
    const recording = await RecordedSession.findById(req.params.id);
    if (!recording || !recording.isPublished) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    // Generate a signed/temporary playback URL via VideoService
    const playbackUrl = await VideoService.getSignedUrl(recording.muxPlaybackId || recording.videoUrl);

    res.json({ success: true, playbackUrl, title: recording.title, durationSeconds: recording.durationSeconds });
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
    res.json({ success: true, message: 'Recording deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecordings, playRecording, createRecording, updateRecording, deleteRecording };
