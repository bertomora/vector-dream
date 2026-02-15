/**
 * Update mint price on deployed contract
 */
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = "0xca0754E2cff6D0d77f82cE9b9265e53F03c51b9B";
  
  // ~$5 at current ETH prices (~$3000/ETH)
  const newPrice = hre.ethers.parseEther("0.002"); // 0.002 ETH ≈ $5-6
  
  console.log("\n💰 Updating mint price...\n");
  console.log("Contract:", contractAddress);
  console.log("New Price:", hre.ethers.formatEther(newPrice), "ETH (~$5)\n");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Owner:", signer.address);
  
  const VectorDream = await hre.ethers.getContractFactory("VectorDream");
  const contract = VectorDream.attach(contractAddress);
  
  // Check current price
  const currentPrice = await contract.mintPrice();
  console.log("Current Price:", hre.ethers.formatEther(currentPrice), "ETH");
  
  // Update price
  console.log("\nSending transaction...");
  const tx = await contract.setMintPrice(newPrice);
  console.log("TX:", tx.hash);
  
  await tx.wait();
  
  // Verify
  const updatedPrice = await contract.mintPrice();
  console.log("\n✅ Price updated!");
  console.log("New Price:", hre.ethers.formatEther(updatedPrice), "ETH");
}

main().catch(console.error);
