const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');
const LiveSession = require('../models/LiveSession');
const RecordedSession = require('../models/RecordedSession');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Resource = require('../models/Resource');

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    await Promise.all([
      Medium.deleteMany({}),
      GalleryItem.deleteMany({}),
      LiveSession.deleteMany({}),
      RecordedSession.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      Resource.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // ─── MEDIUMS ──────────────────────────────────────────────────────────────
    const mediums = await Medium.insertMany([
      {
        name: 'Paintings',
        slug: 'paintings',
        description: 'Express yourself with vibrant colors on canvas. Acrylic and oil painting are among the most versatile and expressive art forms, allowing artists to create rich, layered compositions.',
        coverImage: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=800',
        difficulty: 'Beginner',
        estimatedBudget: '₹1,500 - ₹4,000',
        supplies: ['Acrylic/Oil paints', 'Canvas or canvas boards', 'Brushes (variety)', 'Palette', 'Palette knife', 'Easel', 'Linseed oil (for oils)', 'Varnish'],
        beginnerGuide: 'Start with acrylics — they dry fast, are water-soluble, and forgiving. Use a limited palette (3-5 colors) and practice mixing before painting full compositions.',
        tags: ['indoor', 'traditional', 'colorful', 'relaxing'],
        order: 1,
      },
      {
        name: 'Portraits',
        slug: 'portraits',
        description: 'Capture the essence of the human face and figure. Portrait art spans drawing, painting, and mixed media — developing your observational skills like no other medium.',
        coverImage: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=800',
        difficulty: 'Intermediate',
        estimatedBudget: '₹1,000 - ₹3,500',
        supplies: ['Pencils (HB, 2B, 4B, 6B)', 'Charcoal sticks', 'Blending stumps', 'Quality drawing paper', 'Kneaded eraser', 'Fixative spray', 'Reference photos'],
        beginnerGuide: 'Study facial proportions first — the golden ratio and thirds. Practice individual features (eyes, nose, lips) before attempting full portraits. Use reference photos or a mirror.',
        tags: ['indoor', 'traditional', 'challenging', 'observational'],
        order: 2,
      },
      {
        name: 'Landscapes',
        slug: 'landscapes',
        description: 'Capture the beauty of nature from mountain vistas to golden sunsets. Landscape art can be done in watercolours, oils, acrylics, or even pastels.',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        difficulty: 'Beginner',
        estimatedBudget: '₹1,200 - ₹3,000',
        supplies: ['Watercolour paints', 'Watercolour paper (300gsm)', 'Round brushes', 'Masking fluid', 'Water containers', 'Portable easel', 'Palette'],
        beginnerGuide: 'Begin with simple watercolour washes. Learn to paint skies first — they set the mood of the entire landscape. Study perspective and aerial perspective for depth.',
        tags: ['outdoor', 'traditional', 'relaxing', 'nature'],
        order: 3,
      },
      {
        name: 'Charcoal Drawings',
        slug: 'charcoal-drawings',
        description: 'Bold, dramatic, and incredibly expressive — charcoal is one of the oldest art mediums and perfect for developing strong foundational drawing skills.',
        coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
        difficulty: 'Beginner',
        estimatedBudget: '₹500 - ₹1,500',
        supplies: ['Vine charcoal', 'Compressed charcoal', 'Drawing paper', 'Kneaded eraser', 'Blending stumps', 'Fixative spray', 'Sandpaper block'],
        beginnerGuide: 'Charcoal is forgiving — you can erase easily. Start with vine charcoal for light sketching, then use compressed for dark accents. Practice value scales before full compositions.',
        tags: ['indoor', 'traditional', 'messy', 'expressive'],
        order: 4,
      },
      {
        name: 'Pottery',
        slug: 'pottery',
        description: 'Shape clay with your hands and discover the therapeutic joy of wheel throwing and hand-building. Pottery is one of the most tactile and meditative art forms.',
        coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
        difficulty: 'Beginner',
        estimatedBudget: '₹2,000 - ₹6,000',
        supplies: ['Clay (stoneware/terracotta)', 'Wire clay cutter', 'Wooden tools', 'Sponge', 'Slip', 'Glazes', 'Kiln access (studio)'],
        beginnerGuide: 'Join a local pottery class for kiln access and wheel instruction. Begin with pinch pots and coil building before attempting wheel throwing. Wedge your clay thoroughly to remove air bubbles.',
        tags: ['indoor', 'messy', 'relaxing', 'tactile', 'class-recommended'],
        order: 5,
      },
    ]);
    console.log(`✅ Created ${mediums.length} mediums`);

    // ─── SUBSCRIPTION PLANS ────────────────────────────────────────────────────
    const plans = await SubscriptionPlan.insertMany([
      {
        name: 'Basic',
        slug: 'basic',
        description: 'Perfect for beginners exploring art mediums',
        price: 299,
        currency: 'INR',
        billingPeriod: 'monthly',
        includedMediums: [mediums[0]._id, mediums[2]._id, mediums[3]._id],
        includesAllMediums: false,
        includesLiveSessions: false,
        includesRecordedSessions: true,
        maxDevices: 1,
        features: ['Access to 3 mediums', 'Recorded sessions library', 'Community forums', '1 device'],
        isActive: true,
        isPopular: false,
        order: 1,
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'Unlock all mediums and live sessions',
        price: 799,
        currency: 'INR',
        billingPeriod: 'monthly',
        includesAllMediums: true,
        includesLiveSessions: true,
        includesRecordedSessions: true,
        maxDevices: 2,
        features: ['All mediums unlocked', 'Live sessions access', 'Full recorded library', 'Priority support', '2 devices'],
        isActive: true,
        isPopular: true,
        order: 2,
      },
      {
        name: 'Studio Access',
        slug: 'studio-access',
        description: 'Premium experience with studio discounts and 1-on-1 sessions',
        price: 1499,
        currency: 'INR',
        billingPeriod: 'monthly',
        includesAllMediums: true,
        includesLiveSessions: true,
        includesRecordedSessions: true,
        maxDevices: 3,
        features: ['Everything in Pro', 'Studio partner discounts', '1-on-1 mentorship session/month', 'Early access to events', '3 devices'],
        isActive: true,
        isPopular: false,
        order: 3,
      },
    ]);
    console.log(`✅ Created ${plans.length} subscription plans`);

    // ─── GALLERY ITEMS ─────────────────────────────────────────────────────────
    const galleryItems = await GalleryItem.insertMany([
      { title: 'Golden Hour Landscape', mediumId: mediums[2]._id, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', description: 'A serene watercolour landscape capturing the warm hues of sunset over the Western Ghats.', artist: 'Priya Sharma', isFeatured: true },
      { title: 'Portrait Study in Charcoal', mediumId: mediums[3]._id, imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', description: 'Expressive charcoal portrait exploring light and shadow on the human face.', artist: 'Arjun Menon', isFeatured: true },
      { title: 'Terracotta Vessel', mediumId: mediums[4]._id, imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600', description: 'Hand-thrown terracotta vessel with traditional Rajasthani motifs.', artist: 'Kavya Nair', isFeatured: true },
      { title: 'Monsoon Colours', mediumId: mediums[0]._id, imageUrl: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=600', description: 'Acrylic painting capturing the lush greenery and dramatic skies of monsoon season.', artist: 'Rohan Desai', isFeatured: false },
      { title: 'The Old Man by the Sea', mediumId: mediums[1]._id, imageUrl: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=600', description: 'A detailed portrait study in graphite depicting an elder fisherman of Goa.', artist: 'Ananya Krishnan', isFeatured: false },
      { title: 'Himalayan Vista', mediumId: mediums[2]._id, imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600', description: 'Oil painting of snow-capped Himalayan peaks under a winter dawn sky.', artist: 'Vikram Singh', isFeatured: true },
      { title: 'Blue Pottery Bowl', mediumId: mediums[4]._id, imageUrl: 'https://images.unsplash.com/photo-1525974160448-038dacadcc71?w=600', description: 'Traditional Jaipur blue pottery bowl with intricate hand-painted floral patterns.', artist: 'Meera Patel', isFeatured: false },
      { title: 'Abstract Forest', mediumId: mediums[0]._id, imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600', description: 'Semi-abstract interpretation of a misty forest in deep greens and blues.', artist: 'Deepika Rao', isFeatured: false },
    ]);
    console.log(`✅ Created ${galleryItems.length} gallery items`);

    // ─── LIVE SESSIONS ─────────────────────────────────────────────────────────
    const futureSessions = await LiveSession.insertMany([
      {
        title: 'Watercolour Wedding Painting Live Session',
        description: 'Join us for a special live session where we paint a wedding scene in delicate watercolours. Perfect for beginners and intermediates.',
        mediumId: mediums[2]._id,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        durationMinutes: 90,
        streamUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
        requiredTier: 'basic',
        status: 'scheduled',
        host: 'Priya Sharma',
        isPublished: true,
      },
      {
        title: 'Pottery on the Wheel — Live with Kavya',
        description: 'Watch and follow along as Kavya Nair demonstrates wheel-throwing techniques from centering clay to pulling walls.',
        mediumId: mediums[4]._id,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        durationMinutes: 120,
        streamUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
        requiredTier: 'pro',
        status: 'scheduled',
        host: 'Kavya Nair',
        isPublished: true,
      },
      {
        title: 'Charcoal Portrait Masterclass',
        description: 'An advanced live session focusing on capturing likeness and character through charcoal portraiture.',
        mediumId: mediums[3]._id,
        scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        streamUrl: 'https://example.com/stream/charcoal-live',
        thumbnailUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600',
        requiredTier: 'pro',
        status: 'live',
        host: 'Arjun Menon',
        isPublished: true,
      },
    ]);
    console.log(`✅ Created ${futureSessions.length} live sessions`);

    // ─── RECORDED SESSIONS ─────────────────────────────────────────────────────
    await RecordedSession.insertMany([
      {
        title: 'Acrylic Painting for Complete Beginners',
        description: 'Learn the fundamentals of acrylic painting from mixing colours to creating your first landscape. No experience needed.',
        mediumId: mediums[0]._id,
        muxPlaybackId: '',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=600',
        durationSeconds: 3600,
        requiredTier: 'basic',
        instructor: 'Rohan Desai',
        isPublished: true,
        isFeatured: true,
        order: 1,
      },
      {
        title: 'Portrait Drawing: Eyes, Nose & Lips',
        description: 'A detailed breakdown of facial features with step-by-step guidance on proportion and shading.',
        mediumId: mediums[1]._id,
        muxPlaybackId: '',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=600',
        durationSeconds: 5400,
        requiredTier: 'pro',
        instructor: 'Ananya Krishnan',
        isPublished: true,
        isFeatured: true,
        order: 2,
      },
      {
        title: 'Introduction to Wheel Throwing',
        description: 'Your first time on the pottery wheel — centering, opening, and pulling your first cylinder.',
        mediumId: mediums[4]._id,
        muxPlaybackId: '',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
        durationSeconds: 4200,
        requiredTier: 'studio',
        instructor: 'Kavya Nair',
        isPublished: true,
        isFeatured: false,
        order: 3,
      },
    ]);
    console.log('✅ Created 3 recorded sessions');

    // ─── RESOURCES ─────────────────────────────────────────────────────────────
    const resources = [];
    const resourceData = [
      // Paintings
      { title: 'Acrylic Painting for Beginners', mediumId: mediums[0]._id, description: 'Step-by-step guide to starting with acrylics', url: 'https://www.youtube.com/results?search_query=acrylic+painting+for+beginners', resourceType: 'video', level: 'beginner', isFree: true, provider: 'YouTube' },
      { title: 'Understanding Colour Theory', mediumId: mediums[0]._id, description: 'Learn colour mixing and the colour wheel', url: 'https://www.skillshare.com/search?query=color+theory', resourceType: 'course', level: 'beginner', isFree: false, provider: 'Skillshare' },
      { title: 'r/Acrylics Community', mediumId: mediums[0]._id, description: 'Active Reddit community for acrylic painters', url: 'https://www.reddit.com/r/Acrylics/', resourceType: 'community', level: 'beginner', isFree: true, provider: 'Reddit' },
      // Portraits
      { title: 'Portrait Drawing Fundamentals', mediumId: mediums[1]._id, description: 'Master facial proportions and likeness', url: 'https://www.domestika.org/en/courses/portraits', resourceType: 'course', level: 'beginner', isFree: false, provider: 'Domestika' },
      { title: 'How to Draw Realistic Eyes', mediumId: mediums[1]._id, description: 'Detailed tutorial on drawing expressive eyes', url: 'https://www.youtube.com/results?search_query=how+to+draw+realistic+eyes', resourceType: 'video', level: 'beginner', isFree: true, provider: 'YouTube' },
      { title: 'r/learnart Community', mediumId: mediums[1]._id, description: 'Supportive community for art learners', url: 'https://www.reddit.com/r/learnart/', resourceType: 'community', level: 'beginner', isFree: true, provider: 'Reddit' },
      // Landscapes
      { title: 'Watercolour Landscapes for Beginners', mediumId: mediums[2]._id, description: 'Learn to paint beautiful watercolour scenes', url: 'https://www.youtube.com/results?search_query=watercolor+landscape+beginner', resourceType: 'video', level: 'beginner', isFree: true, provider: 'YouTube' },
      { title: 'Beginner Landscape Supply List', mediumId: mediums[2]._id, description: 'Everything you need to start painting landscapes', url: 'https://www.jacksonsart.com/blog/2019/05/16/watercolour-beginners-guide/', resourceType: 'supply-list', level: 'beginner', isFree: true, provider: 'Jacksons Art' },
      // Charcoal
      { title: 'Charcoal Drawing: Beginner to Advanced', mediumId: mediums[3]._id, description: 'Complete guide to charcoal techniques', url: 'https://www.domestika.org/en/courses/charcoal', resourceType: 'course', level: 'beginner', isFree: false, provider: 'Domestika' },
      { title: 'r/drawing Community', mediumId: mediums[3]._id, description: 'Large drawing community with helpful critiques', url: 'https://www.reddit.com/r/drawing/', resourceType: 'community', level: 'beginner', isFree: true, provider: 'Reddit' },
      // Pottery
      { title: 'Introduction to Hand Building Pottery', mediumId: mediums[4]._id, description: 'Learn pinch, coil, and slab techniques without a wheel', url: 'https://www.youtube.com/results?search_query=hand+building+pottery+beginner', resourceType: 'video', level: 'beginner', isFree: true, provider: 'YouTube' },
      { title: 'Pottery for Beginners Course', mediumId: mediums[4]._id, description: 'Structured online pottery curriculum', url: 'https://www.skillshare.com/search?query=pottery', resourceType: 'course', level: 'beginner', isFree: false, provider: 'Skillshare' },
      { title: 'r/Pottery Community', mediumId: mediums[4]._id, description: 'Friendly community for pottery enthusiasts', url: 'https://www.reddit.com/r/Pottery/', resourceType: 'community', level: 'beginner', isFree: true, provider: 'Reddit' },
    ];
    await Resource.insertMany(resourceData);
    console.log(`✅ Created ${resourceData.length} learning resources`);

    // ─── ADMIN USER ────────────────────────────────────────────────────────────
    const existingAdmin = await User.findOne({ email: 'admin@artcrew.in' });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin@123456', 12);
      await User.create({
        name: 'Art Crew Admin',
        email: 'admin@artcrew.in',
        passwordHash,
        role: 'admin',
        subscriptionStatus: 'active',
        subscriptionTier: 'studio',
        maxDevices: 5,
      });
      console.log('✅ Created admin user: admin@artcrew.in / Admin@123456');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎨 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
