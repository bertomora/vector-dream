const hre = require('hardhat');

const CONTRACT = '0x7CFA602fE5F944aEd324d9d48767Ed16c09A6171';

async function main() {
  const contract = await hre.ethers.getContractAt('VectorDreamV3', CONTRACT);
  
  const supply = await contract.totalSupply();
  console.log('Total Supply:', supply.toString());
  
  if (supply > 0n) {
    const seed = await contract.tokenSeed(1);
    console.log('Token #1 Seed:', seed.toString());
    
    const uri = await contract.tokenURI(1);
    const json = Buffer.from(uri.replace('data:application/json;base64,', ''), 'base64').toString();
    const metadata = JSON.parse(json);
    
    console.log('\n✅ Metadata:');
    console.log(JSON.stringify(metadata, null, 2));
  }
}

main().catch(console.error);
