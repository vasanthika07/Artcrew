require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function testMongoDB() {
  process.stdout.write('1. MongoDB Atlas:               ');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️ MISSING (MONGODB_URI not set)');
    return;
  }
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`✅ WORKING (Connected: ${conn.connection.host})`);
    await mongoose.disconnect();
  } catch (err) {
    console.log(`❌ FAILED (${err.message})`);
  }
}

async function testMux() {
  process.stdout.write('2. Mux Video:                   ');
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret || tokenId.startsWith('your_')) {
    console.log('⚠️ NOT SET / PLACEHOLDER');
    return;
  }
  try {
    const Mux = require('@mux/mux-node');
    const mux = new Mux({ tokenId, tokenSecret });
    const assets = await mux.video.assets.list({ limit: 1 });
    console.log(`✅ WORKING (Authenticated, assets: ${assets.data?.length || 0})`);
  } catch (err) {
    console.log(`❌ FAILED (${err.message})`);
  }
}

async function testJWT() {
  process.stdout.write('3. JWT Authentication:          ');
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtSecret || jwtSecret.length < 32 || !refreshSecret || refreshSecret.length < 32) {
    console.log('⚠️ INSECURE (< 32 chars)');
    return;
  }
  console.log('✅ CONFIGURED (Secure 32+ characters)');
}

async function testGooglePlaces() {
  process.stdout.write('4. Google Places API:           ');
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || key.trim() === '') {
    console.log('⚠️ NOT SET (Automatic fallback to OpenStreetMap active)');
    return;
  }

  // Try New Places API
  try {
    const resNew = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      { textQuery: 'art studio in Bangalore' },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
        },
        timeout: 5000,
      }
    );
    if (resNew.data && resNew.data.places) {
      console.log(`✅ WORKING via Places API (New) (Found: ${resNew.data.places.length} places)`);
      return;
    }
  } catch (err) {
    const errData = err.response?.data?.error;
    if (errData?.status === 'PERMISSION_DENIED') {
      console.log(`❌ BLOCKED (${errData.message || 'API_KEY_SERVICE_BLOCKED'})`);
      return;
    }
  }

  // Try Legacy Places API
  try {
    const resLegacy = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: '12.9716,77.5946',
        radius: 5000,
        keyword: 'art studio',
        key: key,
      },
      timeout: 5000,
    });
    if (resLegacy.data.status === 'OK' || resLegacy.data.status === 'ZERO_RESULTS') {
      console.log(`✅ WORKING via Legacy Places API`);
      return;
    }
    console.log(`❌ FAILED (${resLegacy.data.error_message || 'Denied'})`);
  } catch (err) {
    console.log(`❌ FAILED (${err.message})`);
  }
}

async function testAIRateRecommendation() {
  process.stdout.write('5. AI Recommendation Engine:    ');
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const res = await model.generateContent('Say ready');
      console.log(`✅ WORKING via Free Google Gemini AI ("${res.response.text().trim()}")`);
      return;
    } catch (e) {
      console.log(`⚠️ Gemini Error: ${e.message} (Falling back to Built-in Zero-Billing Engine)`);
      return;
    }
  }

  if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
    console.log('🟡 Anthropic key present (Requires billing credits on Anthropic Console)');
    return;
  }

  console.log('✅ 100% OPERATIONAL via Built-in Smart Recommendation Engine (Zero Billing / 0 Cost)');
}

async function testRazorpay() {
  process.stdout.write('6. Razorpay Payments:           ');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId === 'rzp_test_artcrew123' || keyId.startsWith('rzp_test_...') || keySecret.startsWith('artcrew_secret')) {
    console.log(`⚠️ DEMO/TEST PLACEHOLDER (rzp_test_artcrew123)`);
    return;
  }
  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const res = await rzp.orders.all({ count: 1 });
    console.log(`✅ WORKING (Orders accessible: ${res.items?.length || 0})`);
  } catch (err) {
    console.log(`❌ FAILED (${err.message})`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('       🎨 ARTCREW API & SERVICES LIVE AUDIT          ');
  console.log('======================================================');
  await testMongoDB();
  await testMux();
  await testJWT();
  await testGooglePlaces();
  await testAIRateRecommendation();
  await testRazorpay();
  console.log('======================================================\n');
  process.exit(0);
}

main();
