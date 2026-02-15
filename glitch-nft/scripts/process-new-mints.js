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

const CONTRACT = '0xCE1b390410c45A8ef39BcA935e2Db4dce7E40494';
const RPC = 'https://mainnet.base.org';
const ART_URL = 'https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8';
const PROCESSED_FILE = path.join(__dirname, '..', '.processed-mints.json');

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
      await page.waitForTimeout(3000); // Let art animate
      
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
      
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
    }
  }
  
  await browser.close();
  
  // Redeploy to Vercel to update metadata API with new Arweave URLs
  if (newMints.length > 0) {
    console.log('\n🚀 Redeploying to Vercel...');
    const { execSync } = require('child_process');
    try {
      execSync('vercel --prod --yes', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit' 
      });
      console.log('✅ Deployed!');
    } catch (e) {
      console.log('⚠️ Deploy failed, run manually: vercel --prod --yes');
    }
  }
  
  console.log('\n🎉 Done!');
}

main().catch(console.error);
