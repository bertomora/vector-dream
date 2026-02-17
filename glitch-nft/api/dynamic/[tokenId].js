/**
 * Vector Dream Metadata API
 * Unique vaporwave names + traits based on seed
 * With Arweave images from processed mints
 */

// Animation URL - supports both ?seed= and #seed= (using hash for gateway compatibility)
const ARWEAVE_ANIMATION = 'https://gateway.irys.xyz/J4bJx08zZmM1QEIPMbi9xfO3ICekBgyvzqrDPe4Y04I';
const getAnimationUrl = (tokenId) => ARWEAVE_ANIMATION;
const FALLBACK_IMAGE_BASE = 'https://vector-dream.vercel.app/api/svg';

// Arweave image URLs (updated by process-new-mints.js)
const ARWEAVE_IMAGES = {
  "1": "https://gateway.irys.xyz/EQkqd9CglCNSBk5D2dh_bYuyNsc2UHmVsQl6q0xSy2Q",
  "2": "https://gateway.irys.xyz/U-e5-tatSCDihThfOLrQXGtM9nZMgyfenAQNCmr4Xd8",
  "3": "https://gateway.irys.xyz/CSrlx4l9Apke5TR1cYjV8sSHIsF00BXHvL8J1ab_bGo",
  "4": "https://gateway.irys.xyz/lGx5OrTLubrvGMLcdMgixgcoyVx3LnKN6QGpkgEvsUM",
  "5": "https://gateway.irys.xyz/NFyLoHspGQXegRMh7jH4IaksTQWZwl5VhFe5S0Ouv4w",
  "6": "https://gateway.irys.xyz/lKSU8QsqWrDWe9bZ6K3VtOLqViYGEOcd0_eujAXzSpU",
  "7": "https://gateway.irys.xyz/VdDL7-KCGu9oj5wS2cxEMKu5p8FfSHiQGkPe6LyFEZI",
  "8": "https://gateway.irys.xyz/B7E4BPLg1WApwIfQKmk14dbetT5m5whcMs3f2k_c_zI",
  "9": "https://gateway.irys.xyz/Os-0pAzhjFXA9c7ciCcTnqe8SgtvPKHazIjSjCZm_Lo",
  "10": "https://gateway.irys.xyz/yzLHP6JoiJeal18XrEWVU85_sgbI81mi62FCfvHD3hM",
  "11": "https://gateway.irys.xyz/N8y8irlW2xG6kGVdYWbgo932zBnfOC-juC0slKrjOng",
  "12": "https://gateway.irys.xyz/5Ul7T7LLCkMKAn2ktAG_J7USv44OJ1x3ZX187Pera4g",
  "13": "https://gateway.irys.xyz/_p3XtMVaQUYRp1YlmNL4mRsDqxVbNMCMtP-ga1LB6tI",
  "14": "https://gateway.irys.xyz/QH3ZVCbyLHWtMoyuR4mOUsOGg9C_b9gQbrIFI4V_9H0"
};

// On-chain seeds (updated by process-new-mints.js)
const TOKEN_SEEDS = {
  "1": 71296,
  "2": 63756,
  "3": 48331,
  "4": 58,
  "5": 11590,
  "6": 31444,
  "7": 93825,
  "8": 94799,
  "9": 96384,
  "10": 91251,
  "11": 36429,
  "12": 94403,
  "13": 43089,
  "14": 43275
};

// Mulberry32 PRNG - deterministic from seed
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// ═══════════════════════════════════════════════════════════════
// V A P O R W A V E   N A M I N G   S Y S T E M
// Names tied to visual properties (colors, style)
// ═══════════════════════════════════════════════════════════════

// Color palette names (matches SVG generator colors)
const colorNames = ['Sakura', 'Ultraviolet', 'Cyan', 'Seafoam', 'Azure', 'Sunset', 'Coral', 'Amethyst'];

// Vaporwave prefix (expanded for uniqueness)
const vaporPrefix = [
  'Velvet', 'Prism', 'Chrome', 'Palm', 'Vapor', 'Marble', 'Holo', 'Laser',
  'Neon', 'Crystal', 'Pixel', 'Echo', 'Nova', 'Flux', 'Cyber', 'Dream',
  'Synth', 'Retro', 'Glitch', 'Vortex', 'Plasma', 'Quantum', 'Void', 'Haze',
  'Drift', 'Wave', 'Pulse', 'Static', 'Binary', 'Vector', 'Hologram', 'Spectra'
];

// Digital/light/glitch words (expanded for uniqueness)
const vaporPlaces = [
  'Signal', 'Pulse', 'Grid', 'Ray', 'Buffer', 'Bloom', 'Static', 'Drift',
  'Wave', 'Core', 'Zone', 'Realm', 'Field', 'Stream', 'Echo', 'Glow',
  'Flare', 'Surge', 'Beam', 'Flash', 'Burst', 'Flow', 'Cascade', 'Ripple',
  'Shimmer', 'Spark', 'Trace', 'Arc', 'Loop', 'Cycle', 'Phase', 'Shift'
];

// Moods (tied to combined color relationship)
const moods = ['Nostalgic', 'Ethereal', 'Melancholic', 'Euphoric', 'Serene', 'Electric', 'Hazy', 'Transcendent'];

// Eras
const eras = ['1984', '1987', '1991', '1995', '1999', '2001'];

// Styles (visual rendering style) - Void is RARE
const styles = ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void'];

function generateTraitsFromSeed(seed) {
  const primaryIdx = seed % 8;
  const secondaryIdx = Math.floor(seed / 8) % 8;
  const moodIdx = (primaryIdx + secondaryIdx) % 8;
  const eraIdx = Math.floor(seed / 64) % 6;
  
  // Style selection matches art.html (Void is ~5% rare)
  const R = mulberry32(seed);
  const variantRoll = R();
  let styleIdx;
  if (variantRoll < 0.19) styleIdx = 0;        // Synthwave ~19%
  else if (variantRoll < 0.38) styleIdx = 1;   // Databend ~19%
  else if (variantRoll < 0.57) styleIdx = 2;   // Corrupt ~19%
  else if (variantRoll < 0.76) styleIdx = 3;   // Neon ~19%
  else if (variantRoll < 0.95) styleIdx = 4;   // Isometric ~19%
  else styleIdx = 5;                            // Void ~5% RARE
  
  return {
    style: styles[styleIdx],
    primaryColor: colorNames[primaryIdx],
    secondaryColor: colorNames[secondaryIdx],
    mood: moods[moodIdx],
    era: eras[eraIdx],
    primaryIdx,
    secondaryIdx
  };
}

function generateName(seed, tokenId, traits) {
  // Use different bits of seed for name (independent of color traits)
  // This ensures 32 × 32 = 1024 unique name combinations
  const prefixIdx = seed % 32;
  const placeIdx = Math.floor(seed / 32) % 32;
  return `${vaporPrefix[prefixIdx]} ${vaporPlaces[placeIdx]} #${tokenId}`;
}

function generateDescription(seed, traits) {
  const { style, primaryColor, secondaryColor, mood, era } = traits;
  
  // Poetic description templates
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
  
  const templateIdx = seed % 8;
  
  // Handle same-color case
  if (primaryColor === secondaryColor) {
    const pureTemplates = [
      `Pure ${primaryColor.toLowerCase()} ${mood.toLowerCase()} from ${era}. ${style} dreams in monochrome.`,
      `${era}. A singular ${primaryColor.toLowerCase()} frequency. ${mood} and infinite.`,
      `${style} transmission in pure ${primaryColor.toLowerCase()}. ${mood} echoes from ${era}.`,
      `All ${primaryColor.toLowerCase()}. All ${mood.toLowerCase()}. ${era}.`
    ];
    return pureTemplates[seed % 4];
  }
  
  return templates[templateIdx]();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  const { tokenId, seed: seedParam } = req.query;
  const id = parseInt(tokenId) || 1;
  // Use real on-chain seed from TOKEN_SEEDS, fall back to seedParam or id
  const seed = TOKEN_SEEDS[id.toString()] || parseInt(seedParam) || id;

  // Generate deterministic traits from seed
  const traits = generateTraitsFromSeed(seed);
  const uniqueName = generateName(seed, id, traits);
  const description = generateDescription(seed, traits);

  // Use Arweave image if available, otherwise fallback to SVG endpoint
  const imageUrl = ARWEAVE_IMAGES[id.toString()] || `${FALLBACK_IMAGE_BASE}/${seed}`;

  // Build attributes array
  const attributes = [
    { trait_type: "Style", value: traits.style },
    { trait_type: "Primary Aura", value: traits.primaryColor },
    { trait_type: "Secondary Aura", value: traits.secondaryColor },
    { trait_type: "Mood", value: traits.mood },
    { trait_type: "Era", value: traits.era },
    { trait_type: "Seed", value: seed.toString() }
  ];

  const metadata = {
    name: uniqueName,
    description: description,
    image: imageUrl,
    animation_url: `${getAnimationUrl(tokenId)}#seed=${seed}`,
    external_url: "https://vector-dream.vercel.app",
    attributes
  };

  res.status(200).json(metadata);
};
