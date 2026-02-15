/**
 * Vector Dream Metadata API
 * Unique vaporwave names + traits based on seed
 */

// Arweave URLs
const ARWEAVE_ANIMATION = 'https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8';
const PREVIEW_BASE = 'https://vector-dream.vercel.app/previews';

// Mulberry32 PRNG - deterministic from seed
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Trait definitions
const TRAITS = {
  style: ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void', 'Plasma', 'Glitch'],
  palette: ['Pixel Cyan', 'Midnight Teal', 'Coral Aqua', 'Fuchsia Mint', 'Rose Turquoise', 
            'Citrus Violet', 'Bronze Indigo', 'Ember Violet', 'Neon Blush', 'Chrome Sunset'],
  composition: ['Centered', 'Scattered', 'Layered', 'Spiral', 'Grid', 'Radial', 'Fractured'],
  energy: ['Calm', 'Pulsing', 'Chaotic', 'Flowing', 'Static', 'Explosive'],
  depth: ['Shallow', 'Deep', 'Infinite', 'Layered', 'Flat'],
  texture: ['Smooth', 'Grainy', 'Pixelated', 'Scanlined', 'Crystalline', 'Liquid'],
  mood: ['Melancholic', 'Euphoric', 'Mysterious', 'Aggressive', 'Serene', 'Nostalgic']
};

// Vaporwave name components
const NAME_PARTS = {
  prefix: ['Neo', 'Cyber', 'Neon', 'Digital', 'Synth', 'Vapor', 'Crystal', 'Chrome', 
           'Pixel', 'Laser', 'Holo', 'Retro', 'Astral', 'Quantum', 'Void', 'Echo'],
  core: ['Dream', 'Wave', 'Pulse', 'Grid', 'Flux', 'Storm', 'Drift', 'Bloom', 
         'Surge', 'Prism', 'Haze', 'Burst', 'Flow', 'Glow', 'Fade', 'Rush'],
  suffix: ['Protocol', 'System', 'Matrix', 'Zone', 'Sector', 'Dimension', 'Realm', 
           'Horizon', 'Spectrum', 'Network', 'Core', 'Loop', 'Verse', 'Scape']
};

// Japanese-style additions (optional flavor)
const JAPANESE = ['零', '夢', '波', '光', '影', '空', '星', '風', '雲', '龍'];

function generateTraits(seed) {
  const rand = mulberry32(seed);
  
  return {
    style: TRAITS.style[Math.floor(rand() * TRAITS.style.length)],
    palette: TRAITS.palette[Math.floor(rand() * TRAITS.palette.length)],
    composition: TRAITS.composition[Math.floor(rand() * TRAITS.composition.length)],
    energy: TRAITS.energy[Math.floor(rand() * TRAITS.energy.length)],
    depth: TRAITS.depth[Math.floor(rand() * TRAITS.depth.length)],
    texture: TRAITS.texture[Math.floor(rand() * TRAITS.texture.length)],
    mood: TRAITS.mood[Math.floor(rand() * TRAITS.mood.length)]
  };
}

function generateName(seed, tokenId) {
  const rand = mulberry32(seed + 12345); // Offset seed for name generation
  
  const prefix = NAME_PARTS.prefix[Math.floor(rand() * NAME_PARTS.prefix.length)];
  const core = NAME_PARTS.core[Math.floor(rand() * NAME_PARTS.core.length)];
  const suffix = NAME_PARTS.suffix[Math.floor(rand() * NAME_PARTS.suffix.length)];
  const jp = JAPANESE[Math.floor(rand() * JAPANESE.length)];
  
  // Various name formats
  const formats = [
    `${prefix}${core} ${jp}`,
    `${prefix} ${core}${suffix}`,
    `${jp} ${prefix}${core}`,
    `${core}${suffix} ${jp}`,
    `${prefix}${suffix}`,
  ];
  
  const name = formats[Math.floor(rand() * formats.length)];
  return `${name} #${tokenId}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  const { tokenId, seed: seedParam } = req.query;
  const id = parseInt(tokenId) || 1;
  const seed = parseInt(seedParam) || id;

  // Generate deterministic traits and name from seed
  const traits = generateTraits(seed);
  const uniqueName = generateName(seed, id);

  // Build attributes array
  const attributes = [
    { trait_type: "Style", value: traits.style },
    { trait_type: "Palette", value: traits.palette },
    { trait_type: "Composition", value: traits.composition },
    { trait_type: "Energy", value: traits.energy },
    { trait_type: "Depth", value: traits.depth },
    { trait_type: "Texture", value: traits.texture },
    { trait_type: "Mood", value: traits.mood },
    { trait_type: "Seed", value: seed.toString() },
    { trait_type: "Type", value: "Generative" },
    { trait_type: "Interactive", value: "Yes" }
  ];

  const metadata = {
    name: uniqueName,
    description: `An interactive generative vector art piece. Style: ${traits.style}, Palette: ${traits.palette}, Mood: ${traits.mood}. Each piece is unique, determined by seed ${seed}.`,
    image: `${PREVIEW_BASE}/${seed}.png`,
    animation_url: `${ARWEAVE_ANIMATION}?seed=${seed}`,
    external_url: "https://vector-dream.vercel.app",
    attributes
  };

  res.status(200).json(metadata);
};
