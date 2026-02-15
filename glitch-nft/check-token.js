const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.getContractAt(
    "VectorDream", 
    "0x8ee36ae1c2528de80b27628a75e4f3fe44280da2"
  );
  
  const uri = await contract.tokenURI(1);
  console.log("Token URI:", uri);
  
  const owner = await contract.ownerOf(1);
  console.log("Owner:", owner);
}

main().catch(console.error);