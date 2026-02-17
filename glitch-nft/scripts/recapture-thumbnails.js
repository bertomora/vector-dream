const puppeteer = require('puppeteer');
const Irys = require('@irys/sdk');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const TOKENS = {
  1: 71296,
  2: 63756,
  8: 94799,
  9: 96384,
  10: 91251,
  11: 36429
};

// New art.html with hash support and no borders
const ART_URL = 'https://gateway.irys.xyz/J4bJx08zZmM1QEIPMbi9xfO3ICekBgyvzqrDPe4Y04I';

async function main() {
  console.log('🎨 Re-capturing thumbnails without borders...\n');
  
  const irys = new Irys({
    network: 'mainnet',
    token: 'base-eth',
    key: process.env.PRIVATE_KEY,
    config: { providerUrl: 'https://mainnet.base.org' }
  });
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = {};
  
  for (const [tokenId, seed] of Object.entries(TOKENS)) {
    console.log('Token ' + tokenId + ' (seed: ' + seed + ')...');
    
    const page = await browser.newPage();
    // Set viewport to exactly 1000x1000
    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 });
    
    // Load with hash-based seed
    await page.goto(ART_URL + '#seed=' + seed, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Screenshot just the canvas element (no black borders)
    const canvas = await page.$('canvas');
    const screenshot = await canvas.screenshot({ type: 'png' });
    await page.close();
    
    console.log('  📸 Captured (' + screenshot.length + ' bytes)');
    
    // Upload
    const receipt = await irys.upload(screenshot, {
      tags: [
        { name: 'Content-Type', value: 'image/png' },
        { name: 'App-Name', value: 'VectorDream' },
        { name: 'TokenId', value: tokenId },
        { name: 'Seed', value: seed.toString() }
      ]
    });
    
    results[tokenId] = 'https://gateway.irys.xyz/' + receipt.id;
    console.log('  ✅ ' + results[tokenId]);
  }
  
  await browser.close();
  
  console.log('\n📝 New URLs:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => console.log('Error:', e.message));
