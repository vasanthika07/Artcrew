const express = require('express');
const router = express.Router();
const {
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

// Progress tracking & access management routes
router.get('/progress/stats', getProgressStats);
router.get('/progress', getAllProgress);
router.get('/progress/user/:userId', getUserDetailedProgress);
router.put('/progress/user/:userId/recording/:recordingId', updateUserProgress);
router.post('/progress/user/:userId', addUserProgress);
router.delete('/progress/user/:userId/recording/:recordingId', deleteUserProgress);

module.exports = router;
