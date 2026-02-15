/**
 * Upload JSON metadata to Arweave via Irys
 */

const Irys = require("@irys/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const seed = process.argv[2];
  if (!seed) {
    console.log("Usage: node scripts/upload-json-irys.js <seed>");
    process.exit(1);
  }

  const jsonPath = path.join(__dirname, "..", "metadata", `${seed}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.log(`JSON not found: ${jsonPath}`);
    process.exit(1);
  }

  console.log(`📤 Uploading ${seed}.json to Arweave via Irys...\n`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log("❌ No PRIVATE_KEY found in .env");
    process.exit(1);
  }

  console.log("Connecting to Irys...");
  
  const irys = new Irys({
    network: "mainnet",
    token: "base-eth",
    key: privateKey,
    config: {
      providerUrl: "https://mainnet.base.org",
    },
  });

  const balance = await irys.getLoadedBalance();
  console.log(`Irys Balance: ${irys.utils.fromAtomic(balance)} ETH`);

  const jsonData = fs.readFileSync(jsonPath);
  const price = await irys.getPrice(jsonData.length);
  console.log(`\nFile: ${seed}.json`);
  console.log(`Size: ${(jsonData.length / 1024).toFixed(2)} KB`);
  console.log(`Cost: ${irys.utils.fromAtomic(price)} ETH`);

  console.log("\n📤 Uploading...\n");

  const receipt = await irys.upload(jsonData, {
    tags: [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "VectorDream" },
      { name: "Type", value: "nft-metadata" },
      { name: "Seed", value: seed },
    ],
  });

  const arweaveUrl = `https://arweave.net/${receipt.id}`;
  
  console.log("✅ SUCCESS!\n");
  console.log("=====================================");
  console.log("Transaction ID:", receipt.id);
  console.log("Metadata URL: ", arweaveUrl);
  console.log("=====================================\n");

  // Save to mapping
  const mappingPath = path.join(__dirname, "..", ".arweave-metadata.json");
  let mapping = {};
  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(fs.readFileSync(mappingPath));
  }
  mapping[seed] = arweaveUrl;
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log("Saved to .arweave-metadata.json");
}

main().catch(console.error);
