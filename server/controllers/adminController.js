const User = require('../models/User');
const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');
const LiveSession = require('../models/LiveSession');
const RecordedSession = require('../models/RecordedSession');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeSubscribers,
      activeLiveSessions,
      totalRecordings,
      totalGallery,
      totalMediums,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionStatus: 'active' }),
      LiveSession.countDocuments({ status: 'live' }),
      RecordedSession.countDocuments({ isPublished: true }),
      GalleryItem.countDocuments({ isPublished: true }),
      Medium.countDocuments({ isActive: true }),
    ]);

    // Revenue from billing history (approximate)
    const revenueResult = await User.aggregate([
      { $unwind: '$billingHistory' },
      { $match: { 'billingHistory.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$billingHistory.amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Monthly user growth for chart
    const monthlyGrowth = await User.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSubscribers,
        activeLiveSessions,
        totalRecordings,
        totalGallery,
        totalMediums,
        totalRevenue,
        monthlyGrowth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
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

    res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/role
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(422).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
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
    res.json({ success: true, message: 'Device logged out' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getUsers, changeUserRole, forceLogoutDevice };
