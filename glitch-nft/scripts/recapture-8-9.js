const puppeteer = require('puppeteer');
const Irys = require('@irys/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TOKENS = { 8: 94799, 9: 96384 };
const V2_ANIMATION = 'https://gateway.irys.xyz/5dRL0pCZUH4-LLlqEUnkgubAlqNd5PrRWzLEa8hwafY';
const PROCESSED_FILE = path.join(__dirname, '..', '.processed-mints.json');

(async () => {
  console.log('Recapturing tokens 8 and 9 (V2 animation, no borders)...\n');
  
  const irys = new Irys({
    network: 'mainnet',
    token: 'base-eth',
    key: process.env.PRIVATE_KEY,
    config: { providerUrl: 'https://mainnet.base.org' }
  });
  
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const results = {};
  
  for (const [tokenId, seed] of Object.entries(TOKENS)) {
    console.log(`Token #${tokenId} (seed: ${seed})...`);
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 });
      await page.goto(`${V2_ANIMATION}#seed=${seed}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 4000));
      
      // Screenshot just the canvas element (no borders)
      const canvas = await page.$('canvas');
      let screenshot;
      if (canvas) {
        screenshot = await canvas.screenshot({ type: 'png' });
      } else {
        console.log('  No canvas found, using full page');
        screenshot = await page.screenshot({ type: 'png' });
      }
      await page.close();
      console.log(`  📸 Captured ${screenshot.length} bytes`);
      
      const receipt = await irys.upload(screenshot, {
        tags: [
          { name: 'Content-Type', value: 'image/png' },
          { name: 'App-Name', value: 'VectorDream' },
          { name: 'TokenId', value: tokenId },
          { name: 'Seed', value: seed.toString() }
        ]
      });
      
      results[tokenId] = `https://gateway.irys.xyz/${receipt.id}`;
      console.log(`  ✅ ${results[tokenId]}`);
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
    }
  }
  
  await browser.close();
  
  // Update .processed-mints.json
  console.log('\n📦 Updating .processed-mints.json...');
  let processed = JSON.parse(fs.readFileSync(PROCESSED_FILE));
  for (const [tokenId, url] of Object.entries(results)) {
    processed[tokenId].arweaveUrl = url;
    processed[tokenId].recapturedAt = new Date().toISOString();
  }
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));
  
  // Update api/dynamic/[tokenId].js
  console.log('📝 Updating api/dynamic/[tokenId].js...');
  const apiPath = path.join(__dirname, '..', 'api', 'dynamic', '[tokenId].js');
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  
  const imageEntries = Object.entries(processed)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([id, info]) => `  "${id}": "${info.arweaveUrl}"`)
    .join(',\n');
  
  const newImagesBlock = `// Arweave image URLs - all using gateway.irys.xyz
const ARWEAVE_IMAGES = {
${imageEntries}
};`;
  
  apiContent = apiContent.replace(
    /\/\/ Arweave image URLs[^\n]*\nconst ARWEAVE_IMAGES = \{[^}]*\};/,
    newImagesBlock
  );
  fs.writeFileSync(apiPath, apiContent);
  
  console.log('\n✅ Done! New URLs:');
  console.log(JSON.stringify(results, null, 2));
})();
