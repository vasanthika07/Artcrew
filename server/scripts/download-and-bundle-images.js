const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');
const LiveSession = require('../models/LiveSession');
const RecordedSession = require('../models/RecordedSession');

const clientImagesDir = path.resolve(__dirname, '../../client/public/images');
const serverImagesDir = path.resolve(__dirname, '../public/images');

const imageList = [
  // Mediums
  {
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/paintings.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/portraits.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/landscapes.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/charcoal.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/pottery.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/digital-art.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/calligraphy.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1569172122301-bc500f309134?auto=format&fit=crop&w=800&q=80',
    relPath: 'mediums/sculpture.jpg',
  },

  // Gallery Artworks
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    relPath: 'gallery/gallery-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    relPath: 'gallery/gallery-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    relPath: 'gallery/gallery-3.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=800&q=80',
    relPath: 'gallery/gallery-4.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=800&q=80',
    relPath: 'gallery/gallery-5.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    relPath: 'gallery/gallery-6.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1525974160448-038dacadcc71?w=800&q=80',
    relPath: 'gallery/gallery-7.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
    relPath: 'gallery/gallery-8.jpg',
  },

  // Workshops & Sessions
  {
    url: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=800&q=80',
    relPath: 'sessions/session-watercolour.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    relPath: 'sessions/session-pottery.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=800&q=80',
    relPath: 'sessions/session-portrait.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80',
    relPath: 'sessions/session-acrylic.jpg',
  },

  // Hero Image
  {
    url: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=900&q=90',
    relPath: 'heroes/hero-art.jpg',
  },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function bundleImages() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('       📥 DOWNLOADING & BUNDLING PROJECT IMAGES        ');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const item of imageList) {
    const clientDest = path.join(clientImagesDir, item.relPath);
    const serverDest = path.join(serverImagesDir, item.relPath);

    try {
      console.log(`Downloading: ${item.relPath}...`);
      await downloadFile(item.url, clientDest);
      // Copy to server public directory as well
      fs.mkdirSync(path.dirname(serverDest), { recursive: true });
      fs.copyFileSync(clientDest, serverDest);
      console.log(`  ✅ Saved to client & server public/images/${item.relPath}`);
    } catch (err) {
      console.error(`  ❌ Failed to download ${item.relPath}:`, err.message);
    }
  }

  // Update Database records to use local high-speed bundled images
  console.log('\n🔄 Updating MongoDB Atlas records with bundled local images...');
  await mongoose.connect(process.env.MONGODB_URI);

  // Update Mediums
  const mediumMap = {
    paintings: '/images/mediums/paintings.jpg',
    portraits: '/images/mediums/portraits.jpg',
    landscapes: '/images/mediums/landscapes.jpg',
    'charcoal-drawings': '/images/mediums/charcoal.jpg',
    pottery: '/images/mediums/pottery.jpg',
    'digital-art': '/images/mediums/digital-art.jpg',
    calligraphy: '/images/mediums/calligraphy.jpg',
    sculpture: '/images/mediums/sculpture.jpg',
  };

  for (const [slug, imgPath] of Object.entries(mediumMap)) {
    await Medium.updateMany(
      { slug },
      { $set: { coverImage: imgPath } }
    );
  }
  console.log('✅ Mediums updated with local image paths');

  // Update Gallery
  const galleryItems = await GalleryItem.find().sort({ createdAt: 1 });
  const galleryImages = [
    '/images/gallery/gallery-1.jpg',
    '/images/gallery/gallery-2.jpg',
    '/images/gallery/gallery-3.jpg',
    '/images/gallery/gallery-4.jpg',
    '/images/gallery/gallery-5.jpg',
    '/images/gallery/gallery-6.jpg',
    '/images/gallery/gallery-7.jpg',
    '/images/gallery/gallery-8.jpg',
  ];

  for (let i = 0; i < galleryItems.length; i++) {
    const img = galleryImages[i % galleryImages.length];
    await GalleryItem.findByIdAndUpdate(galleryItems[i]._id, { imageUrl: img });
  }
  console.log('✅ Gallery items updated with local image paths');

  // Update Live Sessions
  const liveSessions = await LiveSession.find().sort({ createdAt: 1 });
  const liveImages = [
    '/images/sessions/session-watercolour.jpg',
    '/images/sessions/session-pottery.jpg',
    '/images/sessions/session-portrait.jpg',
  ];
  for (let i = 0; i < liveSessions.length; i++) {
    const img = liveImages[i % liveImages.length];
    await LiveSession.findByIdAndUpdate(liveSessions[i]._id, { thumbnailUrl: img });
  }
  console.log('✅ Live sessions updated with local image paths');

  // Update Recorded Sessions
  const recordedSessions = await RecordedSession.find().sort({ createdAt: 1 });
  const recImages = [
    '/images/sessions/session-acrylic.jpg',
    '/images/sessions/session-portrait.jpg',
    '/images/sessions/session-pottery.jpg',
  ];
  for (let i = 0; i < recordedSessions.length; i++) {
    const img = recImages[i % recImages.length];
    await RecordedSession.findByIdAndUpdate(recordedSessions[i]._id, { thumbnailUrl: img });
  }
  console.log('✅ Recorded masterclasses updated with local image paths');

  console.log('\n🎉 ALL IMAGES DOWNLOADED, BUNDLED, AND PERSISTED TO DATABASE!\n');
  process.exit(0);
}

bundleImages().catch((err) => {
  console.error('Fatal error during bundling:', err);
  process.exit(1);
});
