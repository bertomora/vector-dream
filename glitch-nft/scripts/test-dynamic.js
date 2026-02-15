const hre = require('hardhat');

const CONTRACT = '0xE87Cfb82f780d3cCe3571245AFE9156BbB825C71';

async function main() {
  const contract = await hre.ethers.getContractAt('VectorDreamDynamic', CONTRACT);
  
  console.log('Minting random on Dynamic contract...');
  const tx = await contract.mintRandom({ value: hre.ethers.parseEther('0.002') });
  const receipt = await tx.wait();
  console.log('Minted! Tx:', receipt.hash);
  
  const supply = await contract.totalSupply();
  const seed = await contract.tokenSeed(supply);
  console.log('Token #' + supply + ', Seed:', seed.toString());
  
  const uri = await contract.tokenURI(supply);
  console.log('\n✅ TokenURI (external):');
  console.log(uri);
  
  // Fetch the dynamic metadata
  console.log('\n📡 Fetching dynamic metadata...');
  const resp = await fetch(uri);
  const metadata = await resp.json();
  console.log(JSON.stringify(metadata, null, 2));
}

main().catch(console.error);
