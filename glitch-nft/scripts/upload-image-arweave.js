/**
 * Upload PNG image to Arweave for permanent storage
 * Usage: node scripts/upload-image-arweave.js <seed>
 */

const Arweave = require('arweave');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

async function main() {
  const seed = process.argv[2];
  if (!seed) {
    console.log('Usage: node scripts/upload-image-arweave.js <seed>');
    process.exit(1);
  }

  const imagePath = path.join(__dirname, '..', 'images', `${seed}.png`);
  if (!fs.existsSync(imagePath)) {
    console.log(`Image not found: ${imagePath}`);
    console.log('Run: node scripts/render-art.js', seed);
    process.exit(1);
  }

  console.log(`📤 Uploading ${seed}.png to Arweave...\n`);

  // Load wallet
  const keyfilePath = process.env.ARWEAVE_KEY_FILE;
  if (!keyfilePath || !fs.existsSync(keyfilePath)) {
    console.log('❌ No Arweave wallet found');
    console.log('Set ARWEAVE_KEY_FILE in .env');
    process.exit(1);
  }

  const key = JSON.parse(fs.readFileSync(keyfilePath));
  const address = await arweave.wallets.jwkToAddress(key);
  const balance = await arweave.wallets.getBalance(address);
  const ar = arweave.ar.winstonToAr(balance);
  
  console.log(`Wallet: ${address}`);
  console.log(`Balance: ${ar} AR\n`);

  // Read the image
  const imageData = fs.readFileSync(imagePath);
  console.log(`File size: ${(imageData.length / 1024).toFixed(2)} KB`);

  // Create transaction
  const tx = await arweave.createTransaction({ data: imageData }, key);
  
  // Add tags
  tx.addTag('Content-Type', 'image/png');
  tx.addTag('App-Name', 'VectorDream');
  tx.addTag('Type', 'nft-image');
  tx.addTag('Seed', seed);
  
  // Get price
  const price = arweave.ar.winstonToAr(tx.reward);
  console.log(`Upload cost: ${price} AR\n`);

  if (parseFloat(ar) < parseFloat(price)) {
    console.log('❌ Insufficient AR balance');
    console.log(`Need: ${price} AR, Have: ${ar} AR`);
    process.exit(1);
  }

  // Sign and submit
  await arweave.transactions.sign(tx, key);
  
  console.log('Submitting transaction...');
  const response = await arweave.transactions.post(tx);
  
  if (response.status === 200) {
    const arweaveUrl = `https://arweave.net/${tx.id}`;
    console.log('\n✅ Upload successful!\n');
    console.log('Transaction ID:', tx.id);
    console.log('Permanent URL:', arweaveUrl);
    console.log('\n⏳ May take 5-10 minutes to be accessible');
    
    // Save to mapping file
    const mappingPath = path.join(__dirname, '..', '.arweave-images.json');
    let mapping = {};
    if (fs.existsSync(mappingPath)) {
      mapping = JSON.parse(fs.readFileSync(mappingPath));
    }
    mapping[seed] = arweaveUrl;
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`\nSaved to .arweave-images.json`);
  } else {
    console.error('❌ Upload failed:', response.status, response.statusText);
  }
}

main().catch(console.error);
