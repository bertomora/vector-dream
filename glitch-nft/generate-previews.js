const fs = require('fs');
const path = require('path');

// Seeds you want to use for your collection
const seeds = [76722, 58614, 42069, 1337, 2077, 8888, 9999, 420];

// Create metadata directory
if (!fs.existsSync('./metadata')) {
  fs.mkdirSync('./metadata');
}

// Create images directory
if (!fs.existsSync('./images')) {
  fs.mkdirSync('./images');
}

// Generate metadata files
seeds.forEach((seed, index) => {
  const tokenId = index + 1;
  
  const metadata = {
    name: `Vector Dream #${tokenId}`,
    description: `Generative cyber glitch art with real-time crypto market data influence. Each piece is永久 stored on Arweave. Seed: ${seed}`,
    image: `ar://IMAGE_HASH_${tokenId}.png`, // We'll replace this after upload
    animation_url: `https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=${seed}`,
    external_url: `https://vector-dream.vercel.app/?seed=${seed}`,
    attributes: [
      {
        trait_type: "Style",
        value: "Cyber Glitch"
      },
      {
        trait_type: "Seed",
        value: seed
      },
      {
        trait_type: "Network",
        value: "Base"
      },
      {
        trait_type: "Storage",
        value: "Arweave"
      }
    ]
  };
  
  fs.writeFileSync(
    `./metadata/${tokenId}.json`,
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`✅ Created metadata for token #${tokenId} (seed: ${seed})`);
});

console.log('\n📝 Metadata files created in ./metadata/');
console.log('🎨 Next: Capture preview images for each seed');
console.log('\n📋 Seeds to capture:');
seeds.forEach((seed, index) => {
  console.log(`   Token #${index + 1}: http://localhost:8080?seed=${seed}`);
});