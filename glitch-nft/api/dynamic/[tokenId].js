/**
 * Vector Dream Metadata API
 * Unique vaporwave names + traits based on seed
 * With Arweave images from processed mints
 */

// Animation URL - supports both ?seed= and #seed= (using hash for gateway compatibility)
const ARWEAVE_ANIMATION = 'https://gateway.irys.xyz/J4bJx08zZmM1QEIPMbi9xfO3ICekBgyvzqrDPe4Y04I';
const getAnimationUrl = (tokenId) => ARWEAVE_ANIMATION;
const FALLBACK_IMAGE_BASE = 'https://vector-dream.vercel.app/api/svg';

// Arweave image URLs - all using gateway.irys.xyz
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
  "11": "https://gateway.irys.xyz/N8y8irlW2xG6kGVdYWbgo932zBnfOC-juC0slKrjOng"
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

// Vaporwave prefix (tied to primary color)
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

// Digital/light/glitch words (tied to secondary color)
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
  const { primaryIdx, secondaryIdx } = traits;
  return `${vaporPrefix[primaryIdx]} ${vaporPlaces[secondaryIdx]} #${tokenId}`;
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
  const seed = parseInt(seedParam) || id;

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
