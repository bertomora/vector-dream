const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Deploying VectorDreamFix (EXACT working pattern)...\n");

  const mintPrice = hre.ethers.parseEther("0.002");
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const Contract = await hre.ethers.getContractFactory("VectorDreamFix");
  const contract = await Contract.deploy(mintPrice);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ Deployed:", address);

  fs.writeFileSync(
    path.join(__dirname, "..", ".deployment.json"),
    JSON.stringify({ address, mintPrice: mintPrice.toString(), deployer: deployer.address, timestamp: new Date().toISOString() }, null, 2)
  );

  if (hre.network.name !== "hardhat") {
    console.log("⏳ Waiting for confirmations...");
    await contract.deploymentTransaction().wait(5);
    
    try {
      await hre.run("verify:verify", { address, constructorArguments: [mintPrice] });
      console.log("✅ Verified!");
    } catch (e) {
      console.log("⚠️", e.message);
    }
  }

  console.log("\n🔗 Links:");
  console.log("BaseScan:", `https://basescan.org/address/${address}`);
  console.log("OpenSea:", `https://opensea.io/assets/base/${address}`);
}

main().catch(console.error);
