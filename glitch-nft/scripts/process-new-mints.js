/**
 * Process new mints - render art and upload to Arweave
 * Run periodically via cron to auto-process new NFTs
 */

const { ethers } = require('ethers');
const puppeteer = require('puppeteer');
const Irys = require('@irys/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONTRACT = '0xbae88927f84adc3a16aa3a41340631f5f285fa0a';
const RPC = 'https://mainnet.base.org';
const ART_URL = 'https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8';
const PROCESSED_FILE = path.join(__dirname, '..', '.processed-mints.json');
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

// Helper to replace deprecated page.waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Refresh OpenSea metadata for a token
async function refreshOpenSeaMetadata(tokenId) {
  if (!OPENSEA_API_KEY) {
    console.log(`  ⚠️ No OpenSea API key, skipping metadata refresh`);
    return;
  }
  
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/contract/${CONTRACT}/nfts/${tokenId}/refresh`,
      {
        method: 'POST',
        headers: { 'x-api-key': OPENSEA_API_KEY }
      }
    );
    
    if (response.ok) {
      console.log(`  🔄 OpenSea metadata refresh queued`);
    } else {
      const text = await response.text();
      console.log(`  ⚠️ OpenSea refresh failed: ${text}`);
    }
  } catch (e) {
    console.log(`  ⚠️ OpenSea refresh error: ${e.message}`);
  }
}

async function main() {
  console.log('🔍 Checking for new mints...');
  
  // Load processed mints
  let processed = {};
  if (fs.existsSync(PROCESSED_FILE)) {
    processed = JSON.parse(fs.readFileSync(PROCESSED_FILE));
  }
  
  // Get current supply
  const provider = new ethers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(CONTRACT, [
    'function totalSupply() view returns (uint256)',
    'function tokenSeed(uint256) view returns (uint256)'
  ], provider);
  
  const supply = Number(await contract.totalSupply());
  console.log(`Total minted: ${supply}`);
  
  if (supply === 0) {
    console.log('No mints yet');
    return;
  }
  
  // Check each token
  let newMints = [];
  for (let i = 1; i <= supply; i++) {
    if (!processed[i]) {
      const seed = Number(await contract.tokenSeed(i));
      newMints.push({ tokenId: i, seed });
    }
  }
  
  if (newMints.length === 0) {
    console.log('✅ All mints processed');
    return;
  }
  
  console.log(`📦 Found ${newMints.length} new mint(s) to process`);
  
  // Initialize Irys
  const irys = new Irys({
    network: 'mainnet',
    token: 'base-eth',
    key: process.env.PRIVATE_KEY,
    config: { providerUrl: RPC }
  });
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  for (const { tokenId, seed } of newMints) {
    console.log(`\n🎨 Processing token #${tokenId} (seed: ${seed})...`);
    
    try {
      // Render the art
      const page = await browser.newPage();
      await page.setViewport({ width: 1000, height: 1000 });
      await page.goto(`${ART_URL}?seed=${seed}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await wait(3000); // Let art animate
      
      const screenshot = await page.screenshot({ type: 'png' });
      await page.close();
      
      console.log(`  📸 Rendered (${screenshot.length} bytes)`);
      
      // Upload to Arweave
      const receipt = await irys.upload(screenshot, {
        tags: [
          { name: 'Content-Type', value: 'image/png' },
          { name: 'App-Name', value: 'VectorDream' },
          { name: 'TokenId', value: tokenId.toString() },
          { name: 'Seed', value: seed.toString() }
        ]
      });
      
      const arweaveUrl = `https://arweave.net/${receipt.id}`;
      console.log(`  ✅ Uploaded: ${arweaveUrl}`);
      
      // Save to processed
      processed[tokenId] = {
        seed,
        arweaveUrl,
        processedAt: new Date().toISOString()
      };
      fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));
      
      // Refresh OpenSea metadata
      await refreshOpenSeaMetadata(tokenId);
      
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
    }
  }
  
  await browser.close();
  
  // Update the API file with new Arweave URLs and deploy
  if (newMints.length > 0) {
    console.log('\n📝 Updating API with new Arweave URLs...');
    const { execSync } = require('child_process');
    
    try {
      // Build the new ARWEAVE_IMAGES object
      const imageEntries = Object.entries(processed)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([id, info]) => `  "${id}": "${info.arweaveUrl}"`)
        .join(',\n');
      
      const newImagesBlock = `// Arweave image URLs (updated by process-new-mints.js, commit to deploy)
const ARWEAVE_IMAGES = {
${imageEntries}
};`;
      
      // Read the API file
      const apiPath = path.join(__dirname, '..', 'api', 'dynamic', '[tokenId].js');
      let apiContent = fs.readFileSync(apiPath, 'utf8');
      
      // Replace the ARWEAVE_IMAGES block
      apiContent = apiContent.replace(
        /\/\/ Arweave image URLs.*?const ARWEAVE_IMAGES = \{[\s\S]*?\};/,
        newImagesBlock
      );
      
      fs.writeFileSync(apiPath, apiContent);
      console.log('  ✅ API file updated');
      
      // Commit and push
      console.log('\n🚀 Deploying to Vercel via git push...');
      execSync('git add -A', { cwd: path.join(__dirname, '..') });
      execSync(`git commit -m "auto: update Arweave URLs for tokens ${newMints.map(m => m.tokenId).join(', ')}"`, { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      execSync('git push', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('✅ Deployed!');
      
    } catch (e) {
      console.log(`⚠️ Auto-deploy failed: ${e.message}`);
      console.log('Run manually: git add -A && git commit -m "update arweave urls" && git push');
    }
  }
  
  console.log('\n🎉 Done!');
}

main().catch(console.error);
