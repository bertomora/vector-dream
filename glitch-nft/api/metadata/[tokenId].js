const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const CONTRACT = '0xbae88927f84adc3a16aa3a41340631f5f285fa0a';
const RPC = 'https://mainnet.base.org';
const BASE_URL = 'https://vector-dream.vercel.app';

// Try to load processed mints (Arweave URLs)
let ARWEAVE_URLS = {};
try {
  // Try multiple paths
  const paths = [
    path.join(__dirname, '..', '..', '.processed-mints.json'),
    path.join(process.cwd(), '.processed-mints.json'),
    '.processed-mints.json'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p));
      Object.entries(data).forEach(([tid, info]) => {
        if (info.arweaveUrl) {
          ARWEAVE_URLS[tid] = info.arweaveUrl;
        }
      });
      break;
    }
  }
} catch (e) {
  // Silent fail - will use fallback SVG
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache

  const { tokenId } = req.query;
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(CONTRACT, [
      'function tokenSeed(uint256) view returns (uint256)',
      'function totalSupply() view returns (uint256)'
    ], provider);

    const [seed, supply] = await Promise.all([
      contract.tokenSeed(tokenId),
      contract.totalSupply()
    ]);

    if (parseInt(tokenId) > Number(supply) || parseInt(tokenId) < 1) {
      return res.status(404).json({ error: 'Token does not exist' });
    }

    const seedNum = Number(seed);
    
    // ═══════════════════════════════════════════════════════════════
    // V A P O R W A V E   N A M I N G   S Y S T E M
    // Names tied to visual properties (colors, style)
    // ═══════════════════════════════════════════════════════════════
    
    // Color palette (matches SVG generator)
    // #ff6ec4, #7873f5, #4ff0ff, #00ff87, #60efff, #ffaa00, #ff6b6b, #a55eea
    const colorNames = ['Sakura', 'Ultraviolet', 'Cyan', 'Seafoam', 'Azure', 'Sunset', 'Coral', 'Amethyst'];
    
    // Vaporwave prefix (tied to primary color) - all unique, no overlap with traits
    const vaporPrefix = [
      'Velvet',      // pink
      'Prism',       // purple
      'Chrome',      // cyan
      'Palm',        // green
      'Vapor',       // blue
      'Marble',      // gold
      'Holo',        // coral
      'Laser'        // violet
    ];
    
    // Digital/light/glitch words (tied to secondary color) - fits Vector Dream aesthetic
    const vaporPlaces = [
      'Signal',      // pink - tech
      'Pulse',       // purple - light/tech
      'Grid',        // cyan - vector/geometry
      'Ray',         // green - light
      'Buffer',      // blue - tech
      'Bloom',       // gold - light effect
      'Static',      // coral - glitch
      'Drift'        // violet - dreamy
    ];
    
    // Moods (tied to combined color relationship)
    const moods = ['Nostalgic', 'Ethereal', 'Melancholic', 'Euphoric', 'Serene', 'Electric', 'Hazy', 'Transcendent'];
    
    // Eras (another trait dimension)
    const eras = ['1984', '1987', '1991', '1995', '1999', '2001'];
    
    // Styles (visual rendering style) - Void is RARE
    const styles = ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void'];
    
    // Mulberry32 PRNG to match art.html
    function mulberry32(a) {
      return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    }
    
    // Calculate indices from seed
    const primaryIdx = seedNum % 8;
    const secondaryIdx = Math.floor(seedNum / 8) % 8;
    const moodIdx = (primaryIdx + secondaryIdx) % 8;
    const eraIdx = Math.floor(seedNum / 64) % 6;
    
    // Style selection matches art.html (Void is ~5% rare)
    const R = mulberry32(seedNum);
    const variantRoll = R();
    let styleIdx;
    if (variantRoll < 0.19) styleIdx = 0;        // Synthwave ~19%
    else if (variantRoll < 0.38) styleIdx = 1;   // Databend ~19%
    else if (variantRoll < 0.57) styleIdx = 2;   // Corrupt ~19%
    else if (variantRoll < 0.76) styleIdx = 3;   // Neon ~19%
    else if (variantRoll < 0.95) styleIdx = 4;   // Isometric ~19%
    else styleIdx = 5;                            // Void ~5% RARE
    
    // Build the name: Prefix + Place + #number (e.g., "Neon Plaza #1")
    const name = `${vaporPrefix[primaryIdx]} ${vaporPlaces[secondaryIdx]} #${tokenId}`;
    
    const style = styles[styleIdx];
    const primaryColor = colorNames[primaryIdx];
    const secondaryColor = colorNames[secondaryIdx];
    const mood = moods[moodIdx];
    const era = eras[eraIdx];

    // Use Arweave URL if processed, otherwise fallback to SVG
    const imageUrl = ARWEAVE_URLS[tokenId] || `${BASE_URL}/api/svg/${seedNum}`;

    // Poetic description templates - each seed gets a unique variation
    const templates = [
      () => `${mood} transmissions from ${era}. ${primaryColor} light bleeds into ${secondaryColor.toLowerCase()} static.`,
      () => `A ${style.toLowerCase()} dream suspended in ${era}. ${primaryColor} and ${secondaryColor.toLowerCase()} frequencies collide.`,
      () => `${era}. ${mood} waves ripple through ${primaryColor.toLowerCase()} and ${secondaryColor.toLowerCase()} vectors.`,
      () => `Echoes of ${era} rendered in ${style.toLowerCase()} haze. ${primaryColor} pulses against ${secondaryColor.toLowerCase()} void.`,
      () => `${mood} artifacts from the ${era} signal. A ${primaryColor.toLowerCase()}-${secondaryColor.toLowerCase()} drift.`,
      () => `Lost ${style.toLowerCase()} broadcast, circa ${era}. ${primaryColor} fading into ${secondaryColor.toLowerCase()}.`,
      () => `${primaryColor} dreams refracted through ${secondaryColor.toLowerCase()} memory. ${mood}, ${era}.`,
      () => `Digital ${mood.toLowerCase()} from ${era}. ${style} aesthetics in ${primaryColor.toLowerCase()} and ${secondaryColor.toLowerCase()}.`
    ];
    
    // Handle same-color case + pick template based on seed
    const templateIdx = seedNum % 8;
    let description;
    if (primaryColor === secondaryColor) {
      const pureTemplates = [
        `Pure ${primaryColor.toLowerCase()} ${mood.toLowerCase()} from ${era}. ${style} dreams in monochrome.`,
        `${era}. A singular ${primaryColor.toLowerCase()} frequency. ${mood} and infinite.`,
        `${style} transmission in pure ${primaryColor.toLowerCase()}. ${mood} echoes from ${era}.`,
        `All ${primaryColor.toLowerCase()}. All ${mood.toLowerCase()}. ${era}.`
      ];
      description = pureTemplates[seedNum % 4];
    } else {
      description = templates[templateIdx]();
    }

    const metadata = {
      name: name,
      description: description,
      image: imageUrl,
      animation_url: `https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=${seedNum}`,
      external_url: BASE_URL,
      attributes: [
        { trait_type: 'Style', value: style },
        { trait_type: 'Primary Aura', value: primaryColor },
        { trait_type: 'Secondary Aura', value: secondaryColor },
        { trait_type: 'Mood', value: mood },
        { trait_type: 'Era', value: era },
        { trait_type: 'Seed', value: seedNum }
      ]
    };

    res.status(200).json(metadata);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
