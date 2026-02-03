/**
 * Deploy VectorDream contract to Ethereum
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying VectorDream to ${network}...\n`);

  // Get Arweave URL
  let arweaveUrl = process.env.ARWEAVE_URL;
  
  // Try to read from file if not in env
  if (!arweaveUrl) {
    const urlFile = path.join(__dirname, '..', '.arweave-url');
    if (fs.existsSync(urlFile)) {
      arweaveUrl = fs.readFileSync(urlFile, 'utf8').trim();
    }
  }

  if (!arweaveUrl) {
    console.log('⚠️  No ARWEAVE_URL found!');
    console.log('Run `npm run upload:arweave` first, or set ARWEAVE_URL in .env');
    process.exit(1);
  }

  console.log('Arweave URL:', arweaveUrl);

  // Deploy parameters
  const maxSupply = 10000;  // Max 10,000 pieces
  const mintPrice = hre.ethers.parseEther("0.05");  // 0.05 ETH mint price

  console.log('Max Supply:', maxSupply);
  console.log('Mint Price:', hre.ethers.formatEther(mintPrice), 'ETH\n');

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH\n');

  // Deploy
  const VectorDream = await hre.ethers.getContractFactory("VectorDream");
  const contract = await VectorDream.deploy(arweaveUrl, maxSupply, mintPrice);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n✅ VectorDream deployed!\n');
  console.log('Contract Address:', address);
  console.log('');
  console.log('📝 Save this info:');
  console.log(`CONTRACT_ADDRESS=${address}`);
  
  // Save deployment info
  const deploymentInfo = {
    network,
    address,
    arweaveUrl,
    maxSupply,
    mintPrice: mintPrice.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', '.deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Verify on Etherscan (if not local)
  if (network !== 'hardhat' && network !== 'localhost') {
    console.log('\n⏳ Waiting for block confirmations...');
    await contract.deploymentTransaction().wait(5);
    
    console.log('📋 Verifying on Etherscan...');
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [arweaveUrl, maxSupply, mintPrice],
      });
      console.log('✅ Verified on Etherscan!');
    } catch (e) {
      console.log('⚠️  Verification failed:', e.message);
    }
  }

  // OpenSea links
  console.log('\n🌊 OpenSea Links:');
  if (network === 'mainnet') {
    console.log(`Collection: https://opensea.io/collection/vector-dream`);
    console.log(`Contract: https://opensea.io/assets/ethereum/${address}`);
  } else if (network === 'sepolia') {
    console.log(`Testnet: https://testnets.opensea.io/assets/sepolia/${address}`);
  }
  
  console.log('\n🎉 Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
