/**
 * Mint a VectorDream NFT
 * 
 * Usage:
 *   node scripts/mint.js [seed]
 *   node scripts/mint.js          # random seed
 *   node scripts/mint.js 42       # specific seed
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  // Load deployment info
  const deploymentPath = path.join(__dirname, '..', '.deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    console.log('❌ No deployment found. Run deploy script first.');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));
  console.log(`\n🎨 Minting on ${deployment.network}...\n`);
  console.log('Contract:', deployment.address);

  // Get contract
  const VectorDream = await hre.ethers.getContractFactory("VectorDream");
  const contract = VectorDream.attach(deployment.address);

  // Get minter
  const [minter] = await hre.ethers.getSigners();
  console.log('Minter:', minter.address);
  
  const balance = await hre.ethers.provider.getBalance(minter.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH');

  // Get mint price
  const mintPrice = await contract.mintPrice();
  console.log('Mint Price:', hre.ethers.formatEther(mintPrice), 'ETH\n');

  // Get seed from command line or use random
  const seedArg = process.argv[2];
  
  let tx;
  if (seedArg) {
    const seed = parseInt(seedArg);
    console.log(`Minting with seed: ${seed}`);
    
    // Check if seed is available
    const available = await contract.isSeedAvailable(seed);
    if (!available) {
      console.log('❌ Seed is not available (already minted or invalid)');
      process.exit(1);
    }
    
    tx = await contract.mint(seed, { value: mintPrice });
  } else {
    console.log('Minting with random seed...');
    tx = await contract.mintRandom({ value: mintPrice });
  }

  console.log('Transaction:', tx.hash);
  console.log('Waiting for confirmation...\n');
  
  const receipt = await tx.wait();
  
  // Find the mint event
  const event = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed.name === 'ArtMinted';
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = contract.interface.parseLog(event);
    const tokenId = parsed.args.tokenId.toString();
    const seed = parsed.args.seed.toString();
    
    console.log('✅ Minted successfully!\n');
    console.log('Token ID:', tokenId);
    console.log('Seed:', seed);
    console.log('');
    
    // Get tokenURI
    const uri = await contract.tokenURI(tokenId);
    console.log('Metadata URI:', uri.slice(0, 100) + '...');
    
    // OpenSea link
    if (deployment.network === 'mainnet') {
      console.log(`\n🌊 OpenSea: https://opensea.io/assets/ethereum/${deployment.address}/${tokenId}`);
    } else if (deployment.network === 'sepolia') {
      console.log(`\n🌊 OpenSea: https://testnets.opensea.io/assets/sepolia/${deployment.address}/${tokenId}`);
    }
    
    // Save mint info
    const mintsPath = path.join(__dirname, '..', '.mints.json');
    let mints = [];
    if (fs.existsSync(mintsPath)) {
      mints = JSON.parse(fs.readFileSync(mintsPath));
    }
    mints.push({
      tokenId,
      seed,
      minter: minter.address,
      txHash: tx.hash,
      timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(mintsPath, JSON.stringify(mints, null, 2));
    
    console.log('\n💾 Mint recorded in .mints.json');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
