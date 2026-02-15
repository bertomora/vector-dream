const hre = require('hardhat');

const CONTRACT = '0xE87Cfb82f780d3cCe3571245AFE9156BbB825C71';

async function main() {
  const contract = await hre.ethers.getContractAt('VectorDreamDynamic', CONTRACT);
  
  const supply = await contract.totalSupply();
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
  }
}

main().catch(console.error);
