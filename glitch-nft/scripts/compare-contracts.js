const hre = require('hardhat');

async function main() {
  // Working contract
  console.log('=== WORKING CONTRACT (0x8f66...) ===');
  const working = await hre.ethers.getContractAt('VectorDreamDynamic', '0x8f66b06d02d857c3b7739aa9318beeea54bba03b');
  const workingUri = await working.tokenURI(1);
  console.log('TokenURI type:', workingUri.startsWith('data:') ? 'ON-CHAIN (data:)' : 'EXTERNAL URL');
  
  if (workingUri.startsWith('data:application/json;base64,')) {
    const json = Buffer.from(workingUri.replace('data:application/json;base64,', ''), 'base64').toString();
    const meta = JSON.parse(json);
    console.log('Image URL:', meta.image);
    console.log('Animation URL:', meta.animation_url);
  } else {
    console.log('URI:', workingUri);
  }

  console.log('\n=== NEW CONTRACT (0xbaE8...) ===');
  const newContract = await hre.ethers.getContractAt('VectorDreamDynamic', '0xbaE88927F84adc3a16aa3A41340631f5F285FA0A');
  const newUri = await newContract.tokenURI(1);
  console.log('TokenURI type:', newUri.startsWith('data:') ? 'ON-CHAIN (data:)' : 'EXTERNAL URL');
  console.log('URI:', newUri);
  
  // Fetch the external metadata
  const resp = await fetch(newUri);
  const meta = await resp.json();
  console.log('Image URL:', meta.image);
  console.log('Animation URL:', meta.animation_url);
}

main().catch(console.error);
