const LiveSession = require('../models/LiveSession');

// GET /api/live-sessions
const getLiveSessions = async (req, res, next) => {
  try {
    const { status, medium } = req.query;
    const filter = { isPublished: true };
    if (status) filter.status = status;

    const sessions = await LiveSession.find(filter)
      .populate('mediumId', 'name slug coverImage')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/live-sessions/:id
const getLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate('mediumId', 'name slug coverImage');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// GET /api/live-sessions/:id/join (subscription-gated)
const joinLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Session is not currently live' });
    }
    // Stream URL is only returned to authorized users
    res.json({ success: true, streamUrl: session.streamUrl });
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

module.exports = { getLiveSessions, getLiveSession, joinLiveSession, createLiveSession, updateLiveSession, deleteLiveSession };
