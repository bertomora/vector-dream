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
// V2 stabilized animation - all new mints use this
const ART_URL = 'https://gateway.irys.xyz/5dRL0pCZUH4-LLlqEUnkgubAlqNd5PrRWzLEa8hwafY';
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
      await page.goto(`${ART_URL}#seed=${seed}`, { waitUntil: 'networkidle0', timeout: 30000 });
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
      
      const arweaveUrl = `https://gateway.irys.xyz/${receipt.id}`;
      console.log(`  ✅ Uploaded: ${arweaveUrl}`);
      
      // Save to processed
      processed[tokenId] = {
        seed,
        arweaveUrl,
        processedAt: new Date().toISOString()
      };
      fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));
      
      // NOTE: OpenSea refresh moved to AFTER Vercel deployment
      
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
      // Build the ARWEAVE_IMAGES and TOKEN_SEEDS objects
      const sortedEntries = Object.entries(processed).sort((a, b) => Number(a[0]) - Number(b[0]));
      
      const imageEntries = sortedEntries
        .map(([id, info]) => `  "${id}": "${info.arweaveUrl}"`)
        .join(',\n');
      
      const seedEntries = sortedEntries
        .map(([id, info]) => `  "${id}": ${info.seed}`)
        .join(',\n');
      
      const newImagesBlock = `// Arweave image URLs (updated by process-new-mints.js)
const ARWEAVE_IMAGES = {
${imageEntries}
};

// On-chain seeds (updated by process-new-mints.js)
const TOKEN_SEEDS = {
${seedEntries}
};`;
      
      // Read the API file
      const apiPath = path.join(__dirname, '..', 'api', 'dynamic', '[tokenId].js');
      let apiContent = fs.readFileSync(apiPath, 'utf8');
      const originalContent = apiContent;
      
      // Replace the ARWEAVE_IMAGES + TOKEN_SEEDS block
      // Match from "// Arweave image URLs" through the TOKEN_SEEDS closing brace
      const regex = /\/\/ Arweave image URLs[^]*?const TOKEN_SEEDS = \{[^}]*\};/;
      if (regex.test(apiContent)) {
        apiContent = apiContent.replace(regex, newImagesBlock);
      } else {
        // Fallback: just replace ARWEAVE_IMAGES (first time adding TOKEN_SEEDS)
        const fallbackRegex = /\/\/ Arweave image URLs[^\n]*\r?\nconst ARWEAVE_IMAGES = \{[^}]*\};/;
        if (fallbackRegex.test(apiContent)) {
          apiContent = apiContent.replace(fallbackRegex, newImagesBlock);
        } else {
          console.log('  ⚠️ Could not find ARWEAVE_IMAGES block in API file');
        }
      }
      
      if (apiContent === originalContent) {
        console.log('  ⚠️ API file unchanged - regex may not have matched');
      } else {
        fs.writeFileSync(apiPath, apiContent);
        console.log('  ✅ API file updated');
      }
      
      // Commit, pull, push, then deploy directly with Vercel CLI
      console.log('\n🚀 Deploying to Vercel...');
      const repoDir = path.join(__dirname, '..');
      
      execSync('git add -A', { cwd: repoDir });
      
      try {
        execSync(`git commit -m "auto: update Arweave URLs for tokens ${newMints.map(m => m.tokenId).join(', ')}"`, { 
          cwd: repoDir,
          stdio: 'inherit'
        });
      } catch (e) {
        // No changes to commit is fine
        if (!e.message.includes('nothing to commit')) throw e;
      }
      
      // Pull with rebase to handle any remote changes, then push
      try {
        execSync('git pull --rebase', { cwd: repoDir, stdio: 'inherit' });
        execSync('git push', { cwd: repoDir, stdio: 'inherit' });
        console.log('  ✅ Git pushed');
      } catch (e) {
        console.log(`  ⚠️ Git push failed: ${e.message}`);
      }
      
      // Deploy directly with Vercel CLI (don't rely on GitHub integration)
      console.log('  📦 Running vercel --prod...');
      const vercelCmd = process.env.VERCEL_TOKEN 
        ? `vercel --prod -y --token=${process.env.VERCEL_TOKEN}`
        : 'vercel --prod -y';
      execSync(vercelCmd, { cwd: repoDir, stdio: 'inherit' });
      console.log('✅ Deployed!');
      
      // NOW refresh OpenSea metadata (after API is deployed with new image URLs)
      console.log('\n🔄 Refreshing OpenSea metadata...');
      for (const { tokenId } of newMints) {
        await refreshOpenSeaMetadata(tokenId);
      }
      
    } catch (e) {
      console.log(`⚠️ Auto-deploy failed: ${e.message}`);
      console.log('Run manually: git add -A && git commit -m "update arweave urls" && git push');
    }
  }
  
  console.log('\n🎉 Done!');
}

main().catch(console.error);
