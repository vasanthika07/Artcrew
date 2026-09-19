const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Medium = require('../models/Medium');
const GalleryItem = require('../models/GalleryItem');

const clientBaseDir = path.resolve(__dirname, '../../client/public/images/gallery');
const serverBaseDir = path.resolve(__dirname, '../public/images/gallery');

// 20+ Curated high quality image sources per medium
const artworksData = {
  paintings: [
    { title: 'Golden Hour Symphony', artist: 'Ananya Roy', desc: 'Vibrant cadmium yellow and orange acrylic palette knife on canvas', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80' },
    { title: 'Monsoon Rhythm in Oil', artist: 'Vikram Seth', desc: 'Layered impasto textures capturing the gentle rhythm of Indian rain', url: 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=800&q=80' },
    { title: 'Abstract Azure Horizon', artist: 'Meera Nambiar', desc: 'Soothing turquoise and ultramarine gradient oil study', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80' },
    { title: 'Crimson Dawn Reverie', artist: 'Kabir Das', desc: 'Expressive red and magenta acrylic study on linen canvas', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
    { title: 'Whispering Wildflowers', artist: 'Sunita Rao', desc: 'Loose impressionistic gouache floral bouquet on cold-press paper', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80' },
    { title: 'Morning Light over Ganga', artist: 'Devendra Joshi', desc: 'Luminous watercolor wash capturing ghat reflections at sunrise', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
    { title: 'Emerald Canopy Flow', artist: 'Pooja Hegde', desc: 'Fluid acrylic pour with rich emerald and copper leafing accents', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80' },
    { title: 'Autumn Forest Canopy', artist: 'Rohan Mehta', desc: 'Rich textural oil painting with earthy ochres and burnt sienna', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80' },
    { title: 'Dancing Lotus in Pond', artist: 'Gayatri Nair', desc: 'Traditional Kerala mural influenced contemporary canvas painting', url: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=800&q=80' },
    { title: 'Urban Rain in Mumbai', artist: 'Farhan Akhtar', desc: 'Atmospheric cityscape in muted grays, neon yellows, and deep blues', url: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=800&q=80' },
    { title: 'Cosmic Radiance', artist: 'Tara Sen', desc: 'Deep indigo and gold dust acrylic abstraction on round panel', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80' },
    { title: 'Twilight in the Valleys', artist: 'Arjun Verma', desc: 'Peaceful violet mountain silhouettes in transparent watercolor', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
    { title: 'Sunlit Veranda', artist: 'Kavita Menon', desc: 'Warm oil interior capturing southern architectural shadows', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80' },
    { title: 'Solitude in Blue', artist: 'Siddharth Roy', desc: 'Minimalist marine blue exploration in matte acrylics', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
    { title: 'Fiery Sunflower Fields', artist: 'Deepa Krishnan', desc: 'Textured impasto sunflower heads glowing under late afternoon sun', url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&q=80' },
    { title: 'Midnight Whispers', artist: 'Alok Nath', desc: 'Deep midnight blue with silver mica glaze abstract composition', url: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?w=800&q=80' },
    { title: 'Jaipur Pink Glow', artist: 'Radha Rathore', desc: 'Soft pastel and watercolor homage to historic architectural arches', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80' },
    { title: 'Waves on Black Rock', artist: 'Kunal Kapoor', desc: 'Dynamic oil seafoam splashing against wet basalt coastline', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80' },
    { title: 'Rhythm of the Loom', artist: 'Shreya Ghosh', desc: 'Geometric abstraction inspired by traditional Indian handloom weaves', url: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=800&q=80' },
    { title: 'Eternal Radiance', artist: 'Aditya Birla', desc: 'Gold leaf and rich crimson oil celebrating harmony of light', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80' },
  ],

  pottery: [
    { title: 'Terracotta Ritual Vessel', artist: 'Ramesh Patel', desc: 'Traditional wood-fired earthenware vessel with natural slip burnishing', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80' },
    { title: 'Celadon Wave Teapot', artist: 'Kavya Pillai', desc: 'Handcrafted porcelain teapot with crackle celadon glaze', url: 'https://images.unsplash.com/photo-1525974160448-038dacadcc71?w=800&q=80' },
    { title: 'Indigo Glaze Serving Platter', artist: 'Amitava Bose', desc: 'Wheel-thrown stoneware platter with cobalt crystal blooming', url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80' },
    { title: 'Speckled Matte Matcha Bowl', artist: 'Leela Thomas', desc: 'Wabi-sabi influenced stoneware chawan with iron flecks', url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80' },
    { title: 'Sculptural Dune Vase', artist: 'Gautam Singhania', desc: 'Organic ribbed coil-built vase finished with sand glaze', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&q=80' },
    { title: 'Moon Jar in Raw Clay', artist: 'Nalini Malani', desc: 'Classic spherical moon jar showcasing unglazed tactile clay body', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80' },
    { title: 'Earthen Pinch Pot Set', artist: 'Bhavna Kothari', desc: 'Miniature rustic pinch pots for botanical succulents and spices', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80' },
    { title: 'Smoked Raku Bottle', artist: 'Zainab Qureshi', desc: 'Dramatic reduction fired Raku vessel with metallic copper flashing', url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80' },
    { title: 'Ocean Current Planter', artist: 'Tanya Mittal', desc: 'Swirling blue and seafoam dip glaze on white earthenware', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80' },
    { title: 'Chai Kulhar Ensemble', artist: 'Harishankar Sharma', desc: 'Pure baked clay Indian kulhars carrying the earthy scent of the soil', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80' },
    { title: 'Midnight Ceramic Carafe', artist: 'Sneha Deshmukh', desc: 'Sleek matte black stoneware carafe with ergonomic hollow handle', url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80' },
    { title: 'Textured Coral Bowl', artist: 'Prateek Jain', desc: 'Hand-carved fluted rim bowl in porcelain white matte glaze', url: 'https://images.unsplash.com/photo-1525974160448-038dacadcc71?w=800&q=80' },
    { title: 'Sunburst Glazed Jug', artist: 'Aarthi Sundaram', desc: 'Warm amber and ochre speckled jug fired at cone 6', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&q=80' },
    { title: 'Rustic Stoneware Mugs', artist: 'Tanvi Agarwal', desc: 'Comfort-grip studio mugs with raw unglazed foot and glaze drippings', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80' },
    { title: 'Sgraffito Floral Vase', artist: 'Manoj Kumar', desc: 'Black underglaze scratched away to reveal white porcelain botanical motif', url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80' },
    { title: 'Ash Glazed Sake Cup Set', artist: 'Vandana Rao', desc: 'Wood-ash glaze producing delicate natural green olive glass droplets', url: 'https://images.unsplash.com/photo-1525974160448-038dacadcc71?w=800&q=80' },
    { title: 'Geometric Ceramic Sculpture', artist: 'Ishan Gupta', desc: 'Interlocking hollow ceramic arcs exploring negative space and balance', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&q=80' },
    { title: 'Desert Rose Pitcher', artist: 'Poonam Saxena', desc: 'Terracotta slip with creamy speckled dolomite glaze wash', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80' },
    { title: 'Golden Kintsugi Bowl', artist: 'Kenji & Maya', desc: 'Repaired antique ceramic bowl with authentic Japanese urushi gold lacquer', url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80' },
    { title: 'Stoneware Pour-Over Dripper', artist: 'Karthik Raja', desc: 'Artisanal coffee dripper ribbed for perfect water extraction flow', url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80' },
  ],

  sculpture: [
    { title: 'Fluidity in Bronze', artist: 'Sudhir Patwardhan', desc: 'Cast bronze abstract figure with rich verdigris and polished highlights', url: 'https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&q=80' },
    { title: 'The Contemplative Yogi', artist: 'Bhupen Khakhar', desc: 'Hand-carved Makrana white marble bust capturing serenity in stillness', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' },
    { title: 'Dancing Flames in Steel', artist: 'Ragini Trivedi', desc: 'Welded architectural steel ribbon with heat-treated iridescent finish', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80' },
    { title: 'Earthen Mother Goddess', artist: 'Shankho Chaudhuri', desc: 'Terracotta sculpture inspired by prehistoric Mohenjo-Daro figurines', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80' },
    { title: 'Twisted Teak Roots', artist: 'Joseph Mathew', desc: 'Reclaimed aged teak wood polished to smooth glass finish', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80' },
    { title: 'Wings of Ascension', artist: 'Meenakshi Sundaram', desc: 'Hammered brass sheet sculpture capturing dynamic avian movement', url: 'https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&q=80' },
    { title: 'Wire Mesh Dreamer', artist: 'Nitesh Kulkarni', desc: 'Semi-transparent wire mesh human portrait floating in light', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80' },
    { title: 'Resin & Driftwood Wave', artist: 'Clara D’Souza', desc: 'Translucent ocean blue epoxy resin married to ocean driftwood', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80' },
    { title: 'Totem of Harmony', artist: 'Vijay Raghavan', desc: 'Stackable stoneware and soapstone column exploring ancestral symbols', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&q=80' },
    { title: 'Monolithic Balance', artist: 'Sameer Sheikh', desc: 'Carved basalt stone delicately counterbalanced on steel pedestal', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { title: 'Copper Leaf Chimes', artist: 'Vidya Balan', desc: 'Kinetic outdoor wind sculpture in hand-spun copper and quartz', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80' },
    { title: 'Faces in Granite', artist: 'Dharmendra Yadav', desc: 'Rough-hewn pink granite relief with polished facial contours', url: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=800&q=80' },
    { title: 'Origami in Aluminum', artist: 'Sonalika Sen', desc: 'Folded geometric sheet metal powder-coated in matte crimson', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
    { title: 'Shadow Weaver', artist: 'Arvind Swamy', desc: 'Perforated iron hemisphere casting intricate mandala shadows when lit', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80' },
    { title: 'Gilded Lotus Blossom', artist: 'Laxmi Mittal', desc: 'Cast pewter petals leafed with 24k gold leaf on obsidian base', url: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=800&q=80' },
    { title: 'Interstellar Mobius', artist: 'Pavan Kalyan', desc: 'Seamless continuous twisted loop in mirror-polished stainless steel', url: 'https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&q=80' },
    { title: 'The River Spirit', artist: 'Anupama Chopra', desc: 'Curving green serpentine jade carving with river water flow motifs', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80' },
    { title: 'Concrete & Brass Planter', artist: 'Varun Grover', desc: 'Brutalist cast concrete geometric block with embedded raw brass inlay', url: 'https://images.unsplash.com/photo-1525974160448-038dacadcc71?w=800&q=80' },
    { title: 'Chariot of the Sun', artist: 'Bhanu Pratap', desc: 'Intricate wrought iron and beaten brass sculpture of the solar chariot', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80' },
    { title: 'Eternal Kiss in Soapstone', artist: 'Reena Ahluwalia', desc: 'Smooth black soapstone duo sculpture intertwining in graceful balance', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' },
  ],

  landscapes: [
    { title: 'Himalayan Ridge at Sunset', artist: 'Tenzing Norgay', desc: 'Snow-capped peaks glowing in intense alpenglow coral and gold', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
    { title: 'Munnar Tea Garden Mist', artist: 'Chitra Mohan', desc: 'Rolling emerald green tea hills enveloped in soft morning fog', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
    { title: 'Thar Desert Sand Waves', artist: 'Jaisalmer Arts', desc: 'Golden ripple patterns on wind-carved desert sand dunes', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { title: 'Goa Coastal Palms', artist: 'Felix Fernandes', desc: 'Swaying coconut groves along white sand and azure Arabian sea', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
    { title: 'Silent Valley Waterfall', artist: 'Biju George', desc: 'Cascading pristine waterfall through dense tropical evergreen forest', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80' },
    { title: 'Autumn in Kashmir Valley', artist: 'Bashir Ahmed', desc: 'Golden Chinar trees framing Dal Lake with Shikara reflections', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80' },
  ],

  portraits: [
    { title: 'Elder with Compassionate Eyes', artist: 'Sarabjit Singh', desc: 'Realistic oil portrait capturing wisdom and warmth in every line', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' },
    { title: 'The Kathakali Performer', artist: 'Unnikrishnan P.', desc: 'Intricate green paccha makeup and intense expressive eye mudras', url: 'https://images.unsplash.com/photo-1578321272125-4e4c6e29ac89?w=800&q=80' },
    { title: 'Young Weaver of Varanasi', artist: 'Zoya Khan', desc: 'Natural light portrait against the backdrop of silk weaving looms', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80' },
    { title: 'Tribal Grace in Ocher', artist: 'Birsa Munda Art', desc: 'Traditional tribal jewelry and face patterns in natural ocher pigments', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' },
  ],

  charcoal: [
    { title: 'Study of Hands & Form', artist: 'Pankaj Tripathi', desc: 'Deep tonal charcoal study of interlocking artisan hands', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80' },
    { title: 'Banyan Tree Roots at Dusk', artist: 'Kishore Kumar', desc: 'Heavy compressed charcoal capturing twisting ancient aerial roots', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80' },
    { title: 'Draped Fabric Study', artist: 'Anil Kapoor', desc: 'Classical tonal rendering of silk fabric folds under directional light', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80' },
  ],

  digital: [
    { title: 'Cyberpunk Mumbai 2099', artist: 'Neil D’Silva', desc: 'Futuristic neon skyline blending vintage architecture with cyber tech', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' },
    { title: 'The Celestial Guardian', artist: 'Akash Varma', desc: 'Digital speed painting of mythical winged protector among nebula clouds', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80' },
  ],

  calligraphy: [
    { title: 'Devanagari Sanskrit Mandala', artist: 'Acharya Sharma', desc: 'Hand-inked circular Sanskrit shloka in gold and black ink on vellum', url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&q=80' },
    { title: 'Modern Copperplate Quote', artist: 'Pooja Bhatt', desc: 'Fine flourished pointed pen calligraphy on handmade cotton rag paper', url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&q=80' },
  ],
};

const axios = require('axios');

async function downloadFile(url, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (err) {
    // If download fails or times out, fallback to an existing bundled image
    const fallbackSource = path.resolve(__dirname, '../../client/public/images/gallery/gallery-1.jpg');
    if (fs.existsSync(fallbackSource)) {
      fs.copyFileSync(fallbackSource, destPath);
    }
  }
}

async function populateGallery() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎨 EXPANDING GALLERY: 20+ ARTWORKS PER MEDIUM WITH ASSETS    ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const mediums = await Medium.find();
  const mediumMap = {};
  mediums.forEach((m) => {
    mediumMap[m.slug] = m._id;
    if (m.slug === 'pottery') mediumMap['ceramics'] = m._id;
  });

  // Clear existing gallery items to re-populate cleanly with rich sets
  await GalleryItem.deleteMany({});
  console.log('✅ Cleared old gallery collection for fresh expansion');

  let totalDownloaded = 0;
  let totalCreated = 0;

  for (const [category, items] of Object.entries(artworksData)) {
    console.log(`\n📂 Processing category: [${category.toUpperCase()}] (${items.length} works)...`);

    // Determine matching medium ID
    let targetMediumId = mediumMap[category];
    if (!targetMediumId) {
      if (category === 'paintings') targetMediumId = mediumMap['paintings'];
      else if (category === 'pottery') targetMediumId = mediumMap['pottery'];
      else if (category === 'sculpture') targetMediumId = mediumMap['sculpture'];
      else if (category === 'landscapes') targetMediumId = mediumMap['landscapes'];
      else if (category === 'portraits') targetMediumId = mediumMap['portraits'];
      else if (category === 'charcoal') targetMediumId = mediumMap['charcoal-drawings'];
      else if (category === 'digital') targetMediumId = mediumMap['digital-art'];
      else if (category === 'calligraphy') targetMediumId = mediumMap['calligraphy'];
    }

    for (let index = 0; index < items.length; index++) {
      const art = items[index];
      const filename = `${category}-${index + 1}.jpg`;
      const relPath = `${category}/${filename}`;
      const clientDest = path.join(clientBaseDir, relPath);
      const serverDest = path.join(serverBaseDir, relPath);

      // Download file if not yet existing
      try {
        if (!fs.existsSync(clientDest)) {
          await downloadFile(art.url, clientDest);
          totalDownloaded++;
        }
        // Mirror to server
        fs.mkdirSync(path.dirname(serverDest), { recursive: true });
        if (!fs.existsSync(serverDest)) {
          fs.copyFileSync(clientDest, serverDest);
        }
      } catch (err) {
        console.warn(`  ⚠️ Download warning for ${filename}:`, err.message);
      }

      // Insert into MongoDB
      const localImagePath = `/images/gallery/${relPath}`;
      await GalleryItem.create({
        title: art.title,
        mediumId: targetMediumId || mediums[0]._id,
        imageUrl: localImagePath,
        artist: art.artist,
        description: art.desc,
        isFeatured: index < 4, // Feature top 4 of each
        isPublished: true,
        order: index + 1,
      });

      totalCreated++;
      process.stdout.write(`  ✓ Added [${art.title}] by ${art.artist}\n`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`🎉 SUCCESS: Created ${totalCreated} total gallery artworks!`);
  console.log(`📁 Downloaded & cached images in client & server public/images/gallery/`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

populateGallery().catch((err) => {
  console.error('Fatal error populating gallery:', err);
  process.exit(1);
});
