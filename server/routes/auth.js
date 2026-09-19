const express = require('express');
const router = express.Router();
const { signup, login, logout, refresh, getDevices, revokeDevice, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get('/devices', authenticate, getDevices);
router.delete('/devices/:deviceId', authenticate, revokeDevice);

module.exports = router;
