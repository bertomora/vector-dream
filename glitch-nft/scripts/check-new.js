const hre = require('hardhat');

const CONTRACT = '0xbaE88927F84adc3a16aa3A41340631f5F285FA0A';

async function main() {
  const contract = await hre.ethers.getContractAt('VectorDreamDynamic', CONTRACT);
  
  const supply = await contract.totalSupply();
  console.log('Contract:', CONTRACT);
  console.log('Total Supply:', supply.toString());
  
  if (supply > 0n) {
    const seed = await contract.tokenSeed(1);
    console.log('Token #1 Seed:', seed.toString());
    
    const uri = await contract.tokenURI(1);
    console.log('\nTokenURI:', uri);
    
    // Fetch
    console.log('\n📡 Fetching dynamic metadata...');
    const resp = await fetch(uri);
    const metadata = await resp.json();
    console.log(JSON.stringify(metadata, null, 2));
    
    // Check image URL
    console.log('\n🖼️ Image URL:', metadata.image);
  } else {
    console.log('No tokens minted yet');
  }
}

main().catch(console.error);
