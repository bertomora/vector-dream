/**
 * Upload PNG image to Arweave via Irys (pay with Base ETH)
 * Usage: node scripts/upload-image-irys.js <seed>
 */

const Irys = require("@irys/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const seed = process.argv[2];
  if (!seed) {
    console.log('Usage: node scripts/upload-image-irys.js <seed>');
    process.exit(1);
  }

  const imagePath = path.join(__dirname, '..', 'images', `${seed}.png`);
  if (!fs.existsSync(imagePath)) {
    console.log(`Image not found: ${imagePath}`);
    console.log('Run: node scripts/render-art.js', seed);
    process.exit(1);
  }

  console.log(`\n📤 Uploading ${seed}.png to Arweave via Irys...\n`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log("❌ No PRIVATE_KEY found in .env");
    process.exit(1);
  }

  // Initialize Irys
  console.log("Connecting to Irys...");
  
  const irys = new Irys({
    network: "mainnet",
    token: "base-eth",
    key: privateKey,
    config: {
      providerUrl: "https://mainnet.base.org"
    }
  });

  // Check balance
  const balance = await irys.getLoadedBalance();
  console.log(`Irys Balance: ${irys.utils.fromAtomic(balance)} ETH`);

  // Get file size and price
  const imageData = fs.readFileSync(imagePath);
  const fileSize = imageData.length;
  
  console.log(`\nFile: ${seed}.png`);
  console.log(`Size: ${(fileSize / 1024).toFixed(2)} KB`);

  const price = await irys.getPrice(fileSize);
  const priceInEth = irys.utils.fromAtomic(price);
  console.log(`Cost: ${priceInEth} ETH`);

  // Fund if needed (add 50% buffer)
  const priceWithBuffer = price.multipliedBy(1.5).integerValue();
  if (balance.lt(priceWithBuffer)) {
    const needed = priceWithBuffer.minus(balance).integerValue();
    console.log(`\n💰 Funding Irys with ${irys.utils.fromAtomic(needed)} ETH...`);
    
    try {
      await irys.fund(needed);
      console.log("✅ Funded!");
      // Wait for funding to propagate
      console.log("⏳ Waiting for funding to propagate...");
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.log("\n❌ Funding failed:", e.message);
      process.exit(1);
    }
  }

  // Upload
  console.log("\n📤 Uploading...");
  
  const tags = [
    { name: "Content-Type", value: "image/png" },
    { name: "App-Name", value: "VectorDream" },
    { name: "Type", value: "nft-image" },
    { name: "Seed", value: seed },
  ];

  try {
    const receipt = await irys.uploadFile(imagePath, { tags });
    
    const arweaveUrl = `https://arweave.net/${receipt.id}`;
    
    console.log("\n✅ SUCCESS!\n");
    console.log("=====================================");
    console.log(`Transaction ID: ${receipt.id}`);
    console.log(`Permanent URL:  ${arweaveUrl}`);
    console.log("=====================================\n");
    
    // Save to mapping file
    const mappingPath = path.join(__dirname, '..', '.arweave-images.json');
    let mapping = {};
    if (fs.existsSync(mappingPath)) {
      mapping = JSON.parse(fs.readFileSync(mappingPath));
    }
    mapping[seed] = arweaveUrl;
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`Saved to .arweave-images.json`);
    console.log(`\n⏳ May take 5-10 minutes to be accessible`);

  } catch (e) {
    console.log("\n❌ Upload failed:", e.message);
    process.exit(1);
  }
}

main().catch(console.error);
