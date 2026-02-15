/**
 * Generate PNG previews for all minted tokens
 * Uses Puppeteer to screenshot the WebGL art
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

// Config
const ARWEAVE_HTML = 'https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8';
const OUTPUT_DIR = path.join(__dirname, '..', 'previews');
const IMAGE_SIZE = 1000; // 1000x1000 px
const RENDER_WAIT_MS = 3000; // Wait for WebGL to render

// Contract addresses to check for mints
const CONTRACTS = [
  '0xbaE88927F84adc3a16aa3A41340631f5F285FA0A', // VectorDreamDynamic (current)
  '0x8f66B06D02D857c3B7739aa9318BEeEA54bBA03b', // Working original
];

async function getTokenSeeds() {
  console.log('🔍 Fetching minted tokens...\n');
  const tokens = [];

  for (const addr of CONTRACTS) {
    try {
      const contract = await ethers.getContractAt('VectorDreamDynamic', addr);
      const totalSupply = await contract.totalSupply();
      console.log(`Contract ${addr.slice(0,8)}... has ${totalSupply} tokens`);

      for (let i = 1; i <= totalSupply; i++) {
        try {
          const seed = await contract.tokenSeed(i);
          tokens.push({ tokenId: i, seed: seed.toString(), contract: addr });
        } catch (e) {
          // tokenSeed might not exist on all contracts
          tokens.push({ tokenId: i, seed: i.toString(), contract: addr });
        }
      }
    } catch (e) {
      console.log(`  Skipping ${addr.slice(0,8)}... (${e.message.slice(0,50)})`);
    }
  }

  return tokens;
}

async function capturePreview(browser, seed, outputPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: IMAGE_SIZE, height: IMAGE_SIZE });
  
  const url = `${ARWEAVE_HTML}?seed=${seed}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for WebGL to render (using setTimeout instead of deprecated waitForTimeout)
  await new Promise(resolve => setTimeout(resolve, RENDER_WAIT_MS));
  
  await page.screenshot({ 
    path: outputPath, 
    type: 'png',
    clip: { x: 0, y: 0, width: IMAGE_SIZE, height: IMAGE_SIZE }
  });
  
  await page.close();
}

async function generateSpecificSeeds(seeds) {
  console.log('🎨 Generating previews for specific seeds...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const seed of seeds) {
    const outputPath = path.join(OUTPUT_DIR, `${seed}.png`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Seed ${seed} already exists, skipping`);
      continue;
    }

    console.log(`📸 Capturing seed ${seed}...`);
    try {
      await capturePreview(browser, seed, outputPath);
      console.log(`   ✅ Saved to ${outputPath}`);
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n✅ Done! Previews saved to:', OUTPUT_DIR);
}

async function main() {
  // Check for command line args
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Generate specific seeds from command line
    const seeds = args.map(s => parseInt(s)).filter(s => !isNaN(s));
    await generateSpecificSeeds(seeds);
    return;
  }

  // Otherwise, fetch from contracts
  console.log('🖼️  Vector Dream Preview Generator\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tokens = await getTokenSeeds();
  
  if (tokens.length === 0) {
    console.log('No tokens found. Generate specific seeds with:');
    console.log('  node scripts/generate-previews.js 77909 12345 ...');
    return;
  }

  console.log(`\n📦 Found ${tokens.length} tokens to process\n`);

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const token of tokens) {
    const outputPath = path.join(OUTPUT_DIR, `${token.seed}.png`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Token #${token.tokenId} (seed ${token.seed}) already exists, skipping`);
      continue;
    }

    console.log(`📸 Capturing token #${token.tokenId} (seed ${token.seed})...`);
    try {
      await capturePreview(browser, token.seed, outputPath);
      console.log(`   ✅ Saved`);
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`);
    }
  }

  await browser.close();
  
  console.log('\n✅ Done! Previews saved to:', OUTPUT_DIR);
  console.log('\nNext steps:');
  console.log('1. Upload previews/ folder to Arweave');
  console.log('2. Update api/dynamic/[tokenId].js with Arweave URL');
  console.log('3. Redeploy to Vercel');
}

main().catch(console.error);
