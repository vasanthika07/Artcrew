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
 * Tiers: basic < pro < studio
 */
const TIER_HIERARCHY = { basic: 1, pro: 2, studio: 3 };

const requireSubscription = (requiredTier) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Admins bypass subscription checks
    if (req.user.role === 'admin') return next();

    if (req.user.subscriptionStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    const userTierLevel = TIER_HIERARCHY[req.user.subscriptionTier] || 0;
    const requiredTierLevel = TIER_HIERARCHY[requiredTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        message: `This content requires a ${requiredTier} subscription`,
        code: 'UPGRADE_REQUIRED',
        requiredTier,
      });
    }

    next();
  };
};

module.exports = { requireRole, requireSubscription };
