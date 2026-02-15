const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.getContractAt(
    "VectorDream", 
    "0x8f66B06D02d857c3B7739aa9318BEeea54bBa03b"
  );
  
  const totalSupply = await contract.totalSupply();
  console.log("Total minted:", totalSupply.toString());
  
  for (let i = 1; i <= totalSupply; i++) {
    const seed = await contract.tokenSeed(i);
    console.log(`Token #${i} seed:`, seed.toString());
  }
}

main().catch(console.error);
