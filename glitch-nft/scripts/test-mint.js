/**
 * Test mint an NFT on testnet
 */
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = "0xadd3925d305c82cdC04601F106207B8aE8D7aC17";
  
  console.log("\n🎨 Test Minting Vector Dream NFT...\n");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Minter:", signer.address);
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");
  
  // Get contract
  const VectorDream = await hre.ethers.getContractFactory("VectorDream");
  const contract = VectorDream.attach(contractAddress);
  
  // Get mint price
  const mintPrice = await contract.mintPrice();
  console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "ETH");
  
  // Pick a seed
  const seed = 42069;
  console.log("Seed:", seed);
  
  // Check if available
  const available = await contract.isSeedAvailable(seed);
  if (!available) {
    console.log("❌ Seed already taken!");
    return;
  }
  console.log("✅ Seed available!\n");
  
  // Mint
  console.log("Minting...");
  const tx = await contract.mint(seed, { value: mintPrice });
  console.log("TX:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Minted!\n");
  
  // Get token info
  const totalSupply = await contract.totalSupply();
  console.log("Token ID:", totalSupply.toString());
  
  // Get token URI
  const tokenURI = await contract.tokenURI(totalSupply);
  console.log("\nToken URI (base64 JSON):");
  
  // Decode and display
  const json = Buffer.from(tokenURI.split(",")[1], "base64").toString();
  const metadata = JSON.parse(json);
  console.log("\nMetadata:");
  console.log("  Name:", metadata.name);
  console.log("  Animation URL:", metadata.animation_url);
  console.log("  Attributes:", metadata.attributes);
  
  console.log("\n🎉 Test mint successful!");
  console.log("\nView on OpenSea Testnet:");
  console.log(`https://testnets.opensea.io/assets/base-sepolia/${contractAddress}/${totalSupply}`);
}

main().catch(console.error);
