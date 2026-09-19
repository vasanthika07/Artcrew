require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');
const RecordedSession = require('../models/RecordedSession');
const LiveSession = require('../models/LiveSession');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const connectDB = require('../config/db');

async function viewDatabase() {
  await connectDB();
  console.log('\n======================================================');
  console.log('       🍃 MONGODB ATLAS LIVE DATA VIEWER             ');
  console.log('======================================================\n');

  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  console.log(`📌 REGISTERED USERS (${users.length} total):`);
  users.forEach((u, i) => {
    console.log(`  [${i + 1}] ${u.name} | ${u.email} | Tier: ${u.subscriptionTier || 'Free'} | Status: ${u.subscriptionStatus} | Joined: ${new Date(u.createdAt).toLocaleDateString()}`);
  });

  const mediums = await Medium.find().select('name slug difficulty');
  console.log(`\n📌 ART MEDIUMS (${mediums.length} total):`);
  mediums.forEach((m) => {
    console.log(`  - ${m.name} (${m.difficulty}) -> /mediums/${m.slug}`);
  });

  const plans = await SubscriptionPlan.find().select('name price billingPeriod');
  console.log(`\n📌 SUBSCRIPTION PLANS (${plans.length} total):`);
  plans.forEach((p) => {
    console.log(`  - ${p.name}: ₹${p.price}/${p.billingPeriod}`);
  });

  console.log('\n======================================================\n');
  process.exit(0);
}

viewDatabase();
