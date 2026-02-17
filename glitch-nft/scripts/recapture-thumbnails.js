const puppeteer = require('puppeteer');
const Irys = require('@irys/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// All tokens with their seeds
const TOKENS = {
  1: 71296,
  2: 63756,
  3: 48331,
  4: 58,
  5: 11590,
  6: 31444,
  7: 93825,
  8: 94799,
  9: 96384,
  10: 91251,
  11: 36429
};

// V1 for legacy tokens (3-7), V2 for all others
const V1_LEGACY_TOKENS = [3, 4, 5, 6, 7];
const V1_ANIMATION = 'https://gateway.irys.xyz/J4bJx08zZmM1QEIPMbi9xfO3ICekBgyvzqrDPe4Y04I';
const V2_ANIMATION = 'https://gateway.irys.xyz/5dRL0pCZUH4-LLlqEUnkgubAlqNd5PrRWzLEa8hwafY';

const PROCESSED_FILE = path.join(__dirname, '..', '.processed-mints.json');

async function main() {
  console.log('🎨 Re-capturing ALL thumbnails without borders...\n');
  console.log('V1 (legacy): tokens 3-7');
  console.log('V2 (stabilized): tokens 1, 2, 8-11\n');
  
  const irys = new Irys({
    network: 'mainnet',
    token: 'base-eth',
    key: process.env.PRIVATE_KEY,
    config: { providerUrl: 'https://mainnet.base.org' }
  });
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {};
  
  for (const [tokenId, seed] of Object.entries(TOKENS)) {
    const isLegacy = V1_LEGACY_TOKENS.includes(parseInt(tokenId));
    const artUrl = isLegacy ? V1_ANIMATION : V2_ANIMATION;
    const version = isLegacy ? 'V1' : 'V2';
    
    console.log(`Token #${tokenId} (seed: ${seed}) [${version}]...`);
    
    try {
      const page = await browser.newPage();
      // Set viewport to exactly 1000x1000
      await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 });
      
      // Load with hash-based seed
      await page.goto(`${artUrl}#seed=${seed}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      
      // Screenshot just the canvas element (no black borders)
      const canvas = await page.$('canvas');
      if (!canvas) {
        console.log('  ⚠️ No canvas found, taking full page screenshot');
        const screenshot = await page.screenshot({ type: 'png' });
        await page.close();
        continue;
      }
      
      const screenshot = await canvas.screenshot({ type: 'png' });
      await page.close();
      
      console.log(`  📸 Captured (${screenshot.length} bytes)`);
      
      // Upload
      const receipt = await irys.upload(screenshot, {
        tags: [
          { name: 'Content-Type', value: 'image/png' },
          { name: 'App-Name', value: 'VectorDream' },
          { name: 'TokenId', value: tokenId },
          { name: 'Seed', value: seed.toString() },
          { name: 'Version', value: version }
        ]
      });
      
      results[tokenId] = `https://gateway.irys.xyz/${receipt.id}`;
      console.log(`  ✅ ${results[tokenId]}`);
      
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
    }
  }
  
  await browser.close();
  
  console.log('\n📝 New URLs:');
  console.log(JSON.stringify(results, null, 2));
  
  // Update .processed-mints.json
  if (Object.keys(results).length > 0) {
    console.log('\n📦 Updating .processed-mints.json...');
    let processed = {};
    if (fs.existsSync(PROCESSED_FILE)) {
      processed = JSON.parse(fs.readFileSync(PROCESSED_FILE));
    }
    
    for (const [tokenId, url] of Object.entries(results)) {
      if (processed[tokenId]) {
        processed[tokenId].arweaveUrl = url;
        processed[tokenId].recapturedAt = new Date().toISOString();
      } else {
        processed[tokenId] = {
          seed: TOKENS[tokenId],
          arweaveUrl: url,
          processedAt: new Date().toISOString()
        };
      }
    }
    
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));
    console.log('✅ .processed-mints.json updated');
    
    // Also update the dynamic API file
    console.log('\n📝 Updating api/dynamic/[tokenId].js...');
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
    console.log('✅ api/dynamic/[tokenId].js updated');
  }
  
  console.log('\n🎉 Done! Run: git add -A && git commit -m "recapture all thumbnails" && git push');
}

main().catch(e => console.log('Error:', e.message));
