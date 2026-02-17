/**
 * Vector Dream Metadata API
 * Unique vaporwave names + traits based on seed
 * With Arweave images from processed mints
 */

// Arweave URLs (using ar-io.net gateway for reliability)
const ARWEAVE_ANIMATION = 'https://ar-io.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8';
const FALLBACK_IMAGE_BASE = 'https://vector-dream.vercel.app/api/svg';

// Arweave image URLs (updated by process-new-mints.js, commit to deploy)
const ARWEAVE_IMAGES = {
  "1": "https://ar-io.net/0dU4C8ESkx2yeoQcBcJAKE2Nof1sfMCAKN83xnQW9oE",
  "2": "https://ar-io.net/PUk8g3SRqGdFFVk8upHQXcZdNA8I7sYpQGzWs3AQViM",
  "3": "https://ar-io.net/lnMWGqQUvcVNUUpZ1PLTtxDW7DCeFSe4SAB_fe1SzHE",
  "4": "https://ar-io.net/j2lOe68natrU72O-Y8gbQPwIzopaxtNPCkZLCnnLsQQ",
  "5": "https://ar-io.net/uFpAR2_P6Q2gH9lVKOzxmR7bnlCGkshzxDbLll7i5YQ",
  "6": "https://ar-io.net/9AFYuxs1vwGTamA3Kj67cTc9iANH_w6or1R1keT37t8",
  "7": "https://ar-io.net/6mibupU3xV7yCrn-4FMqCQqqXK56TT4CPDOcPSj5M0g",
  "8": "https://ar-io.net/FLI9Ae29n2g9fnaduvwpGxiBDGn6wMY7XCJ6EJhk6aM",
  "9": "https://arweave.net/tIAVTt4Ys57tuf4cjeeG3eMuN1Zr2aY6dMZz4fOL3SM",
  "10": "https://arweave.net/7rfuoDskU-GrFJl_6fdXSAmMoQzdADQG297uvwGIOoM"
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
    animation_url: `${ARWEAVE_ANIMATION}?seed=${seed}`,
    external_url: "https://vector-dream.vercel.app",
    attributes
  };

  res.status(200).json(metadata);
};
