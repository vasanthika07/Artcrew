/**
 * Role-based access control middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

/**
 * Subscription tier access control middleware
 * Tiers hierarchy: basic (1) < pro (2) < studio (3)
 */
const TIER_HIERARCHY = { basic: 1, pro: 2, studio: 3 };

/**
 * Validates actual active subscription state server-side
 * @param {string} requiredTier - 'basic' | 'pro' | 'studio'
 */
const requireActiveSubscription = (requiredTier = 'basic') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Admins bypass subscription checks
    if (req.user.role === 'admin') {
      return next();
    }

    // Check status
    if (req.user.subscriptionStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this content',
        code: 'SUBSCRIPTION_REQUIRED',
        requiredTier,
      });
    }

    // Check expiration if set
    if (req.user.subscriptionExpiresAt && new Date(req.user.subscriptionExpiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED',
        requiredTier,
      });
    }

    // Check tier level
    const userTier = (req.user.subscriptionTier || '').toLowerCase();
    const userTierLevel = TIER_HIERARCHY[userTier] || 0;
    const requiredTierLevel = TIER_HIERARCHY[requiredTier.toLowerCase()] || 1;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        message: `This content requires a ${requiredTier.toUpperCase()} plan. Your current plan is ${req.user.subscriptionTier || 'Free'}.`,
        code: 'UPGRADE_REQUIRED',
        requiredTier,
        currentTier: req.user.subscriptionTier,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireActiveSubscription,
  requireSubscription: requireActiveSubscription, // Alias for backward compatibility
  TIER_HIERARCHY,
};
