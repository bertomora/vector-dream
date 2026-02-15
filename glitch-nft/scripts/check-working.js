const { ethers } = require("hardhat");

async function main() {
  // The working contract that shows thumbnails
  const workingContract = "0x8f66b06d02d857c3b7739aa9318beeea54bba03b";
  
  const abi = ["function tokenURI(uint256) view returns (string)"];
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const contract = new ethers.Contract(workingContract, abi, provider);
  
  try {
    const uri = await contract.tokenURI(1);
    console.log("Working contract tokenURI:");
    console.log(uri.substring(0, 200) + "...\n");
    
    if (uri.startsWith("data:application/json;base64,")) {
      const json = Buffer.from(uri.split(",")[1], "base64").toString();
      console.log("Decoded JSON:");
      console.log(JSON.stringify(JSON.parse(json), null, 2));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
