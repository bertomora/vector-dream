/**
 * Deploy VectorDreamV3 contract to Base
 * Features: On-chain metadata, external image API for thumbnails, animation_url for WebGL
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying VectorDreamV3 to ${network}...\n`);

  const mintPrice = hre.ethers.parseEther("0.002");

  console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "ETH");
  console.log("Max Supply: 100 (hardcoded)");
  console.log("Metadata: On-chain JSON");
  console.log("Thumbnail: External API (/api/image?seed=)");
  console.log("Animation: Live WebGL\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy
  const VectorDream = await hre.ethers.getContractFactory("VectorDreamV3");
  const contract = await VectorDream.deploy(mintPrice);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ VectorDreamV3 deployed!");
  console.log("Contract:", address);

  // Save deployment info
  const deploymentInfo = {
    network,
    address,
    mintPrice: mintPrice.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    version: "V3"
  };
  
  fs.writeFileSync(
    path.join(__dirname, "..", ".deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Wait for confirmations
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n⏳ Waiting for confirmations...");
    await contract.deploymentTransaction().wait(5);
    
    console.log("\n📋 Verifying on BaseScan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [mintPrice],
      });
      console.log("✅ Verified!");
    } catch (e) {
      console.log("⚠️ Verification:", e.message);
    }
  }

  console.log("\n🔗 Links:");
  console.log(`BaseScan: https://basescan.org/address/${address}`);
  console.log(`OpenSea: https://opensea.io/assets/base/${address}`);
  console.log("\n🎉 Done!");
}

main().catch(console.error);
