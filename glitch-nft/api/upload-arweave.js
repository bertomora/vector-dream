const Irys = require('@irys/sdk');
const { ethers } = require('ethers');

const CONTRACT = '0xE62063ab44cC5B069e2C088afd876baC3d73b447';
const RPC = 'https://mainnet.base.org';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  const { tokenId } = req.body || req.query;
  
  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId required' });
  }

  try {
    // Get seed from contract
    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(CONTRACT, [
      'function tokenSeed(uint256) view returns (uint256)'
    ], provider);
    
    const seed = await contract.tokenSeed(tokenId);
    const seedNum = Number(seed);
    
    // Generate SVG
    const svg = generateSVG(seedNum);
    
    // Upload to Arweave via Irys
    const irys = new Irys({
      network: 'mainnet',
      token: 'base-eth',
      key: process.env.PRIVATE_KEY,
      config: { providerUrl: RPC }
    });
    
    const receipt = await irys.upload(svg, { 
      tags: [
        { name: 'Content-Type', value: 'image/svg+xml' },
        { name: 'App-Name', value: 'VectorDream' },
        { name: 'TokenId', value: tokenId.toString() },
        { name: 'Seed', value: seedNum.toString() }
      ] 
    });
    
    const arweaveUrl = `https://arweave.net/${receipt.id}`;
    
    res.status(200).json({ 
      success: true, 
      tokenId,
      seed: seedNum,
      arweaveUrl 
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function generateSVG(seedNum) {
  const colors = ['#ff6ec4', '#7873f5', '#4ff0ff', '#00ff87', '#60efff', '#ffaa00', '#ff6b6b', '#a55eea'];
  const styles = ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void'];

  const c1 = colors[seedNum % 8];
  const c2 = colors[Math.floor(seedNum / 8) % 8];
  const style = styles[seedNum % 6];
  const cx1 = 80 + ((seedNum * 7) % 240);
  const cy1 = 80 + ((seedNum * 11) % 240);
  const cx2 = 80 + ((seedNum * 13) % 240);
  const cy2 = 80 + ((seedNum * 17) % 240);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#0a0a12"/>
  <circle cx="${cx1}" cy="${cy1}" r="80" fill="${c1}" opacity="0.3"/>
  <circle cx="${cx2}" cy="${cy2}" r="100" fill="${c2}" opacity="0.3"/>
  <text x="200" y="160" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${c1}">VECTOR DREAM</text>
  <text x="200" y="230" text-anchor="middle" font-family="sans-serif" font-size="56" fill="#fff">#${seedNum}</text>
  <text x="200" y="290" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${c2}">${style}</text>
</svg>`;
}
