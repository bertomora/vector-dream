const hre = require('hardhat');

async function main() {
  // WORKING contract
  console.log('=== WORKING (0x8f66...) ===');
  const working = await hre.ethers.getContractAt('VectorDreamV3', '0x8f66b06d02d857c3b7739aa9318beeea54bba03b');
  const w = await working.tokenURI(1);
  const wJson = JSON.parse(Buffer.from(w.replace('data:application/json;base64,', ''), 'base64').toString());
  console.log('Name:', wJson.name);
  console.log('Image:', wJson.image);
  console.log('Animation:', wJson.animation_url);
  console.log('Attributes:', wJson.attributes?.length || 0, 'traits');

  // V3 contract (should also work?)
  console.log('\n=== V3 (0x7CFA...) ===');
  try {
    const v3 = await hre.ethers.getContractAt('VectorDreamV3', '0x7CFA602fE5F944aEd324d9d48767Ed16c09A6171');
    const supply = await v3.totalSupply();
    console.log('Supply:', supply.toString());
    if (supply > 0) {
      const v = await v3.tokenURI(1);
      const vJson = JSON.parse(Buffer.from(v.replace('data:application/json;base64,', ''), 'base64').toString());
      console.log('Name:', vJson.name);
      console.log('Image:', vJson.image);
      console.log('Animation:', vJson.animation_url);
      console.log('Attributes:', vJson.attributes?.length || 0, 'traits');
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
}

main().catch(console.error);
