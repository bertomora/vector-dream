/**
 * Upload art HTML to Arweave for permanent storage
 * 
 * Setup:
 * 1. Get an Arweave wallet: https://arweave.app
 * 2. Fund it with AR tokens (very cheap, ~$0.01 for this file)
 * 3. Export your keyfile as JSON
 * 4. Set ARWEAVE_KEY_FILE in .env
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
  console.log('📤 Uploading art to Arweave...\n');

  // Load wallet
  const keyfilePath = process.env.ARWEAVE_KEY_FILE;
  if (!keyfilePath) {
    console.log('⚠️  No ARWEAVE_KEY_FILE set in .env');
    console.log('');
    console.log('To upload to Arweave:');
    console.log('1. Create wallet at https://arweave.app');
    console.log('2. Export keyfile JSON');
    console.log('3. Add to .env: ARWEAVE_KEY_FILE=./arweave-wallet.json');
    console.log('4. Fund wallet with AR (~$0.01 needed)');
    console.log('');
    console.log('Alternatively, use https://ardrive.io for browser upload');
    console.log('or https://akord.com for free uploads');
    process.exit(1);
  }

  const key = JSON.parse(fs.readFileSync(keyfilePath));
  const address = await arweave.wallets.jwkToAddress(key);
  const balance = await arweave.wallets.getBalance(address);
  const ar = arweave.ar.winstonToAr(balance);
  
  console.log(`Wallet: ${address}`);
  console.log(`Balance: ${ar} AR\n`);

  // Read the HTML file
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  console.log(`File size: ${(htmlContent.length / 1024).toFixed(2)} KB`);

  // Create transaction
  const tx = await arweave.createTransaction({ data: htmlContent }, key);
  
  // Add tags for discoverability
  tx.addTag('Content-Type', 'text/html');
  tx.addTag('App-Name', 'VectorDream');
  tx.addTag('App-Version', '1.0.0');
  tx.addTag('Type', 'generative-art');
  
  // Get price
  const price = await arweave.ar.winstonToAr(tx.reward);
  console.log(`Upload cost: ${price} AR\n`);

  // Sign and submit
  await arweave.transactions.sign(tx, key);
  
  console.log('Submitting transaction...');
  const response = await arweave.transactions.post(tx);
  
  if (response.status === 200) {
    const arweaveUrl = `https://arweave.net/${tx.id}`;
    console.log('\n✅ Upload successful!\n');
    console.log('Transaction ID:', tx.id);
    console.log('Permanent URL:', arweaveUrl);
    console.log('\n⏳ Note: May take 5-10 minutes to be accessible');
    console.log('\n📝 Add this to your .env file:');
    console.log(`ARWEAVE_URL=${arweaveUrl}`);
    
    // Save URL to file for easy access
    fs.writeFileSync(
      path.join(__dirname, '..', '.arweave-url'),
      arweaveUrl
    );
  } else {
    console.error('❌ Upload failed:', response.status, response.statusText);
  }
}

main().catch(console.error);
