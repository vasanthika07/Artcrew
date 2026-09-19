require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');
const LiveSession = require('../models/LiveSession');
const RecordedSession = require('../models/RecordedSession');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Studio = require('../models/Studio');
const Resource = require('../models/Resource');

const PORT = 5001; // Run test server on port 5001 to avoid collisions
process.env.PORT = PORT;

const app = require('../server');

const BASE_URL = `http://localhost:${PORT}`;
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on error status codes
});

const report = {
  total: 0,
  passed: 0,
  failed: 0,
  categories: {},
};

function recordTest(category, name, status, details = {}) {
  report.total++;
  if (!report.categories[category]) {
    report.categories[category] = { passed: 0, failed: 0, tests: [] };
  }

  const passed = status === 'PASS';
  if (passed) {
    report.passed++;
    report.categories[category].passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    report.failed++;
    report.categories[category].failed++;
    console.error(`  ❌ [FAIL] ${name}`, details);
  }

  report.categories[category].tests.push({
    name,
    status,
    details,
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('        🎨 ARTCREW COMPLETE BACKEND API DIAGNOSTIC SUITE       ');
  console.log('================================================================\n');

  // Wait a moment for server & DB connection
  await new Promise((r) => setTimeout(r, 2000));

  let testUserToken = null;
  let testUserId = null;
  let testRefreshToken = null;
  let testDeviceId = `device_${Date.now()}`;
  let adminToken = null;
  let adminUserId = null;
  let subscriberToken = null;
  let subscriberUserId = null;

  // Artifact IDs created during tests for clean CRUD testing
  let tempMediumId = null;
  let tempResourceId = null;
  let tempGalleryId = null;
  let tempLiveSessionId = null;
  let tempRecordingId = null;
  let tempStudioId = null;
  let tempPlanId = null;

  try {
    // -------------------------------------------------------------
    // 1. HEALTH & ROOT ENDPOINTS
    // -------------------------------------------------------------
    console.log('\n[1/10] Testing Health & Root API Endpoints...');
    {
      const res = await client.get('/health');
      recordTest(
        'Health',
        'GET /health returns 200 OK with live stats',
        res.status === 200 && res.data.success ? 'PASS' : 'FAIL',
        { status: res.status, data: res.data }
      );
    }
    {
      const res = await client.get('/api');
      recordTest(
        'Health',
        'GET /api returns 200 OK',
        res.status === 200 && res.data.success ? 'PASS' : 'FAIL',
        { status: res.status }
      );
    }
    {
      const res = await client.get('/');
      recordTest(
        'Health',
        'GET / returns 200 OK',
        res.status === 200 && res.data.success ? 'PASS' : 'FAIL',
        { status: res.status }
      );
    }

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & DEVICE MANAGEMENT APIS
    // -------------------------------------------------------------
    console.log('\n[2/10] Testing Auth & Device Session APIs...');
    const userEmail = `artist_${Date.now()}@artcrew.test`;
    const userPass = 'ArtCrewSecret@123';
    const adminEmail = `admin_${Date.now()}@artcrew.test`;

    // 2.1 Sign up regular user
    {
      const res = await client.post('/api/auth/signup', {
        name: 'Test Artist',
        email: userEmail,
        password: userPass,
        deviceId: testDeviceId,
      });
      const ok = res.status === 201 && res.data.success && res.data.accessToken;
      if (ok) {
        testUserToken = res.data.accessToken;
        testRefreshToken = res.data.refreshToken;
        testUserId = res.data.user.id || res.data.user._id;
      }
      recordTest('Auth', 'POST /api/auth/signup (Valid Registration)', ok ? 'PASS' : 'FAIL', {
        status: res.status,
        data: res.data,
      });
    }

    // 2.2 Sign up duplicate user (Should fail with 409)
    {
      const res = await client.post('/api/auth/signup', {
        name: 'Duplicate Artist',
        email: userEmail,
        password: userPass,
      });
      recordTest('Auth', 'POST /api/auth/signup (Duplicate Email Rejection - 409)', res.status === 409 ? 'PASS' : 'FAIL', {
        status: res.status,
      });
    }

    // 2.3 Sign up with short password (Should fail with 422)
    {
      const res = await client.post('/api/auth/signup', {
        name: 'Invalid Artist',
        email: 'invalid@artcrew.test',
        password: '123',
      });
      recordTest('Auth', 'POST /api/auth/signup (Short Password Rejection - 422)', res.status === 422 ? 'PASS' : 'FAIL', {
        status: res.status,
      });
    }

    // 2.4 Login regular user
    {
      const res = await client.post('/api/auth/login', {
        email: userEmail,
        password: userPass,
        deviceId: testDeviceId,
      });
      const ok = res.status === 200 && res.data.success && res.data.accessToken;
      if (ok) {
        testUserToken = res.data.accessToken;
        testRefreshToken = res.data.refreshToken;
      }
      recordTest('Auth', 'POST /api/auth/login (Valid Credentials)', ok ? 'PASS' : 'FAIL', {
        status: res.status,
      });
    }

    // 2.5 Login with invalid credentials (Should fail with 401)
    {
      const res = await client.post('/api/auth/login', {
        email: userEmail,
        password: 'wrongpassword',
      });
      recordTest('Auth', 'POST /api/auth/login (Invalid Password Rejection - 401)', res.status === 401 ? 'PASS' : 'FAIL', {
        status: res.status,
      });
    }

    // 2.6 GET /api/auth/me
    {
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const ok = res.status === 200 && res.data.success && res.data.user && res.data.user.email === userEmail;
      recordTest('Auth', 'GET /api/auth/me (Fetch Authenticated Profile)', ok ? 'PASS' : 'FAIL', {
        status: res.status,
        data: res.data,
      });
    }

    // 2.7 PUT /api/auth/profile
    {
      const res = await client.put(
        '/api/auth/profile',
        { name: 'Updated Test Artist Name' },
        { headers: { Authorization: `Bearer ${testUserToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.user.name === 'Updated Test Artist Name';
      recordTest('Auth', 'PUT /api/auth/profile (Update Profile Details)', ok ? 'PASS' : 'FAIL', {
        status: res.status,
      });
    }

    // 2.8 GET /api/auth/devices
    {
      const res = await client.get('/api/auth/devices', {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.devices) && res.data.devices.length > 0;
      recordTest('Auth', 'GET /api/auth/devices (List Active Sessions)', ok ? 'PASS' : 'FAIL', {
        status: res.status,
        devices: res.data.devices?.length,
      });
    }

    // 2.9 POST /api/auth/refresh
    {
      const res = await client.post('/api/auth/refresh', {
        refreshToken: testRefreshToken,
        deviceId: testDeviceId,
      });
      const ok = res.status === 200 && res.data.success && res.data.accessToken;
      if (ok) {
        testUserToken = res.data.accessToken;
        testRefreshToken = res.data.refreshToken;
      }
      recordTest('Auth', 'POST /api/auth/refresh (JWT Rotation)', ok ? 'PASS' : 'FAIL', {
        status: res.status,
      });
    }

    // 2.10 Create an Admin User directly in DB for Admin APIs
    {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(userPass, 10);
      const adminUser = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        subscriptionStatus: 'active',
        subscriptionTier: 'studio',
      });
      adminUserId = adminUser._id;

      const res = await client.post('/api/auth/login', {
        email: adminEmail,
        password: userPass,
        deviceId: 'admin_device_1',
      });
      if (res.status === 200 && res.data.accessToken) {
        adminToken = res.data.accessToken;
      }
      recordTest('Auth', 'Admin Account Provisioning & Login', adminToken ? 'PASS' : 'FAIL', {
        adminId: adminUserId,
      });
    }

    // 2.11 Create a Subscribed User for Playback & Live Join tests
    {
      const subEmail = `subscriber_${Date.now()}@artcrew.test`;
      const subRes = await client.post('/api/auth/signup', {
        name: 'Pro Subscriber',
        email: subEmail,
        password: userPass,
        deviceId: 'sub_device_1',
      });
      subscriberToken = subRes.data?.accessToken;
      subscriberUserId = subRes.data?.user?.id || subRes.data?.user?._id;

      // Mark user subscription as active Pro in DB
      await User.findByIdAndUpdate(subscriberUserId, {
        subscriptionStatus: 'active',
        subscriptionTier: 'pro',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      recordTest('Auth', 'Subscribed User (Pro Tier) Account Provisioning', subscriberToken ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 3. ART MEDIUMS APIS
    // -------------------------------------------------------------
    console.log('\n[3/10] Testing Art Mediums APIs...');
    // 3.1 GET /api/mediums
    let firstMediumSlug = 'paintings';
    let firstMediumId = null;
    {
      const res = await client.get('/api/mediums');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0;
      if (ok) {
        firstMediumSlug = res.data.data[0].slug;
        firstMediumId = res.data.data[0]._id;
      }
      recordTest('Mediums', 'GET /api/mediums (List all mediums)', ok ? 'PASS' : 'FAIL', {
        count: res.data.data?.length,
      });
    }

    // 3.2 GET /api/mediums/:id or :slug
    {
      const res = await client.get(`/api/mediums/${firstMediumSlug}`);
      const ok = res.status === 200 && res.data.success && res.data.data.name;
      recordTest('Mediums', `GET /api/mediums/${firstMediumSlug} (Get single medium with nested data)`, ok ? 'PASS' : 'FAIL', {
        name: res.data.data?.name,
      });
    }

    // 3.3 GET /api/mediums/:id/resources
    {
      const res = await client.get(`/api/mediums/${firstMediumId}/resources`);
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      recordTest('Mediums', 'GET /api/mediums/:id/resources (Get medium learning resources)', ok ? 'PASS' : 'FAIL', {
        count: res.data.data?.length,
      });
    }

    // 3.4 POST /api/mediums (Admin create)
    {
      const res = await client.post(
        '/api/mediums',
        {
          name: `Watercolor Painting ${Date.now()}`,
          description: 'A delicate and expressive art medium using water-soluble pigments.',
          difficulty: 'Beginner',
          estimatedBudget: '₹1,200 - ₹2,500',
          supplies: ['Watercolor cakes', 'Round brushes', '300gsm cold press paper'],
          tags: ['water', 'colorful', 'relaxing'],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) tempMediumId = res.data.data._id;
      recordTest('Mediums', 'POST /api/mediums (Admin Create Medium)', ok ? 'PASS' : 'FAIL', {
        mediumId: tempMediumId,
      });
    }

    // 3.5 PUT /api/mediums/:id (Admin update)
    if (tempMediumId) {
      const res = await client.put(
        `/api/mediums/${tempMediumId}`,
        { difficulty: 'Intermediate' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.difficulty === 'Intermediate';
      recordTest('Mediums', 'PUT /api/mediums/:id (Admin Update Medium)', ok ? 'PASS' : 'FAIL');
    }

    // 3.6 POST /api/mediums/:id/resources (Admin add nested resource)
    if (tempMediumId) {
      const res = await client.post(
        `/api/mediums/${tempMediumId}/resources`,
        {
          title: 'Ultimate Watercolor Guide for Beginners',
          url: 'https://artcrew.in/guides/watercolor-101',
          resourceType: 'guide',
          level: 'beginner',
          provider: 'ArtCrew Editorial',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) tempResourceId = res.data.data._id;
      recordTest('Mediums', 'POST /api/mediums/:id/resources (Admin Create Medium Resource)', ok ? 'PASS' : 'FAIL');
    }

    // 3.7 DELETE /api/mediums/:id/resources/:resourceId (Admin delete resource)
    if (tempMediumId && tempResourceId) {
      const res = await client.delete(`/api/mediums/${tempMediumId}/resources/${tempResourceId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Mediums', 'DELETE /api/mediums/:id/resources/:resourceId (Admin Delete Resource)', ok ? 'PASS' : 'FAIL');
    }

    // 3.8 DELETE /api/mediums/:id (Admin delete medium)
    if (tempMediumId) {
      const res = await client.delete(`/api/mediums/${tempMediumId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Mediums', 'DELETE /api/mediums/:id (Admin Delete Medium)', ok ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 4. GALLERY ARTWORKS APIS
    // -------------------------------------------------------------
    console.log('\n[4/10] Testing Gallery Artworks APIs...');
    // 4.1 GET /api/gallery
    let firstGalleryId = null;
    {
      const res = await client.get('/api/gallery?limit=10');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      if (ok && res.data.data.length > 0) {
        firstGalleryId = res.data.data[0]._id;
      }
      recordTest('Gallery', 'GET /api/gallery (List artworks with pagination)', ok ? 'PASS' : 'FAIL', {
        count: res.data.data?.length,
        pagination: res.data.pagination,
      });
    }

    // 4.2 GET /api/gallery with filter query
    {
      const res = await client.get('/api/gallery?featured=true');
      const ok = res.status === 200 && res.data.success;
      recordTest('Gallery', 'GET /api/gallery?featured=true (Filter featured works)', ok ? 'PASS' : 'FAIL');
    }

    // 4.3 GET /api/gallery/:id
    if (firstGalleryId) {
      const res = await client.get(`/api/gallery/${firstGalleryId}`);
      const ok = res.status === 200 && res.data.success && res.data.data.title;
      recordTest('Gallery', 'GET /api/gallery/:id (Get single artwork)', ok ? 'PASS' : 'FAIL', {
        title: res.data.data?.title,
      });
    }

    // 4.4 POST /api/gallery (Admin create)
    {
      const res = await client.post(
        '/api/gallery',
        {
          title: `Sunset Glow Masterpiece ${Date.now()}`,
          mediumId: firstMediumId,
          imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
          artist: 'Kavita Iyer',
          description: 'A brilliant exploration of warm cadmium tones and atmospheric light.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) tempGalleryId = res.data.data._id;
      recordTest('Gallery', 'POST /api/gallery (Admin Create Artwork)', ok ? 'PASS' : 'FAIL', {
        artworkId: tempGalleryId,
      });
    }

    // 4.5 PUT /api/gallery/:id (Admin update)
    if (tempGalleryId) {
      const res = await client.put(
        `/api/gallery/${tempGalleryId}`,
        { isFeatured: true, description: 'Updated artwork description.' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.isFeatured === true;
      recordTest('Gallery', 'PUT /api/gallery/:id (Admin Update Artwork)', ok ? 'PASS' : 'FAIL');
    }

    // 4.6 DELETE /api/gallery/:id (Admin delete)
    if (tempGalleryId) {
      const res = await client.delete(`/api/gallery/${tempGalleryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Gallery', 'DELETE /api/gallery/:id (Admin Delete Artwork)', ok ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 5. LIVE SESSIONS APIS
    // -------------------------------------------------------------
    console.log('\n[5/10] Testing Live Sessions APIs...');
    // 5.1 GET /api/live-sessions (Public list, ensure streamUrl is protected)
    let liveSessionToJoin = null;
    {
      const res = await client.get('/api/live-sessions');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      if (ok && res.data.data.length > 0) {
        liveSessionToJoin = res.data.data[0];
        // Security check: streamUrl must not be leaked to public unauthenticated GET
        const leaksStream = res.data.data.some((s) => s.streamUrl);
        recordTest('LiveSessions', 'GET /api/live-sessions (Public list & status computation)', !leaksStream ? 'PASS' : 'FAIL', {
          count: res.data.data.length,
          streamUrlProtected: !leaksStream,
        });
      } else {
        recordTest('LiveSessions', 'GET /api/live-sessions', ok ? 'PASS' : 'FAIL');
      }
    }

    // 5.2 POST /api/live-sessions (Admin create)
    {
      const res = await client.post(
        '/api/live-sessions',
        {
          title: `Live Pottery Wheel Throwing ${Date.now()}`,
          mediumId: firstMediumId,
          host: 'Master Potter Ananya',
          scheduledAt: new Date(Date.now() + 3600000), // 1 hour in future
          durationMinutes: 60,
          requiredTier: 'basic',
          streamUrl: 'https://stream.artcrew.in/live/pottery-wheel.m3u8',
          description: 'Hands-on live masterclass shaping stoneware clay.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) {
        tempLiveSessionId = res.data.data._id;
        liveSessionToJoin = res.data.data;
      }
      recordTest('LiveSessions', 'POST /api/live-sessions (Admin Create Live Session)', ok ? 'PASS' : 'FAIL', {
        sessionId: tempLiveSessionId,
      });
    }

    // 5.3 GET /api/live-sessions/:id (Public single view)
    if (tempLiveSessionId) {
      const res = await client.get(`/api/live-sessions/${tempLiveSessionId}`);
      const ok = res.status === 200 && res.data.success && !res.data.data.streamUrl;
      recordTest('LiveSessions', 'GET /api/live-sessions/:id (Public session view strips streamUrl)', ok ? 'PASS' : 'FAIL');
    }

    // 5.4 GET /api/live-sessions/:id/join (Unsubscribed user -> 403 Forbidden)
    if (tempLiveSessionId) {
      const res = await client.get(`/api/live-sessions/${tempLiveSessionId}/join`, {
        headers: { Authorization: `Bearer ${testUserToken}` }, // Free user
      });
      recordTest(
        'LiveSessions',
        'GET /api/live-sessions/:id/join (Unsubscribed User Gating - 403 Forbidden)',
        res.status === 403 && res.data.code === 'SUBSCRIPTION_REQUIRED' ? 'PASS' : 'FAIL',
        { status: res.status, code: res.data.code }
      );
    }

    // 5.5 GET /api/live-sessions/:id/join (Subscribed user -> 200 with streamUrl)
    if (tempLiveSessionId) {
      const res = await client.get(`/api/live-sessions/${tempLiveSessionId}/join`, {
        headers: { Authorization: `Bearer ${subscriberToken}` },
      });
      const ok = res.status === 200 && res.data.success && res.data.streamUrl;
      recordTest('LiveSessions', 'GET /api/live-sessions/:id/join (Subscribed User Authorized - 200 with Stream)', ok ? 'PASS' : 'FAIL', {
        streamUrlReceived: !!res.data.streamUrl,
      });
    }

    // 5.6 PUT /api/live-sessions/:id (Admin update)
    if (tempLiveSessionId) {
      const res = await client.put(
        `/api/live-sessions/${tempLiveSessionId}`,
        { durationMinutes: 90 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.durationMinutes === 90;
      recordTest('LiveSessions', 'PUT /api/live-sessions/:id (Admin Update Live Session)', ok ? 'PASS' : 'FAIL');
    }

    // 5.7 DELETE /api/live-sessions/:id (Admin delete)
    if (tempLiveSessionId) {
      const res = await client.delete(`/api/live-sessions/${tempLiveSessionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('LiveSessions', 'DELETE /api/live-sessions/:id (Admin Delete Live Session)', ok ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 6. RECORDINGS & MASTERCLASSES APIS
    // -------------------------------------------------------------
    console.log('\n[6/10] Testing Recordings & Masterclasses APIs...');
    // 6.1 GET /api/recordings (Public listing, verify stream URLs protected)
    {
      const res = await client.get('/api/recordings');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      const leaksPlayback = ok && res.data.data.some((r) => r.videoUrl || r.muxPlaybackId || r.streamUrl);
      recordTest('Recordings', 'GET /api/recordings (Public Masterclasses List & URL protection)', ok && !leaksPlayback ? 'PASS' : 'FAIL', {
        count: res.data.data?.length,
        isStreamProtected: !leaksPlayback,
      });
    }

    // 6.2 POST /api/recordings (Admin create)
    {
      const res = await client.post(
        '/api/recordings',
        {
          title: `Oil Painting Basics Masterclass ${Date.now()}`,
          mediumId: firstMediumId,
          instructor: 'Rajesh Kumar',
          durationSeconds: 3600,
          requiredTier: 'basic',
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          description: 'Comprehensive guide to color mixing and glazing techniques.',
          isPublished: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) tempRecordingId = res.data.data._id;
      recordTest('Recordings', 'POST /api/recordings (Admin Create Masterclass)', ok ? 'PASS' : 'FAIL', {
        recordingId: tempRecordingId,
      });
    }

    // 6.3 GET /api/recordings/:id/play (Unsubscribed user -> 403 Forbidden)
    if (tempRecordingId) {
      const res = await client.get(`/api/recordings/${tempRecordingId}/play`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      recordTest(
        'Recordings',
        'GET /api/recordings/:id/play (Unsubscribed User Access Gating - 403)',
        res.status === 403 && res.data.code === 'SUBSCRIPTION_REQUIRED' ? 'PASS' : 'FAIL',
        { status: res.status, code: res.data.code }
      );
    }

    // 6.4 GET /api/recordings/:id/play (Subscribed user -> 200 with playbackUrl)
    if (tempRecordingId) {
      const res = await client.get(`/api/recordings/${tempRecordingId}/play`, {
        headers: { Authorization: `Bearer ${subscriberToken}` },
      });
      const ok = res.status === 200 && res.data.success && res.data.playbackUrl;
      recordTest('Recordings', 'GET /api/recordings/:id/play (Subscribed User Authorized Playback)', ok ? 'PASS' : 'FAIL', {
        playbackUrl: !!res.data.playbackUrl,
      });
    }

    // 6.5 POST /api/recordings/:id/progress (Save watch progress)
    if (tempRecordingId) {
      const res = await client.post(
        `/api/recordings/${tempRecordingId}/progress`,
        { progressSeconds: 1200, durationSeconds: 3600 },
        { headers: { Authorization: `Bearer ${subscriberToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.progressPercentage === 33;
      recordTest('Recordings', 'POST /api/recordings/:id/progress (Save Watch Progress & Resume Point)', ok ? 'PASS' : 'FAIL', {
        progressPercentage: res.data.data?.progressPercentage,
      });
    }

    // 6.6 GET /api/recordings/:id/progress (Retrieve progress)
    if (tempRecordingId) {
      const res = await client.get(`/api/recordings/${tempRecordingId}/progress`, {
        headers: { Authorization: `Bearer ${subscriberToken}` },
      });
      const ok = res.status === 200 && res.data.success && res.data.data.progressSeconds === 1200;
      recordTest('Recordings', 'GET /api/recordings/:id/progress (Retrieve Single Recording Watch Progress)', ok ? 'PASS' : 'FAIL');
    }

    // 6.7 GET /api/recordings/continue-watching (Continue watching queue)
    {
      const res = await client.get('/api/recordings/continue-watching', {
        headers: { Authorization: `Bearer ${subscriberToken}` },
      });
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      recordTest('Recordings', 'GET /api/recordings/continue-watching (Continue Watching Resume Queue)', ok ? 'PASS' : 'FAIL', {
        queueLength: res.data.data?.length,
      });
    }

    // 6.8 PUT /api/recordings/:id (Admin update)
    if (tempRecordingId) {
      const res = await client.put(
        `/api/recordings/${tempRecordingId}`,
        { isFeatured: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.isFeatured === true;
      recordTest('Recordings', 'PUT /api/recordings/:id (Admin Update Recording)', ok ? 'PASS' : 'FAIL');
    }

    // 6.9 DELETE /api/recordings/:id (Admin delete)
    if (tempRecordingId) {
      const res = await client.delete(`/api/recordings/${tempRecordingId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Recordings', 'DELETE /api/recordings/:id (Admin Delete Recording)', ok ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 7. STUDIOS APIS
    // -------------------------------------------------------------
    console.log('\n[7/10] Testing Studios & Studio Finder APIs...');
    // 7.1 GET /api/studios (List DB studios)
    {
      const res = await client.get('/api/studios');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      recordTest('Studios', 'GET /api/studios (List DB Studios)', ok ? 'PASS' : 'FAIL', {
        count: res.data.data?.length,
      });
    }

    // 7.2 GET /api/studios/nearby (Nearby finder with coords)
    {
      const res = await client.get('/api/studios/nearby?lat=12.9716&lon=77.5946&radius=15000');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      recordTest('Studios', 'GET /api/studios/nearby (Location Search & Fallback)', ok ? 'PASS' : 'FAIL', {
        provider: res.data.provider,
        studiosFound: res.data.count,
      });
    }

    // 7.3 GET /api/studios/nearby (Missing coords error check - 422)
    {
      const res = await client.get('/api/studios/nearby');
      recordTest('Studios', 'GET /api/studios/nearby (Validation: Missing Coords - 422)', res.status === 422 ? 'PASS' : 'FAIL');
    }

    // 7.4 POST /api/studios (Admin create studio)
    {
      const res = await client.post(
        '/api/studios',
        {
          name: `Bengaluru Fine Arts Studio ${Date.now()}`,
          address: 'Indiranagar 100ft Road, Bengaluru, Karnataka',
          latitude: 12.9784,
          longitude: 77.6408,
          supportedMediums: ['Paintings', 'Pottery & Ceramics'],
          phone: '+91 98765 43210',
          rating: 4.8,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) tempStudioId = res.data.data._id;
      recordTest('Studios', 'POST /api/studios (Admin Create Studio)', ok ? 'PASS' : 'FAIL', {
        studioId: tempStudioId,
      });
    }

    // 7.5 PUT /api/studios/:id (Admin update)
    if (tempStudioId) {
      const res = await client.put(
        `/api/studios/${tempStudioId}`,
        { rating: 4.9 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.rating === 4.9;
      recordTest('Studios', 'PUT /api/studios/:id (Admin Update Studio)', ok ? 'PASS' : 'FAIL');
    }

    // 7.6 DELETE /api/studios/:id (Admin deactivate)
    if (tempStudioId) {
      const res = await client.delete(`/api/studios/${tempStudioId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Studios', 'DELETE /api/studios/:id (Admin Deactivate Studio)', ok ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 8. AI ART RECOMMENDATION ASSISTANT API
    // -------------------------------------------------------------
    console.log('\n[8/10] Testing AI Art Recommendation Assistant API...');
    {
      const quizPayload = {
        experienceLevel: 'beginner',
        budget: 'low',
        environment: 'indoor',
        messiness: 'clean',
        challengeLevel: 'relaxing',
        learningStyle: 'solo',
        traditionalDigital: 'traditional',
        artInterests: ['landscapes', 'colors'],
        timeAvailable: '1-2 hours/week',
        latitude: 12.9716,
        longitude: 77.5946,
      };

      const res = await client.post('/api/assistant/recommend', quizPayload, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const ok = res.status === 200 && res.data.success && res.data.data && res.data.data.medium;
      const data = res.data.data || {};
      recordTest('Assistant', 'POST /api/assistant/recommend (AI Onboarding Recommendations)', ok ? 'PASS' : 'FAIL', {
        recommendedMedium: data.medium,
        reason: data.reason?.slice(0, 60) + '...',
        hasSupplies: Array.isArray(data.supplies) && data.supplies.length > 0,
        hasResources: Array.isArray(data.resources),
        hasStudios: Array.isArray(data.studios),
      });
    }

    // 8.2 Error handling for missing answers
    {
      const res = await client.post('/api/assistant/recommend', {});
      recordTest('Assistant', 'POST /api/assistant/recommend (Validation: Empty Body - 422)', res.status === 422 ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 9. ADMIN DASHBOARD & USER MANAGEMENT APIS
    // -------------------------------------------------------------
    console.log('\n[9/10] Testing Admin Dashboard & User Management APIs...');
    // 9.1 GET /api/admin/dashboard-stats
    {
      const res = await client.get('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success && res.data.data.totalUsers !== undefined;
      recordTest('Admin', 'GET /api/admin/dashboard-stats (Metrics & Revenue aggregation)', ok ? 'PASS' : 'FAIL', {
        totalUsers: res.data.data?.totalUsers,
        activeSubscribers: res.data.data?.activeSubscribers,
        totalMediums: res.data.data?.totalMediums,
      });
    }

    // 9.2 Non-admin access to admin endpoint -> 403 Forbidden
    {
      const res = await client.get('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      recordTest('Admin', 'GET /api/admin/dashboard-stats (Unauthorized Role Gating - 403)', res.status === 403 ? 'PASS' : 'FAIL');
    }

    // 9.3 GET /api/admin/users
    {
      const res = await client.get('/api/admin/users?limit=10', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      recordTest('Admin', 'GET /api/admin/users (List users with search & filters)', ok ? 'PASS' : 'FAIL', {
        userCount: res.data.data?.length,
      });
    }

    // 9.4 GET /api/admin/users/:id
    {
      const res = await client.get(`/api/admin/users/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success && res.data.data._id;
      recordTest('Admin', 'GET /api/admin/users/:id (Get detailed user profile & watch history)', ok ? 'PASS' : 'FAIL');
    }

    // 9.5 PUT /api/admin/users/:id (Admin update user subscription/role)
    {
      const res = await client.put(
        `/api/admin/users/${testUserId}`,
        { subscriptionTier: 'studio', maxDevices: 5 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.subscriptionTier === 'studio';
      recordTest('Admin', 'PUT /api/admin/users/:id (Admin modify user tier & device limits)', ok ? 'PASS' : 'FAIL');
    }

    // 9.6 DELETE /api/admin/users/:userId/devices/:deviceId (Force logout device)
    {
      const res = await client.delete(`/api/admin/users/${testUserId}/devices/${testDeviceId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Admin', 'DELETE /api/admin/users/:userId/devices/:deviceId (Admin force logout device)', ok ? 'PASS' : 'FAIL');
    }

    // -------------------------------------------------------------
    // 10. SUBSCRIPTION PLANS & ADMIN CRUD (Excluding Razorpay payment)
    // -------------------------------------------------------------
    console.log('\n[10/10] Testing Subscription Plans & Admin CRUD APIs...');
    // 10.1 GET /api/subscriptions
    {
      const res = await client.get('/api/subscriptions');
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0;
      recordTest('Subscriptions', 'GET /api/subscriptions (Public plans listing)', ok ? 'PASS' : 'FAIL', {
        plansCount: res.data.data?.length,
      });
    }

    // 10.2 GET /api/subscriptions/admin (Admin plans list)
    {
      const res = await client.get('/api/subscriptions/admin', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      recordTest('Subscriptions', 'GET /api/subscriptions/admin (Admin list all plans)', ok ? 'PASS' : 'FAIL');
    }

    // 10.3 POST /api/subscriptions/plans (Admin create plan)
    {
      const res = await client.post(
        '/api/subscriptions/plans',
        {
          name: `VIP Workshop Pass ${Date.now()}`,
          slug: `vip-${Date.now()}`,
          price: 1999,
          billingPeriod: 'monthly',
          features: ['Unlimited live workshops', 'Priority artist mentoring', 'All studio access'],
          order: 4,
          isActive: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 201 && res.data.success && res.data.data._id;
      if (ok) tempPlanId = res.data.data._id;
      recordTest('Subscriptions', 'POST /api/subscriptions/plans (Admin Create Plan)', ok ? 'PASS' : 'FAIL', {
        planId: tempPlanId,
      });
    }

    // 10.4 PUT /api/subscriptions/plans/:id (Admin update plan)
    if (tempPlanId) {
      const res = await client.put(
        `/api/subscriptions/plans/${tempPlanId}`,
        { price: 2199 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const ok = res.status === 200 && res.data.success && res.data.data.price === 2199;
      recordTest('Subscriptions', 'PUT /api/subscriptions/plans/:id (Admin Update Plan)', ok ? 'PASS' : 'FAIL');
    }

    // 10.5 DELETE /api/subscriptions/plans/:id (Admin delete plan)
    if (tempPlanId) {
      const res = await client.delete(`/api/subscriptions/plans/${tempPlanId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ok = res.status === 200 && res.data.success;
      recordTest('Subscriptions', 'DELETE /api/subscriptions/plans/:id (Admin Delete Plan)', ok ? 'PASS' : 'FAIL');
    }

    // Clean up test users
    if (testUserId) await User.findByIdAndDelete(testUserId);
    if (subscriberUserId) await User.findByIdAndDelete(subscriberUserId);
    if (adminUserId) await User.findByIdAndDelete(adminUserId);

    console.log('\n================================================================');
    console.log('                   📊 AUDIT SUMMARY REPORT                     ');
    console.log('================================================================');
    console.log(`  TOTAL TESTS EXECUTED: ${report.total}`);
    console.log(`  ✅ PASSED:            ${report.passed}`);
    console.log(`  ❌ FAILED:            ${report.failed}`);
    console.log(`  🎯 SUCCESS RATE:      ${((report.passed / report.total) * 100).toFixed(1)}%`);
    console.log('----------------------------------------------------------------');
    Object.entries(report.categories).forEach(([category, data]) => {
      const rate = ((data.passed / (data.passed + data.failed)) * 100).toFixed(0);
      console.log(`  • ${category.padEnd(16)}: ${data.passed}/${data.passed + data.failed} passed (${rate}%)`);
    });
    console.log('================================================================\n');

    process.exit(report.failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('CRITICAL UNHANDLED ERROR IN TEST SUITE:', err);
    process.exit(1);
  }
}

runTestSuite();
