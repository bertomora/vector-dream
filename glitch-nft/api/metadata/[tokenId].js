const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const CONTRACT = '0xCE1b390410c45A8ef39BcA935e2Db4dce7E40494';
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
    
    // Generate name and traits
    const first = ['Neon', 'Chrome', 'Digital', 'Cyber', 'Pixel', 'Void', 'Static', 'Prism', 'Holo', 'Synth', 'Echo', 'Flux', 'Drift', 'Glitch', 'Wave', 'Pulse'];
    const second = ['Dream', 'Haze', 'Bloom', 'Rain', 'Dusk', 'Fade', 'Rush', 'Glow', 'Mist', 'Zone', 'Tide', 'Vibe', 'Flow', 'Burst', 'Core', 'Edge'];
    const styles = ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void'];

    const name = `${first[seedNum % 16]} ${second[Math.floor(seedNum / 16) % 16]} #${tokenId}`;
    const style = styles[seedNum % 6];

    // Use Arweave URL if processed, otherwise fallback to SVG
    const imageUrl = ARWEAVE_URLS[tokenId] || `${BASE_URL}/api/svg/${seedNum}`;

    const metadata = {
      name: name,
      description: `Generative glitch art. Seed: ${seedNum}`,
      image: imageUrl,
      animation_url: `https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=${seedNum}`,
      external_url: BASE_URL,
      attributes: [
        { trait_type: 'Style', value: style },
        { trait_type: 'Seed', value: seedNum }
      ]
    };

    res.status(200).json(metadata);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
