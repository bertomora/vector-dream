const { ethers } = require('hardhat');

async function main() {
  const contract = await ethers.getContractAt(
    ['function tokenURI(uint256) view returns (string)', 'function totalSupply() view returns (uint256)', 'function tokenSeed(uint256) view returns (uint256)'],
    '0xbaE88927F84adc3a16aa3A41340631f5F285FA0A'
  );
  
  const supply = await contract.totalSupply();
  console.log('Total supply:', supply.toString());
  
  for (let i = 1; i <= supply; i++) {
    const uri = await contract.tokenURI(i);
    const seed = await contract.tokenSeed(i);
    console.log(`\nToken #${i} (seed: ${seed}):`);
    console.log('URI:', uri);
  }
}

main().catch(console.error);
