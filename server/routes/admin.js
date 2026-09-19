const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, changeUserRole, forceLogoutDevice } = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:userId/devices/:deviceId', forceLogoutDevice);

module.exports = router;
