/**
 * Set token metadata URI on VectorDreamArweave contract
 * Usage: node scripts/set-metadata.js <tokenId> <arweaveUrl>
 */

const hre = require("hardhat");

const CONTRACT = "0x8F4772124C550483649DD55c86D3045888e56FCE";

async function main() {
  const tokenId = process.argv[2];
  const arweaveUrl = process.argv[3];
  
  if (!tokenId || !arweaveUrl) {
    console.log("Usage: node scripts/set-metadata.js <tokenId> <arweaveUrl>");
    console.log("Example: node scripts/set-metadata.js 1 https://arweave.net/xxx");
    process.exit(1);
  }

  console.log(`\nSetting metadata for token #${tokenId}...`);
  console.log(`URI: ${arweaveUrl}\n`);

  const contract = await hre.ethers.getContractAt("VectorDreamArweave", CONTRACT);
  
  const tx = await contract.setTokenMetadataURI(tokenId, arweaveUrl);
  console.log("Transaction:", tx.hash);
  
  await tx.wait();
  console.log("✅ Metadata set!\n");
  
  // Verify
  const uri = await contract.tokenURI(tokenId);
  console.log("Verified tokenURI:", uri);
}

main().catch(console.error);
