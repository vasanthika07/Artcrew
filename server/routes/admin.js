const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  forceLogoutDevice,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// All admin routes strictly require authentication + admin role server-side
router.use(authenticate, requireRole('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.delete('/users/:userId/devices/:deviceId', forceLogoutDevice);

module.exports = router;
