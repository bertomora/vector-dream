const Irys = require('@irys/sdk');
require('dotenv').config();

const seed = process.argv[2] || '12345';

// Generate SVG for the seed
const colors = ['#ff6ec4', '#7873f5', '#4ff0ff', '#00ff87', '#60efff', '#ffaa00', '#ff6b6b', '#a55eea'];
const styles = ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void'];

const seedNum = parseInt(seed);
const c1 = colors[seedNum % 8];
const c2 = colors[Math.floor(seedNum / 8) % 8];
const style = styles[seedNum % 6];
const cx1 = 80 + ((seedNum * 7) % 240);
const cy1 = 80 + ((seedNum * 11) % 240);
const cx2 = 80 + ((seedNum * 13) % 240);
const cy2 = 80 + ((seedNum * 17) % 240);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#0a0a12"/>
  <circle cx="${cx1}" cy="${cy1}" r="80" fill="${c1}" opacity="0.3"/>
  <circle cx="${cx2}" cy="${cy2}" r="100" fill="${c2}" opacity="0.3"/>
  <text x="200" y="160" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${c1}">VECTOR DREAM</text>
  <text x="200" y="230" text-anchor="middle" font-family="sans-serif" font-size="56" fill="#fff">#${seedNum}</text>
  <text x="200" y="290" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${c2}">${style}</text>
</svg>`;

(async () => {
  console.log(`Uploading SVG for seed ${seed} to Arweave...`);
  
  const irys = new Irys({
    network: 'mainnet',
    token: 'base-eth',
    key: process.env.PRIVATE_KEY,
    config: { providerUrl: 'https://mainnet.base.org' }
  });
  
  const balance = await irys.getLoadedBalance();
  console.log('Balance:', irys.utils.fromAtomic(balance).toString(), 'ETH');
  
  const price = await irys.getPrice(svg.length);
  console.log('Size:', svg.length, 'bytes, Cost:', irys.utils.fromAtomic(price).toString(), 'ETH');
  
  try {
    const receipt = await irys.upload(svg, { 
      tags: [
        { name: 'Content-Type', value: 'image/svg+xml' },
        { name: 'App-Name', value: 'VectorDream' },
        { name: 'Seed', value: seed }
      ] 
    });
    console.log('\n✅ SUCCESS!');
    console.log('Arweave URL:', `https://arweave.net/${receipt.id}`);
  } catch (e) {
    console.log('Failed:', e.message);
  }
})();
