const LiveSession = require('../models/LiveSession');
const { TIER_HIERARCHY } = require('../middleware/authorize');

/**
 * Computes runtime session status based on scheduled time and duration
 */
const computeRuntimeStatus = (session) => {
  if (!session.scheduledAt) return session.status || 'scheduled';
  if (session.status === 'ended') return 'ended';

  const now = new Date().getTime();
  const startTime = new Date(session.scheduledAt).getTime();
  const durationMs = (session.durationMinutes || 60) * 60 * 1000;
  const endTime = startTime + durationMs;

  if (now >= startTime && now <= endTime) {
    return 'live';
  } else if (now > endTime) {
    return 'ended';
  }
  return 'scheduled';
};

// GET /api/live-sessions
const getLiveSessions = async (req, res, next) => {
  try {
    const { status, medium } = req.query;
    const filter = { isPublished: true };
    if (medium) filter.mediumId = medium;

    const sessions = await LiveSession.find(filter)
      .populate('mediumId', 'name slug coverImage')
      .sort({ scheduledAt: 1 })
      .lean();

    // Sanitize streamUrl from public list and compute real-time status
    const sanitized = sessions.map((s) => {
      const currentStatus = s.status === 'ended' ? 'ended' : computeRuntimeStatus(s);
      delete s.streamUrl;
      return {
        ...s,
        status: currentStatus,
      };
    });

    // Filter by computed status if requested
    const filtered = status
      ? sanitized.filter((s) => s.status === status)
      : sanitized;

    res.json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
};

// GET /api/live-sessions/:id
const getLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('mediumId', 'name slug coverImage')
      .lean();

    if (!session || !session.isPublished) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }

    const currentStatus = session.status === 'ended' ? 'ended' : computeRuntimeStatus(session);

    // Strip streamUrl from public details
    delete session.streamUrl;

    res.json({
      success: true,
      data: {
        ...session,
        status: currentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/live-sessions/:id/join (Subscription-gated with server-side authorization)
const joinLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate('mediumId', 'name slug');
    if (!session || !session.isPublished) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const currentStatus = session.status === 'ended' ? 'ended' : computeRuntimeStatus(session);

    if (currentStatus === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This live session has already ended.',
        code: 'SESSION_ENDED',
      });
    }

    // Strict server-side subscription verification
    if (req.user.role !== 'admin') {
      if (req.user.subscriptionStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required to join this live session.',
          code: 'SUBSCRIPTION_REQUIRED',
          requiredTier: session.requiredTier,
        });
      }

      if (req.user.subscriptionExpiresAt && new Date(req.user.subscriptionExpiresAt) < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please renew to join live sessions.',
          code: 'SUBSCRIPTION_EXPIRED',
          requiredTier: session.requiredTier,
        });
      }

      const userTier = (req.user.subscriptionTier || '').toLowerCase();
      const userTierLevel = TIER_HIERARCHY[userTier] || 0;
      const requiredTierLevel = TIER_HIERARCHY[(session.requiredTier || 'basic').toLowerCase()] || 1;

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          message: `This live session requires a ${session.requiredTier.toUpperCase()} subscription.`,
          code: 'UPGRADE_REQUIRED',
          requiredTier: session.requiredTier,
          currentTier: req.user.subscriptionTier,
        });
      }
    }

    // Stream URL is only returned to authorized users
    res.json({
      success: true,
      streamUrl: session.streamUrl || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: session.title,
      host: session.host,
      status: currentStatus,
      requiredTier: session.requiredTier,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/live-sessions (admin)
const createLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.create(req.body);
    await session.populate('mediumId', 'name slug');
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// PUT /api/live-sessions/:id (admin)
const updateLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('mediumId', 'name slug');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/live-sessions/:id (admin)
const deleteLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveSessions,
  getLiveSession,
  joinLiveSession,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession,
};
