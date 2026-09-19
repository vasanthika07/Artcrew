require('dotenv').config();
const mongoose = require('mongoose');
const Medium = require('../models/Medium');
const connectDB = require('../config/db');

const CURATED_MEDIUMS = [
  {
    name: 'Paintings',
    slug: 'paintings',
    description: 'Express yourself with vibrant colors on canvas. Acrylic and oil painting are among the most versatile and expressive art forms, allowing artists to create rich, layered compositions.',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Beginner',
    estimatedBudget: '₹1,500 - ₹4,000',
    supplies: ['Acrylic/Oil paints', 'Canvas boards', 'Brushes (variety)', 'Palette', 'Palette knife', 'Easel'],
    beginnerGuide: 'Start with acrylics — they dry fast, are water-soluble, and forgiving. Use a limited palette (3-5 colors) and practice mixing before painting full compositions.',
    tags: ['indoor', 'traditional', 'colorful', 'relaxing'],
    order: 1,
    isActive: true,
  },
  {
    name: 'Portraits',
    slug: 'portraits',
    description: 'Capture the essence of the human face and figure. Portrait art develops observational skills, facial proportions, light, and expressive anatomical nuance.',
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Intermediate',
    estimatedBudget: '₹1,000 - ₹3,500',
    supplies: ['Pencils (HB, 2B, 4B, 6B)', 'Charcoal sticks', 'Blending stumps', 'Heavyweight drawing paper', 'Kneaded eraser', 'Fixative spray'],
    beginnerGuide: 'Study facial proportions first — the golden ratio and thirds. Practice individual features (eyes, nose, lips) before attempting full portraits.',
    tags: ['indoor', 'traditional', 'challenging', 'observational'],
    order: 2,
    isActive: true,
  },
  {
    name: 'Landscapes',
    slug: 'landscapes',
    description: 'Capture the beauty of nature from mountain vistas to golden sunsets. Landscape art explores watercolours, oils, acrylics, and plein air outdoor sketching.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Beginner',
    estimatedBudget: '₹1,200 - ₹3,000',
    supplies: ['Watercolour paints', 'Watercolour paper (300gsm)', 'Round & flat brushes', 'Masking tape', 'Water container', 'Portable easel'],
    beginnerGuide: 'Begin with simple watercolour washes. Learn to paint skies first — they set the mood of the entire landscape.',
    tags: ['outdoor', 'traditional', 'relaxing', 'nature'],
    order: 3,
    isActive: true,
  },
  {
    name: 'Charcoal Drawings',
    slug: 'charcoal-drawings',
    description: 'Bold, dramatic, and intensely expressive — charcoal is perfect for mastering deep shadows, velvety textures, and dynamic chiaroscuro lighting.',
    coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Beginner',
    estimatedBudget: '₹500 - ₹1,500',
    supplies: ['Vine charcoal', 'Compressed charcoal', 'Textured drawing paper', 'Kneaded eraser', 'Blending tortillons', 'Workable fixative'],
    beginnerGuide: 'Charcoal is forgiving — erase easily with a kneaded eraser. Start with vine charcoal for light gestures, then deepen with compressed charcoal.',
    tags: ['indoor', 'traditional', 'messy', 'expressive'],
    order: 4,
    isActive: true,
  },
  {
    name: 'Pottery & Ceramics',
    slug: 'pottery',
    description: 'Shape clay with your hands and discover the therapeutic joy of wheel throwing and hand-building. One of the most tactile and meditative art forms.',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Beginner',
    estimatedBudget: '₹2,000 - ₹6,000',
    supplies: ['Stoneware/Terracotta clay', 'Wire clay cutter', 'Wooden modeling tools', 'Pottery sponge', 'Glazes', 'Kiln access'],
    beginnerGuide: 'Begin with pinch pots and coil building before attempting wheel throwing. Wedge your clay thoroughly to remove all air bubbles.',
    tags: ['indoor', 'messy', 'relaxing', 'tactile', 'class-recommended'],
    order: 5,
    isActive: true,
  },
  {
    name: 'Digital Art & Illustration',
    slug: 'digital-art',
    description: 'Create boundless artwork with digital brushes, layers, and stylus tablets. Perfect for concept art, comics, character design, and animation.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Intermediate',
    estimatedBudget: '₹3,000 - ₹12,000',
    supplies: ['Graphics tablet / iPad', 'Stylus pen', 'Drawing software (Procreate/Krita/Photoshop)'],
    beginnerGuide: 'Start with free software like Krita or Procreate. Focus on brush opacity and layer blend modes (Multiply, Overlay) to build depth.',
    tags: ['indoor', 'digital', 'clean', 'modern'],
    order: 6,
    isActive: true,
  },
  {
    name: 'Calligraphy & Lettering',
    slug: 'calligraphy',
    description: 'The ancient art of beautiful writing. Master copperplate, brush lettering, and modern gothic scripts with dipping pens and sumi ink.',
    coverImage: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Beginner',
    estimatedBudget: '₹800 - ₹2,000',
    supplies: ['Oblique/Straight dip pen holder', 'Calligraphy nibs (Nikko G / Hunt)', 'Black sumi ink', 'Smooth bleedproof paper', 'Ruler'],
    beginnerGuide: 'Focus on consistent angle and rhythm. Upstrokes should be razor-thin with light pressure; downstrokes are thick with gentle flex.',
    tags: ['indoor', 'traditional', 'relaxing', 'precision'],
    order: 7,
    isActive: true,
  },
  {
    name: 'Sculpture & Modeling',
    slug: 'sculpture',
    description: 'Transform raw clay, wax, and plaster into three-dimensional figures and forms. Develop profound spatial and tactile artistic awareness.',
    coverImage: 'https://images.unsplash.com/photo-1569172122301-bc500f309134?auto=format&fit=crop&w=800&q=80',
    difficulty: 'Intermediate',
    estimatedBudget: '₹2,500 - ₹5,500',
    supplies: ['Monster clay or polymer clay', 'Armature wire', 'Carving loop tools', 'Modeling calipers', 'Heat gun / Oven'],
    beginnerGuide: 'Build a strong aluminum wire armature core before adding clay. Work from general silhouette to secondary forms, saving fine details for last.',
    tags: ['indoor', 'traditional', 'tactile', '3d'],
    order: 8,
    isActive: true,
  },
];

async function updateMediums() {
  await connectDB();
  console.log('🔄 Updating and optimizing medium images...');

  for (const m of CURATED_MEDIUMS) {
    await Medium.findOneAndUpdate(
      { slug: m.slug },
      { $set: m },
      { upsert: true, new: true }
    );
    console.log(`✅ Updated medium: ${m.name}`);
  }

  console.log('\n✨ All mediums successfully updated with high-speed CDN images!');
  process.exit(0);
}

updateMediums().catch((err) => {
  console.error('❌ Error updating mediums:', err);
  process.exit(1);
});
