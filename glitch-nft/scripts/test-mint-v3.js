const hre = require('hardhat');

const CONTRACT = '0x7CFA602fE5F944aEd324d9d48767Ed16c09A6171';

async function main() {
  const contract = await hre.ethers.getContractAt('VectorDreamV3', CONTRACT);
  
  console.log('Minting random...');
  const tx = await contract.mintRandom({ value: hre.ethers.parseEther('0.002') });
  const receipt = await tx.wait();
  console.log('Minted! Tx:', receipt.hash);
  
  const supply = await contract.totalSupply();
  const seed = await contract.tokenSeed(supply);
  console.log('Token #' + supply + ', Seed:', seed.toString());
  
  const uri = await contract.tokenURI(supply);
  
  // Decode base64 JSON to check
  const json = Buffer.from(uri.replace('data:application/json;base64,', ''), 'base64').toString();
  const metadata = JSON.parse(json);
  console.log('\n✅ Metadata:');
  console.log('Name:', metadata.name);
  console.log('Image:', metadata.image);
  console.log('Animation:', metadata.animation_url);
  console.log('Traits:', metadata.attributes.map(a => `${a.trait_type}: ${a.value}`).join(', '));
}

main().catch(console.error);
