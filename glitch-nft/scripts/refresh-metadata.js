const { ethers } = require('hardhat');

async function main() {
  const contract = await ethers.getContractAt(
    ['function refreshAllMetadata() external', 'function totalSupply() view returns (uint256)'],
    '0xbaE88927F84adc3a16aa3A41340631f5F285FA0A'
  );

  const supply = await contract.totalSupply();
  console.log(`Refreshing metadata for ${supply} tokens...`);
  
  const tx = await contract.refreshAllMetadata();
  console.log('TX sent:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('✅ Metadata refresh events emitted!');
  console.log('Block:', receipt.blockNumber);
}

main().catch(console.error);
