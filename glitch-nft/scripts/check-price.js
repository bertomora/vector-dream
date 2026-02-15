const hre = require("hardhat");
async function main() {
  const contract = (await hre.ethers.getContractFactory("VectorDream")).attach("0xca0754E2cff6D0d77f82cE9b9265e53F03c51b9B");
  const price = await contract.mintPrice();
  console.log("Current Price:", hre.ethers.formatEther(price), "ETH");
}
main();
