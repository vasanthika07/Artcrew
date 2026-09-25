const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const generateAccessToken = (userId, deviceId) => {
  return jwt.sign({ userId, deviceId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

const generateRefreshToken = (userId, deviceId) => {
  return jwt.sign({ userId, deviceId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
};

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(422).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(422).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const deviceId = req.body.deviceId || uuidv4();
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const isAdminEmail = cleanEmail === 'jvasanthika@gmail.com' || cleanEmail.startsWith('admin@');
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: isAdminEmail ? 'admin' : 'user',
    });

    const accessToken = generateAccessToken(user._id, deviceId);
    const refreshToken = generateRefreshToken(user._id, deviceId);

    user.devices = [
      {
        deviceId,
        refreshToken,
        userAgent,
        lastActive: new Date(),
        createdAt: new Date(),
      },
    ];
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      deviceId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, deviceId: clientDeviceId } = req.body;

    if (!email || !password) {
      return res.status(422).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Ensure designated admin email has admin role
    if (user.email.toLowerCase() === 'jvasanthika@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const deviceId = clientDeviceId || uuidv4();
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!Array.isArray(user.devices)) {
      user.devices = [];
    }

    // Check if this deviceId already exists in user's devices
    const existingDeviceIndex = user.devices.findIndex((d) => d.deviceId === deviceId);

    if (existingDeviceIndex !== -1) {
      // Update existing device
      const refreshToken = generateRefreshToken(user._id, deviceId);
      user.devices[existingDeviceIndex].refreshToken = refreshToken;
      user.devices[existingDeviceIndex].lastActive = new Date();
      user.devices[existingDeviceIndex].userAgent = userAgent;
      await user.save();

      const accessToken = generateAccessToken(user._id, deviceId);
      return res.json({
        success: true,
        accessToken,
        refreshToken,
        deviceId,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionTier: user.subscriptionTier,
        },
      });
    }

    // New device — check device limit
    const maxAllowedDevices = user.maxDevices || 2;
    if (user.devices.length >= maxAllowedDevices) {
      return res.status(403).json({
        success: false,
        message: `${maxAllowedDevices} devices are already active. Log out another device to continue.`,
        code: 'DEVICE_LIMIT_REACHED',
        devices: user.devices.map((d) => ({
          deviceId: d.deviceId,
          userAgent: d.userAgent,
          lastActive: d.lastActive,
        })),
      });
    }

    // Add new device
    const refreshToken = generateRefreshToken(user._id, deviceId);
    user.devices.push({ deviceId, refreshToken, userAgent, lastActive: new Date(), createdAt: new Date() });
    await user.save();

    const accessToken = generateAccessToken(user._id, deviceId);
    res.json({
      success: true,
      accessToken,
      refreshToken,
      deviceId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const user = req.user;

    if (deviceId) {
      user.devices = user.devices.filter((d) => d.deviceId !== deviceId);
    } else if (req.deviceId) {
      user.devices = user.devices.filter((d) => d.deviceId !== req.deviceId);
    }
    await user.save();

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken, deviceId } = req.body;

    if (!refreshToken || !deviceId) {
      return res.status(422).json({ success: false, message: 'refreshToken and deviceId are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const deviceIndex = user.devices.findIndex(
      (d) => d.deviceId === deviceId && d.refreshToken === refreshToken
    );

    if (deviceIndex === -1) {
      return res.status(401).json({ success: false, message: 'Device not recognised or token revoked' });
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken(user._id, deviceId);
    const newAccessToken = generateAccessToken(user._id, deviceId);

    user.devices[deviceIndex].refreshToken = newRefreshToken;
    user.devices[deviceIndex].lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/devices
const getDevices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const devices = user.devices.map((d) => ({
      deviceId: d.deviceId,
      userAgent: d.userAgent,
      lastActive: d.lastActive,
      isCurrent: d.deviceId === req.deviceId,
    }));
    res.json({ success: true, devices });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/devices/:deviceId
const revokeDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const user = await User.findById(req.user._id);

    const deviceExists = user.devices.some((d) => d.deviceId === deviceId);
    if (!deviceExists) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    user.devices = user.devices.filter((d) => d.deviceId !== deviceId);
    await user.save();

    res.json({ success: true, message: 'Device logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -devices')
      .populate('subscriptionId', 'name slug price billingPeriod');
    res.json({ success: true, data: user, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(422).json({ success: false, message: 'Name is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    ).select('-passwordHash -devices');
    res.json({ success: true, data: user, user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password or /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(422).json({
        success: false,
        message: 'Email and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(422).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(422).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;

    // Reset device refresh tokens to ensure clean session state
    user.devices = [];
    await user.save();

    res.json({
      success: true,
      message: 'Password successfully updated. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  refresh,
  getDevices,
  revokeDevice,
  getMe,
  updateProfile,
  resetPassword,
};
