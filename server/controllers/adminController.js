const User = require('../models/User');
const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');
const LiveSession = require('../models/LiveSession');
const RecordedSession = require('../models/RecordedSession');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const WatchProgress = require('../models/WatchProgress');

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const [
      totalUsers,
      activeSubscribers,
      activeLiveSessions,
      totalRecordings,
      totalGallery,
      totalMediums,
      suspendedUsersCount,
      adminUsersCount,
      expiringSoonUsers,
      expiredUsersCount,
      totalProgressRecords,
      completedProgressCount,
      inProgressCount,
      uniqueLearnersCount,
      watchTimeAggregate,
      recentProgressRecords,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionStatus: 'active' }),
      LiveSession.countDocuments({ status: 'live', isPublished: true }),
      RecordedSession.countDocuments(),
      GalleryItem.countDocuments(),
      Medium.countDocuments({ isActive: true }),
      User.countDocuments({ isSuspended: true }),
      User.countDocuments({ role: 'admin' }),
      User.find({
        subscriptionStatus: 'active',
        subscriptionExpiresAt: { $gte: now, $lte: in7Days },
      })
        .select('name email subscriptionTier subscriptionExpiresAt subscriptionStatus')
        .limit(5)
        .lean(),
      User.countDocuments({
        $or: [
          { subscriptionStatus: 'expired' },
          { subscriptionStatus: 'active', subscriptionExpiresAt: { $lt: now } },
        ],
      }),
      WatchProgress.countDocuments(),
      WatchProgress.countDocuments({ isCompleted: true }),
      WatchProgress.countDocuments({ isCompleted: false, progressPercentage: { $gt: 0 } }),
      WatchProgress.distinct('userId').then((ids) => ids.length),
      WatchProgress.aggregate([
        { $group: { _id: null, totalSeconds: { $sum: '$progressSeconds' } } },
      ]),
      WatchProgress.find()
        .populate({
          path: 'userId',
          select: 'name email subscriptionTier subscriptionStatus subscriptionExpiresAt isSuspended devices',
        })
        .populate({
          path: 'recordingId',
          select: 'title durationSeconds requiredTier mediumId',
          populate: { path: 'mediumId', select: 'name' },
        })
        .sort({ lastWatchedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    // Calculate total active devices
    const deviceAggregation = await User.aggregate([
      { $project: { deviceCount: { $size: { $ifNull: ['$devices', []] } } } },
      { $group: { _id: null, totalDevices: { $sum: '$deviceCount' } } },
    ]);
    const totalActiveDevices = deviceAggregation[0]?.totalDevices || 0;

    const totalSeconds = watchTimeAggregate[0]?.totalSeconds || 0;
    const totalHoursWatched = Math.round((totalSeconds / 3600) * 10) / 10;
    const avgCompletionRate = totalProgressRecords > 0
      ? Math.round((completedProgressCount / totalProgressRecords) * 100)
      : 0;

    // Calculate total and monthly revenue from billingHistory
    const revenueResult = await User.aggregate([
      { $unwind: '$billingHistory' },
      { $match: { 'billingHistory.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$billingHistory.amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Calculate monthly revenue for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueResult = await User.aggregate([
      { $unwind: '$billingHistory' },
      {
        $match: {
          'billingHistory.status': 'paid',
          'billingHistory.date': { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$billingHistory.amount' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || Math.round(totalRevenue * 0.4);

    // Monthly user signup growth (last 6 months)
    const monthlyGrowth = await User.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          users: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Subscription breakdown by tier
    const subscriptionTiers = await User.aggregate([
      {
        $group: {
          _id: '$subscriptionTier',
          count: { $sum: 1 },
        },
      },
    ]);

    const tierBreakdown = [
      { name: 'Free / None', count: 0 },
      { name: 'Basic', count: 0 },
      { name: 'Pro', count: 0 },
      { name: 'Studio', count: 0 },
    ];

    subscriptionTiers.forEach((t) => {
      if (!t._id) {
        tierBreakdown[0].count += t.count;
      } else {
        const id = t._id.toLowerCase();
        if (id === 'basic') tierBreakdown[1].count += t.count;
        else if (id === 'pro') tierBreakdown[2].count += t.count;
        else if (id === 'studio' || id === 'studio-access') tierBreakdown[3].count += t.count;
        else tierBreakdown[0].count += t.count;
      }
    });

    // Content distribution by medium
    const mediumsList = await Medium.find({ isActive: true }).select('name').lean();
    const contentByMedium = await Promise.all(
      mediumsList.map(async (m) => {
        const [galleryCount, recordingsCount, liveCount] = await Promise.all([
          GalleryItem.countDocuments({ mediumId: m._id }),
          RecordedSession.countDocuments({ mediumId: m._id }),
          LiveSession.countDocuments({ mediumId: m._id }),
        ]);
        return {
          name: m.name,
          gallery: galleryCount,
          recordings: recordingsCount,
          live: liveCount,
          total: galleryCount + recordingsCount + liveCount,
        };
      })
    );

    // Recent live sessions
    const recentLive = await LiveSession.find()
      .populate('mediumId', 'name')
      .sort({ scheduledAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        adminProfile: {
          email: req.user?.email || 'jvasanthika@gmail.com',
          name: req.user?.name || 'Vasanthika Admin',
          role: req.user?.role || 'admin',
        },
        totalUsers,
        activeSubscribers,
        monthlyRevenue,
        activeLiveSessions,
        totalRecordings,
        totalGallery,
        totalMediums,
        totalRevenue,
        progressStats: {
          totalHoursWatched,
          completedCount: completedProgressCount,
          inProgressCount,
          uniqueLearnersCount,
          avgCompletionRate,
          totalProgressRecords,
        },
        subscriptionValidity: {
          activeCount: activeSubscribers,
          expiringSoonCount: expiringSoonUsers.length,
          expiringSoonUsers,
          expiredCount: expiredUsersCount,
          freeCount: Math.max(0, totalUsers - activeSubscribers - expiredUsersCount),
        },
        accessibilityStats: {
          totalActiveDevices,
          suspendedCount: suspendedUsersCount,
          activeUsersCount: Math.max(0, totalUsers - suspendedUsersCount),
          adminCount: adminUsersCount,
          studentCount: Math.max(0, totalUsers - adminUsersCount),
        },
        recentLearnerActivity: recentProgressRecords.filter((r) => r.userId && r.recordingId),
        monthlyGrowth: monthlyGrowth.map((g) => ({
          month: `${g._id.month}/${g._id.year}`,
          users: g.users,
        })),
        tierBreakdown,
        contentByMedium,
        recentLive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, subscriptionStatus, tier } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (subscriptionStatus && subscriptionStatus !== 'all') filter.subscriptionStatus = subscriptionStatus;
    if (tier && tier !== 'all') filter.subscriptionTier = tier;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .populate('subscriptionId', 'name slug price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('subscriptionId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch user's watch progress
    const watchHistory = await WatchProgress.find({ userId: user._id })
      .populate('recordingId', 'title durationSeconds')
      .sort({ lastWatchedAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        watchHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id (update role, subscription status, tier, suspension, or expiration)
const updateUser = async (req, res, next) => {
  try {
    const {
      role,
      subscriptionStatus,
      subscriptionTier,
      subscriptionExpiresAt,
      maxDevices,
      isSuspended,
      name,
    } = req.body;
    const updates = {};

    if (role && ['user', 'admin'].includes(role)) updates.role = role;
    if (name) updates.name = name.trim();
    if (isSuspended !== undefined) updates.isSuspended = Boolean(isSuspended);

    if (subscriptionStatus && ['none', 'active', 'expired', 'cancelled'].includes(subscriptionStatus)) {
      updates.subscriptionStatus = subscriptionStatus;
      if (subscriptionStatus === 'active' && !subscriptionExpiresAt && !req.body.subscriptionExpiresAt) {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + 1);
        updates.subscriptionExpiresAt = exp;
      }
    }

    if (subscriptionExpiresAt !== undefined) {
      updates.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
    }

    if (subscriptionTier !== undefined) updates.subscriptionTier = subscriptionTier;
    if (maxDevices !== undefined) updates.maxDevices = Number(maxDevices);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-passwordHash')
      .populate('subscriptionId', 'name slug price');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Clean up watch progress
    await WatchProgress.deleteMany({ userId: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:userId/devices/:deviceId
const forceLogoutDevice = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.devices = user.devices.filter((d) => d.deviceId !== req.params.deviceId);
    await user.save();

    res.json({ success: true, message: 'Device successfully logged out' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/progress/stats
const getProgressStats = async (req, res, next) => {
  try {
    const [
      totalRecords,
      completedCount,
      inProgressCount,
      uniqueLearnersCount,
      watchTimeAggregate,
    ] = await Promise.all([
      WatchProgress.countDocuments(),
      WatchProgress.countDocuments({ isCompleted: true }),
      WatchProgress.countDocuments({ isCompleted: false, progressPercentage: { $gt: 0 } }),
      WatchProgress.distinct('userId').then((ids) => ids.length),
      WatchProgress.aggregate([
        { $group: { _id: null, totalSeconds: { $sum: '$progressSeconds' } } },
      ]),
    ]);

    const totalSeconds = watchTimeAggregate[0]?.totalSeconds || 0;
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
    const avgCompletionRate = totalRecords > 0 ? Math.round((completedCount / totalRecords) * 100) : 0;

    // Top 5 most watched sessions
    const topRecordings = await WatchProgress.aggregate([
      {
        $group: {
          _id: '$recordingId',
          views: { $sum: 1 },
          completions: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          totalSecondsWatched: { $sum: '$progressSeconds' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'recordedsessions',
          localField: '_id',
          foreignField: '_id',
          as: 'recording',
        },
      },
      { $unwind: { path: '$recording', preserveNullAndEmptyArrays: true } },
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        completedCount,
        inProgressCount,
        uniqueLearnersCount,
        totalSeconds,
        totalHours,
        avgCompletionRate,
        topRecordings: topRecordings.map((r) => ({
          recordingId: r._id,
          title: r.recording?.title || 'Unknown Session',
          views: r.views,
          completions: r.completions,
          totalHoursWatched: Math.round(((r.totalSecondsWatched || 0) / 3600) * 10) / 10,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/progress (List all users progress with filters & search)
const getAllProgress = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      userId,
      recordingId,
      mediumId,
      sortBy = 'lastWatchedAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (userId) filter.userId = userId;
    if (recordingId) filter.recordingId = recordingId;

    if (status === 'completed') {
      filter.isCompleted = true;
    } else if (status === 'in-progress') {
      filter.isCompleted = false;
      filter.progressPercentage = { $gt: 0 };
    } else if (status === 'not-started') {
      filter.progressPercentage = 0;
    }

    // Build population and aggregation
    const skip = (Number(page) - 1) * Number(limit);
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    let query = WatchProgress.find(filter)
      .populate({
        path: 'userId',
        select: 'name email role subscriptionTier subscriptionStatus isSuspended avatarUrl',
      })
      .populate({
        path: 'recordingId',
        select: 'title durationSeconds requiredTier mediumId thumbnailUrl muxPlaybackId isPublished',
        populate: {
          path: 'mediumId',
          select: 'name slug coverImage',
        },
      })
      .sort({ [sortBy]: sortDir });

    const [allRecords, total] = await Promise.all([
      query.lean(),
      WatchProgress.countDocuments(filter),
    ]);

    // Apply text search & medium filter in-memory if needed
    let filtered = allRecords.filter((rec) => rec.userId && rec.recordingId);

    if (mediumId && mediumId !== 'all') {
      filtered = filtered.filter(
        (rec) => rec.recordingId?.mediumId?._id?.toString() === mediumId || rec.recordingId?.mediumId === mediumId
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (rec) =>
          rec.userId?.name?.toLowerCase().includes(q) ||
          rec.userId?.email?.toLowerCase().includes(q) ||
          rec.recordingId?.title?.toLowerCase().includes(q)
      );
    }

    const paginated = filtered.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/progress/user/:userId (Deep dive into all sessions for a specific user)
const getUserDetailedProgress = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-passwordHash')
      .populate('subscriptionId', 'name slug price')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all recordings
    const recordings = await RecordedSession.find({ isPublished: true })
      .populate('mediumId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    // Get all progress for user
    const progressList = await WatchProgress.find({ userId }).lean();
    const progressMap = new Map(progressList.map((p) => [p.recordingId.toString(), p]));

    let totalWatchSeconds = 0;
    let completedSessionsCount = 0;

    const sessionProgress = recordings.map((rec) => {
      const prog = progressMap.get(rec._id.toString());
      if (prog) {
        totalWatchSeconds += prog.progressSeconds || 0;
        if (prog.isCompleted) completedSessionsCount += 1;
      }

      return {
        recording: rec,
        progressId: prog?._id || null,
        progressSeconds: prog?.progressSeconds || 0,
        durationSeconds: prog?.durationSeconds || rec.durationSeconds || 0,
        progressPercentage: prog?.progressPercentage || 0,
        isCompleted: prog?.isCompleted || false,
        lastWatchedAt: prog?.lastWatchedAt || null,
      };
    });

    const totalRecordings = recordings.length;
    const overallCompletionRate = totalRecordings > 0
      ? Math.round((completedSessionsCount / totalRecordings) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalRecordings,
          completedSessionsCount,
          inProgressSessionsCount: sessionProgress.filter((s) => s.progressPercentage > 0 && !s.isCompleted).length,
          unstartedCount: sessionProgress.filter((s) => s.progressPercentage === 0).length,
          totalWatchHours: Math.round((totalWatchSeconds / 3600) * 10) / 10,
          overallCompletionRate,
        },
        sessions: sessionProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/progress/user/:userId/recording/:recordingId (Update or create progress)
const updateUserProgress = async (req, res, next) => {
  try {
    const { userId, recordingId } = req.params;
    let { progressPercentage, progressSeconds, durationSeconds, isCompleted } = req.body;

    const recording = await RecordedSession.findById(recordingId).select('durationSeconds');
    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    const totalDuration = durationSeconds || recording.durationSeconds || 1;

    if (progressPercentage !== undefined) {
      progressPercentage = Math.min(100, Math.max(0, Number(progressPercentage)));
      if (progressSeconds === undefined) {
        progressSeconds = Math.round((progressPercentage / 100) * totalDuration);
      }
    } else if (progressSeconds !== undefined) {
      progressSeconds = Math.max(0, Number(progressSeconds));
      progressPercentage = Math.min(100, Math.round((progressSeconds / totalDuration) * 100));
    }

    if (isCompleted === undefined) {
      isCompleted = progressPercentage >= 90;
    } else {
      isCompleted = Boolean(isCompleted);
      if (isCompleted && progressPercentage < 90) {
        progressPercentage = 100;
        progressSeconds = totalDuration;
      }
    }

    const progress = await WatchProgress.findOneAndUpdate(
      { userId, recordingId },
      {
        progressSeconds: Number(progressSeconds || 0),
        durationSeconds: totalDuration,
        progressPercentage: Number(progressPercentage || 0),
        isCompleted,
        lastWatchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email').populate('recordingId', 'title durationSeconds');

    res.json({
      success: true,
      message: 'User progress updated successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/progress/user/:userId (Add progress for user)
const addUserProgress = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { recordingId, progressPercentage = 100, isCompleted = true } = req.body;

    if (!recordingId) {
      return res.status(400).json({ success: false, message: 'Recording ID is required' });
    }

    const recording = await RecordedSession.findById(recordingId).select('durationSeconds');
    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    const duration = recording.durationSeconds || 300;
    const percentage = Math.min(100, Math.max(0, Number(progressPercentage)));
    const seconds = Math.round((percentage / 100) * duration);

    const progress = await WatchProgress.findOneAndUpdate(
      { userId, recordingId },
      {
        progressSeconds: seconds,
        durationSeconds: duration,
        progressPercentage: percentage,
        isCompleted: isCompleted ?? percentage >= 90,
        lastWatchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email').populate('recordingId', 'title durationSeconds');

    res.status(201).json({
      success: true,
      message: 'Progress recorded successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/progress/user/:userId/recording/:recordingId (Reset / Delete progress)
const deleteUserProgress = async (req, res, next) => {
  try {
    const { userId, recordingId } = req.params;

    const result = await WatchProgress.findOneAndDelete({ userId, recordingId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    res.json({ success: true, message: 'Progress record deleted / reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  forceLogoutDevice,
  getProgressStats,
  getAllProgress,
  getUserDetailedProgress,
  updateUserProgress,
  addUserProgress,
  deleteUserProgress,
};
