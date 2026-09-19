const axios = require('axios');
const crypto = require('crypto');

const API_BASE = 'http://localhost:5000/api';
const client = axios.create({
  baseURL: API_BASE,
  validateStatus: () => true, // Don't throw on error status codes
});

const results = {
  pass: [],
  fail: [],
  warnings: [],
};

function logPass(flow, desc) {
  results.pass.push(`[${flow}] ${desc}`);
  console.log(`✅ [${flow}] ${desc}`);
}

function logFail(flow, desc, error) {
  results.fail.push(`[${flow}] ${desc} -> ${JSON.stringify(error)}`);
  console.error(`❌ [${flow}] ${desc}:`, error);
}

async function runAudit() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   🎨 ARTCREW COMPREHENSIVE END-TO-END QA AUDIT   ');
  console.log('═══════════════════════════════════════════════════════════\n');

  let testUserToken = null;
  let testUserId = null;
  let subscriberToken = null;
  let subscriberId = null;
  let adminToken = null;
  let createdMediumId = null;
  let createdRecordingId = null;
  let createdLiveSessionId = null;
  let createdGalleryId = null;
  let createdPlanId = null;
  let basicPlan = null;
  let proPlan = null;

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 1: VISITOR BROWSING
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 1: VISITOR BROWSING ---');
  try {
    const health = await client.get('http://localhost:5000/health');
    if (health.status === 200 && health.data.success) {
      logPass('FLOW 1', 'Health check endpoint returns 200 OK');
    } else {
      logFail('FLOW 1', 'Health check failed', health.status);
    }

    const mediums = await client.get('/mediums');
    if (mediums.status === 200 && mediums.data.data?.length > 0) {
      logPass('FLOW 1', `Fetched ${mediums.data.data.length} art mediums`);
      createdMediumId = mediums.data.data[0]._id;
    } else {
      logFail('FLOW 1', 'Failed to fetch mediums', mediums.data);
    }

    const gallery = await client.get('/gallery');
    if (gallery.status === 200 && gallery.data.data?.length > 0) {
      logPass('FLOW 1', `Fetched ${gallery.data.data.length} gallery artworks`);
    } else {
      logFail('FLOW 1', 'Failed to fetch gallery items', gallery.data);
    }

    const studios = await client.get('/studios/nearby?latitude=12.9716&longitude=77.5946&radius=10000&medium=pottery');
    if (studios.status === 200 && Array.isArray(studios.data.data)) {
      logPass('FLOW 1', `Studio finder returned ${studios.data.data.length} nearby studios with fallback provider`);
    } else {
      logFail('FLOW 1', 'Studio finder failed', studios.data);
    }
  } catch (err) {
    logFail('FLOW 1', 'Unexpected error during Flow 1', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 2: USER SIGNUP, LOGIN & ACCOUNT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 2: USER AUTH & ACCOUNT ---');
  const uniqueEmail = `qa_user_${Date.now()}@example.com`;
  const password = 'Password@123';
  try {
    const signup = await client.post('/auth/signup', {
      name: 'QA Test Artist',
      email: uniqueEmail,
      password: password,
      deviceId: 'device-test-1',
      deviceName: 'Chrome on Windows Desktop',
    });

    if (signup.status === 201 && signup.data.success) {
      logPass('FLOW 2', 'User signup succeeded (201 Created)');
    } else {
      logFail('FLOW 2', 'User signup failed', signup.data);
    }

    // Login with device 1
    const login = await client.post('/auth/login', {
      email: uniqueEmail,
      password: password,
      deviceId: 'device-test-1',
      deviceName: 'Chrome on Windows Desktop',
    });

    if (login.status === 200 && login.data.accessToken) {
      testUserToken = login.data.accessToken;
      testUserId = login.data.user?.id || login.data.user?._id;
      logPass('FLOW 2', 'User login succeeded with accessToken and deviceId');
    } else {
      logFail('FLOW 2', 'User login failed', login.data);
    }

    // Account Me
    const me = await client.get('/auth/me', {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    if (me.status === 200 && (me.data.user?.email === uniqueEmail || me.data.data?.email === uniqueEmail)) {
      logPass('FLOW 2', 'Fetched user profile (/auth/me)');
    } else {
      logFail('FLOW 2', 'Failed fetching /auth/me', me.data);
    }

    // Update profile
    const updateProfile = await client.put(
      '/auth/profile',
      { name: 'QA Test Artist Updated' },
      { headers: { Authorization: `Bearer ${testUserToken}` } }
    );
    if (updateProfile.status === 200 && (updateProfile.data.user?.name === 'QA Test Artist Updated' || updateProfile.data.data?.name === 'QA Test Artist Updated')) {
      logPass('FLOW 2', 'Updated user profile name');
    } else {
      logFail('FLOW 2', 'Profile update failed', updateProfile.data);
    }
  } catch (err) {
    logFail('FLOW 2', 'Unexpected error during Flow 2', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 3: AI ART RECOMMENDATION ASSISTANT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 3: AI RECOMMENDATION ASSISTANT ---');
  try {
    const quizResponse = await client.post(
      '/assistant/recommend',
      {
        experienceLevel: 'beginner',
        budget: 'low',
        preferredEnvironment: 'indoor',
        cleanVsMessy: 'clean',
        relaxingVsChallenging: 'relaxing',
        soloVsClass: 'solo',
        traditionalVsDigital: 'traditional',
        artInterests: ['colors', 'landscapes'],
        availableLearningTime: '2-4 hours/week',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      { headers: { Authorization: `Bearer ${testUserToken}` } }
    );

    if (quizResponse.status === 200 && quizResponse.data.data?.medium) {
      const rec = quizResponse.data.data;
      logPass('FLOW 3', `AI Recommendation returned medium: "${rec.medium?.name || rec.medium}" with valid structure`);
      if (Array.isArray(rec.supplies)) logPass('FLOW 3', `Supplies recommended: ${rec.supplies.length} items`);
      if (Array.isArray(rec.resources)) logPass('FLOW 3', `Resources included: ${rec.resources.length} items`);
    } else {
      logFail('FLOW 3', 'AI recommendation failed', quizResponse.data);
    }
  } catch (err) {
    logFail('FLOW 3', 'Unexpected error during Flow 3', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 4: SUBSCRIPTION PLANS & RAZORPAY CHECKOUT / WEBHOOK
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 4: SUBSCRIPTIONS & CHECKOUT ---');
  const subUserEmail = `qa_subscriber_${Date.now()}@example.com`;
  try {
    await client.post('/auth/signup', {
      name: 'QA Subscriber',
      email: subUserEmail,
      password: password,
      deviceId: 'device-sub-1',
      deviceName: 'MacBook Air',
    });

    const subLogin = await client.post('/auth/login', {
      email: subUserEmail,
      password: password,
      deviceId: 'device-sub-1',
      deviceName: 'MacBook Air',
    });

    subscriberToken = subLogin.data.accessToken;
    subscriberId = subLogin.data.user?.id || subLogin.data.user?._id;

    // Fetch subscription plans
    const plansRes = await client.get('/subscriptions/plans');
    if (plansRes.status === 200 && plansRes.data.data?.length > 0) {
      logPass('FLOW 4', `Fetched ${plansRes.data.data.length} active subscription plans`);
      proPlan = plansRes.data.data.find((p) => p.slug === 'pro') || plansRes.data.data[0];
      basicPlan = plansRes.data.data.find((p) => p.slug === 'basic') || plansRes.data.data[0];
    } else {
      logFail('FLOW 4', 'Failed to fetch subscription plans', plansRes.data);
    }

    // Initiate checkout
    const checkout = await client.post(
      '/subscriptions/checkout',
      { planId: proPlan._id },
      { headers: { Authorization: `Bearer ${subscriberToken}` } }
    );

    if (checkout.status === 200 && checkout.data.data?.orderId) {
      logPass('FLOW 4', `Initiated Razorpay checkout order: ${checkout.data.data.orderId}`);
    } else {
      logFail('FLOW 4', 'Failed to create checkout order', checkout.data);
    }

    // Simulate Razorpay Webhook activation
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'artcrew_webhook_secret_abc123';
    const paymentId = `pay_test_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            amount: proPlan.price * 100,
            currency: 'INR',
            status: 'captured',
            notes: {
              userId: subscriberId,
              planId: proPlan._id,
            },
          },
        },
      },
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex');

    const webhookRes = await client.post('/subscriptions/webhook', webhookPayload, {
      headers: {
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json',
      },
    });

    if (webhookRes.status === 200 && webhookRes.data.success) {
      logPass('FLOW 4', 'Verified Razorpay payment webhook with HMAC SHA-256 signature');
    } else {
      logFail('FLOW 4', 'Payment webhook failed', webhookRes.data);
    }

    // Verify user is now active subscriber
    const subProfile = await client.get('/auth/me', {
      headers: { Authorization: `Bearer ${subscriberToken}` },
    });
    const subUserData = subProfile.data.user || subProfile.data.data;
    if (subUserData?.subscriptionStatus === 'active') {
      logPass('FLOW 4', `User subscriptionStatus successfully upgraded to 'active' (Tier: ${subUserData.subscriptionTier})`);
    } else {
      logFail('FLOW 4', 'User was not activated by webhook', subProfile.data);
    }
  } catch (err) {
    logFail('FLOW 4', 'Unexpected error during Flow 4', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 5: SUBSCRIBER RECORDINGS ACCESS & PROGRESS TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 5: SUBSCRIBER RECORDINGS ACCESS & PROGRESS ---');
  try {
    const recordings = await client.get('/recordings');
    if (recordings.status === 200 && recordings.data.data?.length > 0) {
      logPass('FLOW 5', `Fetched ${recordings.data.data.length} recorded sessions`);
      createdRecordingId = recordings.data.data[0]._id;
    }

    // Subscriber watches recording
    const watchRes = await client.get(`/recordings/${createdRecordingId}/watch`, {
      headers: { Authorization: `Bearer ${subscriberToken}` },
    });

    if (watchRes.status === 200 && watchRes.data?.playbackUrl) {
      logPass('FLOW 5', 'Subscriber received authorized video playback stream');
    } else {
      logFail('FLOW 5', 'Subscriber watch authorization failed', watchRes.data);
    }

    // Save watch progress
    const progressSave = await client.post(
      `/recordings/${createdRecordingId}/progress`,
      { progressSeconds: 340, durationSeconds: 3600 },
      { headers: { Authorization: `Bearer ${subscriberToken}` } }
    );

    if (progressSave.status === 200 && progressSave.data.success) {
      logPass('FLOW 5', 'Successfully tracked watch progress (340s)');
    } else {
      logFail('FLOW 5', 'Failed to save watch progress', progressSave.data);
    }

    // Read back progress
    const progressGet = await client.get(`/recordings/${createdRecordingId}/progress`, {
      headers: { Authorization: `Bearer ${subscriberToken}` },
    });

    if (progressGet.status === 200 && progressGet.data.data?.progressSeconds === 340) {
      logPass('FLOW 5', 'Retrieved persisted watch progress accurately');
    } else {
      logFail('FLOW 5', 'Watch progress retrieval mismatch', progressGet.data);
    }
  } catch (err) {
    logFail('FLOW 5', 'Unexpected error during Flow 5', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 6: NON-SUBSCRIBER ACCESS DENIAL TO LOCKED RECORDINGS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 6: NON-SUBSCRIBER ACCESS DENIAL ---');
  try {
    const nonSubWatch = await client.get(`/recordings/${createdRecordingId}/watch`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });

    if (nonSubWatch.status === 403) {
      logPass('FLOW 6', `Non-subscriber correctly denied (403 Forbidden, code: ${nonSubWatch.data.code})`);
    } else {
      logFail('FLOW 6', 'Expected 403 for non-subscriber watch attempt', `Received status: ${nonSubWatch.status}`);
    }
  } catch (err) {
    logFail('FLOW 6', 'Unexpected error during Flow 6', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 7: SUBSCRIBER LIVE SESSIONS ACCESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 7: SUBSCRIBER LIVE SESSIONS ---');
  try {
    const liveSessions = await client.get('/live-sessions');
    let activeSession = null;
    if (liveSessions.status === 200 && liveSessions.data.data?.length > 0) {
      logPass('FLOW 7', `Fetched ${liveSessions.data.data.length} live sessions`);
      activeSession = liveSessions.data.data.find(s => s.status !== 'ended') || liveSessions.data.data[0];
      createdLiveSessionId = activeSession._id;
    }

    const subLiveJoin = await client.get(`/live-sessions/${createdLiveSessionId}/join`, {
      headers: { Authorization: `Bearer ${subscriberToken}` },
    });

    if (subLiveJoin.status === 200 && subLiveJoin.data?.streamUrl) {
      logPass('FLOW 7', 'Subscriber successfully joined authorized live session stream');
    } else {
      logFail('FLOW 7', 'Subscriber live join failed', subLiveJoin.data);
    }
  } catch (err) {
    logFail('FLOW 7', 'Unexpected error during Flow 7', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 8: NON-SUBSCRIBER LIVE SESSIONS DENIAL
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 8: NON-SUBSCRIBER LIVE SESSION RESTRICTIONS ---');
  try {
    const nonSubLive = await client.get(`/live-sessions/${createdLiveSessionId}/join`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });

    if (nonSubLive.status === 403) {
      logPass('FLOW 8', `Non-subscriber correctly denied live session join (403 Forbidden: ${nonSubLive.data.message})`);
    } else {
      logFail('FLOW 8', 'Non-subscriber should not be able to join protected live session', nonSubLive.data);
    }
  } catch (err) {
    logFail('FLOW 8', 'Unexpected error during Flow 8', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 9: MULTI-DEVICE LOGIN & DEVICE LIMIT ENFORCEMENT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 9: DEVICE LIMIT ENFORCEMENT ---');
  const deviceTestEmail = `qa_device_test_${Date.now()}@example.com`;
  try {
    await client.post('/auth/signup', {
      name: 'QA Device Tester',
      email: deviceTestEmail,
      password: password,
    });

    // Login device 1
    const devLogin1 = await client.post('/auth/login', {
      email: deviceTestEmail,
      password: password,
      deviceId: 'device-alpha-1',
      deviceName: 'Chrome on Mac',
    });
    if (devLogin1.status === 200 && devLogin1.data.accessToken) {
      logPass('FLOW 9', 'Logged in device 1 (Chrome on Mac)');
    }

    // Login device 2
    const devLogin2 = await client.post('/auth/login', {
      email: deviceTestEmail,
      password: password,
      deviceId: 'device-beta-2',
      deviceName: 'Safari on iPhone',
    });
    if (devLogin2.status === 200 && devLogin2.data.accessToken) {
      logPass('FLOW 9', 'Logged in device 2 (Safari on iPhone)');
    }

    // Attempt device 3 (exceeds maxDevices = 2)
    const devLogin3 = await client.post('/auth/login', {
      email: deviceTestEmail,
      password: password,
      deviceId: 'device-gamma-3',
      deviceName: 'Firefox on Linux',
    });

    if (devLogin3.status === 403 && devLogin3.data.code === 'DEVICE_LIMIT_REACHED') {
      logPass('FLOW 9', 'Device 3 blocked: 403 Forbidden with DEVICE_LIMIT_REACHED');
    } else {
      logFail('FLOW 9', 'Device limit was not enforced for device 3', devLogin3.data);
    }
  } catch (err) {
    logFail('FLOW 9', 'Unexpected error during Flow 9', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 10: USER DEVICE REVOCATION & SESSION TERMINATION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 10: DEVICE REVOCATION & SESSION TERMINATION ---');
  try {
    const devLogin1 = await client.post('/auth/login', {
      email: deviceTestEmail,
      password: password,
      deviceId: 'device-alpha-1',
      deviceName: 'Chrome on Mac',
    });
    const activeToken1 = devLogin1.data.accessToken;

    const devicesRes = await client.get('/auth/devices', {
      headers: { Authorization: `Bearer ${activeToken1}` },
    });

    if (devicesRes.status === 200 && devicesRes.data.devices?.length > 0) {
      logPass('FLOW 10', `User has ${devicesRes.data.devices.length} registered active devices`);
    }

    // Revoke device-beta-2
    const revokeRes = await client.delete('/auth/devices/device-beta-2', {
      headers: { Authorization: `Bearer ${activeToken1}` },
    });

    if (revokeRes.status === 200 && revokeRes.data.success) {
      logPass('FLOW 10', 'Successfully revoked session for device-beta-2');
    } else {
      logFail('FLOW 10', 'Failed to revoke device session', revokeRes.data);
    }

    // Attempt login on device 3 now that slot is freed
    const devLogin3Retry = await client.post('/auth/login', {
      email: deviceTestEmail,
      password: password,
      deviceId: 'device-gamma-3',
      deviceName: 'Firefox on Linux',
    });

    if (devLogin3Retry.status === 200 && devLogin3Retry.data.accessToken) {
      logPass('FLOW 10', 'Device 3 successfully logged in after slot was freed');
    } else {
      logFail('FLOW 10', 'Device 3 failed to log in after slot was freed', devLogin3Retry.data);
    }
  } catch (err) {
    logFail('FLOW 10', 'Unexpected error during Flow 10', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 11: ADMIN LOGIN, DASHBOARD & GALLERY CRUD
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 11: ADMIN AUTH, DASHBOARD & GALLERY CRUD ---');
  try {
    const adminLogin = await client.post('/auth/login', {
      email: 'admin@artcrew.in',
      password: 'Admin@123456',
      deviceId: 'admin-console-dev',
      deviceName: 'Admin Workstation',
    });

    if (adminLogin.status === 200 && adminLogin.data.user?.role === 'admin') {
      adminToken = adminLogin.data.accessToken;
      logPass('FLOW 11', 'Admin login successful and role verified');
    } else {
      logFail('FLOW 11', 'Admin login failed', adminLogin.data);
    }

    // Dashboard Stats
    const stats = await client.get('/admin/dashboard-stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (stats.status === 200 && stats.data.data?.totalUsers !== undefined) {
      const d = stats.data.data;
      logPass('FLOW 11', `Dashboard statistics loaded: ${d.totalUsers} users, ${d.activeSubscribers} active subs, ₹${d.monthlyRevenue} revenue`);
    } else {
      logFail('FLOW 11', 'Admin dashboard-stats failed', stats.data);
    }

    // Create Gallery Item
    const createGallery = await client.post(
      '/gallery',
      {
        title: 'QA Sunset on Lake',
        mediumId: createdMediumId,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
        description: 'A test artwork created during automated QA testing.',
        artist: 'QA Automation Bot',
        isFeatured: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (createGallery.status === 201 && createGallery.data.data?._id) {
      createdGalleryId = createGallery.data.data._id;
      logPass('FLOW 11', `Admin created gallery item: ${createGallery.data.data.title}`);
    } else {
      logFail('FLOW 11', 'Failed creating gallery item', createGallery.data);
    }

    // Edit Gallery Item
    const editGallery = await client.put(
      `/gallery/${createdGalleryId}`,
      { title: 'QA Sunset on Lake (Updated)' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (editGallery.status === 200 && editGallery.data.data?.title.includes('Updated')) {
      logPass('FLOW 11', 'Admin updated gallery item');
    } else {
      logFail('FLOW 11', 'Failed updating gallery item', editGallery.data);
    }

    // Delete Gallery Item
    const deleteGallery = await client.delete(`/gallery/${createdGalleryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (deleteGallery.status === 200 && deleteGallery.data.success) {
      logPass('FLOW 11', 'Admin deleted gallery item');
    } else {
      logFail('FLOW 11', 'Failed deleting gallery item', deleteGallery.data);
    }
  } catch (err) {
    logFail('FLOW 11', 'Unexpected error during Flow 11', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 12: ADMIN CONTENT & SUBSCRIPTION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TESTING FLOW 12: ADMIN MEDIUMS, RECORDINGS, LIVE & SUBSCRIPTIONS ---');
  try {
    // 1. Create Medium
    const newMedSlug = `qa-sculpture-${Date.now()}`;
    const createMed = await client.post(
      '/mediums',
      {
        name: 'QA Sculpture Mastery',
        slug: newMedSlug,
        description: '3D Sculpting and clay modeling workflows',
        difficulty: 'Intermediate',
        estimatedBudget: '₹2,000 - ₹5,000',
        supplies: ['Clay', 'Armature wire', 'Loop tools'],
        beginnerGuide: 'Build armature first, then apply rough mass.',
        tags: ['indoor', 'messy', 'tactile'],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    let testMediumId = null;
    if (createMed.status === 201 && createMed.data.data?._id) {
      testMediumId = createMed.data.data._id;
      logPass('FLOW 12', `Admin created medium: ${createMed.data.data.name}`);
    } else {
      logFail('FLOW 12', 'Admin failed creating medium', createMed.data);
    }

    // 2. Add Learning Resource
    if (testMediumId) {
      const addRes = await client.post(
        `/mediums/${testMediumId}/resources`,
        {
          title: 'Sculpture Armature Tutorial',
          description: 'Step by step wire armature construction',
          url: 'https://youtube.com/watch?v=12345',
          resourceType: 'video',
          level: 'beginner',
          isFree: true,
          provider: 'YouTube',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (addRes.status === 201 && addRes.data.data?._id) {
        logPass('FLOW 12', 'Admin added nested learning resource to medium');
      } else {
        logFail('FLOW 12', 'Failed adding learning resource', addRes.data);
      }
    }

    // 3. Create Recording
    const createRec = await client.post(
      '/recordings',
      {
        title: 'QA Masterclass: Clay Bust Sculpting',
        description: 'Detailed anatomical sculpting tutorial',
        mediumId: testMediumId || createdMediumId,
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        durationSeconds: 2400,
        requiredTier: 'basic',
        instructor: 'QA Master Instructor',
        isPublished: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    let testRecId = null;
    if (createRec.status === 201 && createRec.data.data?._id) {
      testRecId = createRec.data.data._id;
      logPass('FLOW 12', `Admin created recording: ${createRec.data.data.title}`);
    } else {
      logFail('FLOW 12', 'Failed creating recording', createRec.data);
    }

    // 4. Create Live Session
    const createLive = await client.post(
      '/live-sessions',
      {
        title: 'QA Live Sculpting Q&A Session',
        description: 'Ask questions live to the instructor',
        mediumId: testMediumId || createdMediumId,
        scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        durationMinutes: 60,
        streamUrl: 'https://example.com/live/qa-stream',
        requiredTier: 'pro',
        status: 'scheduled',
        host: 'QA Master Instructor',
        isPublished: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    let testLiveId = null;
    if (createLive.status === 201 && createLive.data.data?._id) {
      testLiveId = createLive.data.data._id;
      logPass('FLOW 12', `Admin scheduled live session: ${createLive.data.data.title}`);
    } else {
      logFail('FLOW 12', 'Failed creating live session', createLive.data);
    }

    // 5. Manage Subscription Plan (Create & Update)
    const createPlan = await client.post(
      '/subscriptions/plans',
      {
        name: 'QA VIP Tier',
        slug: `qa-vip-${Date.now()}`,
        description: 'Unlimited access with all features',
        price: 1999,
        currency: 'INR',
        billingPeriod: 'monthly',
        includesAllMediums: true,
        includesLiveSessions: true,
        includesRecordedSessions: true,
        maxDevices: 5,
        features: ['All mediums', 'All live sessions', '1-on-1 feedback'],
        isActive: true,
        isPopular: false,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    let testPlanId = null;
    if (createPlan.status === 201 && createPlan.data.data?._id) {
      testPlanId = createPlan.data.data._id;
      logPass('FLOW 12', `Admin created subscription plan: ${createPlan.data.data.name} (₹${createPlan.data.data.price})`);
    } else {
      logFail('FLOW 12', 'Failed creating subscription plan', createPlan.data);
    }

    if (testPlanId) {
      const updatePlan = await client.put(
        `/subscriptions/plans/${testPlanId}`,
        { price: 2199, isPopular: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (updatePlan.status === 200 && updatePlan.data.data?.price === 2199) {
        logPass('FLOW 12', 'Admin updated subscription plan price and popularity');
      } else {
        logFail('FLOW 12', 'Failed updating subscription plan', updatePlan.data);
      }
    }

    // Clean up test items
    if (testLiveId) await client.delete(`/live-sessions/${testLiveId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (testRecId) await client.delete(`/recordings/${testRecId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (testPlanId) await client.delete(`/subscriptions/plans/${testPlanId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (testMediumId) await client.delete(`/mediums/${testMediumId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    logPass('FLOW 12', 'Cleaned up temporary test content');
  } catch (err) {
    logFail('FLOW 12', 'Unexpected error during Flow 12', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('              QA AUDIT SUMMARY REPORT                     ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`TOTAL PASSED TESTS: ${results.pass.length}`);
  console.log(`TOTAL FAILED TESTS: ${results.fail.length}`);

  if (results.fail.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.fail.forEach((f) => console.log(`   - ${f}`));
  } else {
    console.log('\n🎉 ALL 12 AUDIT FLOWS PASSED PERFECTLY!');
  }
}

runAudit();
