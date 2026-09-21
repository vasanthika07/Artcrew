const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  refresh,
  getDevices,
  revokeDevice,
  getMe,
  updateProfile,
  resetPassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', resetPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.get('/devices', authenticate, getDevices);
router.delete('/devices/:deviceId', authenticate, revokeDevice);

module.exports = router;
