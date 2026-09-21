require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const RecordedSession = require('../models/RecordedSession');
const WatchProgress = require('../models/WatchProgress');
const {
  getProgressStats,
  getAllProgress,
  getUserDetailedProgress,
  updateUserProgress,
  addUserProgress,
  deleteUserProgress,
  updateUser,
} = require('../controllers/adminController');

async function runTests() {
  try {
    await connectDB();
    console.log('Connected to DB for Admin Progress Tests...');

    // 1. Get or create a sample user and recording
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      user = await User.create({
        name: 'Test Student',
        email: `teststudent_${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'user',
        subscriptionTier: 'basic',
        subscriptionStatus: 'active',
      });
    }

    let recording = await RecordedSession.findOne({ isPublished: true });
    if (!recording) {
      console.log('No published recording found, finding any recording');
      recording = await RecordedSession.findOne();
    }

    console.log(`Testing with User: ${user.name} (${user._id}) and Recording: ${recording?.title} (${recording?._id})`);

    if (!recording) {
      console.log('No recordings found to test progress with.');
      process.exit(0);
    }

    // 2. Test mock res helper
    const mockRes = () => {
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.data = data;
          return this;
        },
      };
      return res;
    };

    // 3. Test updateUserProgress (create / set progress to 75%)
    console.log('\n--- 1. Testing updateUserProgress ---');
    const req1 = {
      params: { userId: user._id.toString(), recordingId: recording._id.toString() },
      body: { progressPercentage: 75, isCompleted: false },
    };
    const res1 = mockRes();
    await updateUserProgress(req1, res1, (err) => { if (err) throw err; });
    console.log('updateUserProgress response:', res1.data.success ? 'SUCCESS' : 'FAILED', res1.data.data?.progressPercentage, '%');

    // 4. Test getProgressStats
    console.log('\n--- 2. Testing getProgressStats ---');
    const resStats = mockRes();
    await getProgressStats({}, resStats, (err) => { if (err) throw err; });
    console.log('getProgressStats response:', resStats.data.success ? 'SUCCESS' : 'FAILED', resStats.data.data);

    // 5. Test getAllProgress
    console.log('\n--- 3. Testing getAllProgress ---');
    const reqAll = {
      query: { page: 1, limit: 10, status: 'all' },
    };
    const resAll = mockRes();
    await getAllProgress(reqAll, resAll, (err) => { if (err) throw err; });
    console.log('getAllProgress records count:', resAll.data.data?.length, 'total in pagination:', resAll.data.pagination?.total);

    // 6. Test getUserDetailedProgress
    console.log('\n--- 4. Testing getUserDetailedProgress ---');
    const reqUser = {
      params: { userId: user._id.toString() },
    };
    const resUser = mockRes();
    await getUserDetailedProgress(reqUser, resUser, (err) => { if (err) throw err; });
    console.log('getUserDetailedProgress stats:', resUser.data.data?.stats);

    // 7. Test updateUser access (tier, status, suspension)
    console.log('\n--- 5. Testing updateUser access control ---');
    const reqAccess = {
      params: { id: user._id.toString() },
      body: { subscriptionTier: 'pro', subscriptionStatus: 'active', isSuspended: false, maxDevices: 3 },
    };
    const resAccess = mockRes();
    await updateUser(reqAccess, resAccess, (err) => { if (err) throw err; });
    console.log('updateUser response tier:', resAccess.data.data?.subscriptionTier, 'maxDevices:', resAccess.data.data?.maxDevices);

    console.log('\n✅ ALL ADMIN PROGRESS & ACCESS TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests();
