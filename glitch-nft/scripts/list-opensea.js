/**
 * List a VectorDream NFT on OpenSea using Seaport
 * 
 * Usage:
 *   node scripts/list-opensea.js <tokenId> <priceInEth>
 *   node scripts/list-opensea.js 1 0.1     # List token #1 for 0.1 ETH
 */

const { Seaport } = require("@opensea/seaport-js");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const tokenId = process.argv[2];
  const priceEth = process.argv[3];

  if (!tokenId || !priceEth) {
    console.log('Usage: node scripts/list-opensea.js <tokenId> <priceInEth>');
    console.log('Example: node scripts/list-opensea.js 1 0.1');
    process.exit(1);
  }

  // Load deployment info
  const deploymentPath = path.join(__dirname, '..', '.deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    console.log('❌ No deployment found. Run deploy script first.');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));
  console.log(`\n🌊 Listing on OpenSea (${deployment.network})...\n`);

  // Setup provider and signer
  const rpcUrl = deployment.network === 'mainnet' 
    ? process.env.MAINNET_RPC_URL 
    : process.env.SEPOLIA_RPC_URL;
    
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log('Seller:', signer.address);
  console.log('Contract:', deployment.address);
  console.log('Token ID:', tokenId);
  console.log('Price:', priceEth, 'ETH\n');

  // Initialize Seaport
  const seaport = new Seaport(signer);

  // Check ownership
  const VectorDream = new ethers.Contract(
    deployment.address,
    ['function ownerOf(uint256) view returns (address)'],
    provider
  );
  
  const owner = await VectorDream.ownerOf(tokenId);
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log('❌ You do not own this token');
    console.log('Owner:', owner);
    process.exit(1);
  }

  // Create listing order
  const priceWei = ethers.parseEther(priceEth);
  
  console.log('Creating Seaport order...');
  
  const { executeAllActions } = await seaport.createOrder({
    offer: [
      {
        itemType: 2, // ERC721
        token: deployment.address,
        identifier: tokenId,
      },
    ],
    consideration: [
      {
        amount: priceWei.toString(),
        recipient: signer.address,
      },
    ],
    // 2.5% OpenSea fee
    fees: [
      {
        recipient: "0x0000a26b00c1F0DF003000390027140000fAa719", // OpenSea fee recipient
        basisPoints: 250,
      },
    ],
    endTime: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  });

  console.log('Signing order...');
  const order = await executeAllActions();

  console.log('\n✅ Order created!\n');
  console.log('Order hash:', order.orderHash || 'pending');
  
  // The order needs to be submitted to OpenSea's API for it to appear
  // This is done automatically when you list through their UI
  // For programmatic listing, you'd POST to their API
  
  console.log('\n📝 To complete the listing:');
  console.log('1. Go to OpenSea and connect your wallet');
  console.log('2. Navigate to the NFT');
  console.log('3. Click "List for sale" and complete the listing');
  console.log('');
  console.log('Or use the OpenSea API to submit this order programmatically.');
  console.log('API docs: https://docs.opensea.io/reference/create-listing');

  // For full programmatic listing, you'd need OpenSea API key and POST the order
  if (process.env.OPENSEA_API_KEY) {
    console.log('\n🚀 Submitting to OpenSea API...');
    
    const apiUrl = deployment.network === 'mainnet'
      ? 'https://api.opensea.io/v2/orders/ethereum/seaport/listings'
      : 'https://testnets-api.opensea.io/v2/orders/sepolia/seaport/listings';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.OPENSEA_API_KEY,
        },
        body: JSON.stringify({
          parameters: order.parameters,
          signature: order.signature,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Listed on OpenSea!');
        console.log('Listing:', result);
        
        const openseaUrl = deployment.network === 'mainnet'
          ? `https://opensea.io/assets/ethereum/${deployment.address}/${tokenId}`
          : `https://testnets.opensea.io/assets/sepolia/${deployment.address}/${tokenId}`;
        console.log(`\n🌊 View: ${openseaUrl}`);
      } else {
        const error = await response.text();
        console.log('⚠️ API submission failed:', error);
        console.log('You can still list manually on OpenSea');
      }
    } catch (e) {
      console.log('⚠️ API error:', e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
