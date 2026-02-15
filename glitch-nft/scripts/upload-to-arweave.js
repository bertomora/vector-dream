/**
 * Upload previews to Arweave via Irys (formerly Bundlr)
 * 
 * Setup:
 *   npm install @irys/sdk
 * 
 * Usage:
 *   node scripts/upload-to-arweave.js
 * 
 * Requirements:
 *   - PRIVATE_KEY env var (same wallet used for contract deployment)
 *   - Small amount of ETH on mainnet OR matic for gas
 */

const Irys = require('@irys/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PREVIEWS_DIR = path.join(__dirname, '..', 'previews');

async function main() {
  console.log('📤 Arweave Upload via Irys\n');

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log('❌ PRIVATE_KEY not found in .env');
    console.log('\nAlternative: Upload manually via ArDrive');
    console.log('1. Go to https://app.ardrive.io');
    console.log('2. Create account / connect wallet');
    console.log('3. Upload the previews/ folder');
    console.log('4. Copy the folder\'s Arweave URL');
    return;
  }

  // Check for previews
  if (!fs.existsSync(PREVIEWS_DIR)) {
    console.log('❌ No previews/ folder found');
    console.log('Run: node scripts/generate-previews.js');
    return;
  }

  const files = fs.readdirSync(PREVIEWS_DIR).filter(f => f.endsWith('.png'));
  if (files.length === 0) {
    console.log('❌ No PNG files in previews/');
    return;
  }

  console.log(`Found ${files.length} preview(s) to upload\n`);

  try {
    // Initialize Irys with Ethereum mainnet
    // You can also use 'matic' for cheaper uploads
    const irys = new Irys({
      network: 'mainnet', // or 'devnet' for testing
      token: 'ethereum',  // or 'matic' for Polygon
      key: privateKey,
    });

    // Check balance
    const balance = await irys.getLoadedBalance();
    console.log(`Irys balance: ${irys.utils.fromAtomic(balance)} ETH`);

    // Calculate upload cost
    let totalSize = 0;
    for (const file of files) {
      const stats = fs.statSync(path.join(PREVIEWS_DIR, file));
      totalSize += stats.size;
    }
    
    const price = await irys.getPrice(totalSize);
    console.log(`Estimated cost: ${irys.utils.fromAtomic(price)} ETH for ${(totalSize/1024).toFixed(1)}KB\n`);

    // Fund if needed
    if (balance < price) {
      console.log('⚠️  Insufficient balance. Funding...');
      const fundTx = await irys.fund(price);
      console.log(`Funded: ${fundTx.id}`);
    }

    // Upload each file
    const uploadedUrls = {};
    for (const file of files) {
      const filePath = path.join(PREVIEWS_DIR, file);
      console.log(`📸 Uploading ${file}...`);
      
      const receipt = await irys.uploadFile(filePath, {
        tags: [
          { name: 'Content-Type', value: 'image/png' },
          { name: 'App-Name', value: 'Vector Dream' },
        ],
      });
      
      const url = `https://arweave.net/${receipt.id}`;
      uploadedUrls[file] = url;
      console.log(`   ✅ ${url}`);
    }

    // Save manifest
    const manifestPath = path.join(__dirname, '..', 'arweave-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(uploadedUrls, null, 2));
    console.log(`\n✅ Manifest saved to arweave-manifest.json`);

    console.log('\nNext steps:');
    console.log('1. Update api/dynamic/[tokenId].js with these URLs');
    console.log('2. Redeploy to Vercel');

  } catch (e) {
    console.log(`\n❌ Error: ${e.message}`);
    console.log('\nAlternative: Upload manually via ArDrive');
    console.log('1. Go to https://app.ardrive.io');
    console.log('2. Upload the previews/ folder');
    console.log('3. Copy each file\'s Arweave URL');
  }
}

main().catch(console.error);
