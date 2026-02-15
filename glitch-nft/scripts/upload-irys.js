/**
 * Upload art to Arweave via Irys (pay with ETH)
 * 
 * This lets you pay for permanent storage using ETH from your wallet.
 * Cost: ~$0.01-0.05 for the HTML file
 */

const Irys = require("@irys/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("\n🎨 VECTOR DREAM - Upload to Arweave\n");
  console.log("=====================================\n");

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log("❌ No PRIVATE_KEY found in .env");
    console.log("\nAdd your wallet private key to .env:");
    console.log("PRIVATE_KEY=0x...\n");
    process.exit(1);
  }

  // Initialize Irys (using Base for payment)
  console.log("Connecting to Irys...");
  
  const irys = new Irys({
    network: "mainnet", // Use "devnet" for testing
    token: "base-eth",  // Pay with Base ETH
    key: privateKey,
    config: {
      providerUrl: "https://mainnet.base.org"
    }
  });

  // Check balance
  const balance = await irys.getLoadedBalance();
  console.log(`Irys Balance: ${irys.utils.fromAtomic(balance)} ETH`);

  // Read the HTML file
  const htmlPath = path.join(__dirname, "..", "index.html");
  
  if (!fs.existsSync(htmlPath)) {
    console.log("\n❌ index.html not found!");
    console.log("Make sure your generative art HTML is at: glitch-nft/index.html");
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath);
  const fileSize = htmlContent.length;
  
  console.log(`\nFile: index.html`);
  console.log(`Size: ${(fileSize / 1024).toFixed(2)} KB`);

  // Get upload price
  const price = await irys.getPrice(fileSize);
  const priceInEth = irys.utils.fromAtomic(price);
  console.log(`Cost: ${priceInEth} ETH (~$${(parseFloat(priceInEth) * 3000).toFixed(4)})`);

  // Check if we need to fund
  if (balance.lt(price)) {
    const needed = price.minus(balance);
    console.log(`\n💰 Funding Irys with ${irys.utils.fromAtomic(needed)} ETH...`);
    
    try {
      await irys.fund(needed);
      console.log("✅ Funded!");
    } catch (e) {
      console.log("\n❌ Funding failed:", e.message);
      console.log("\nMake sure you have enough ETH on Base for:");
      console.log(`  - Upload cost: ${priceInEth} ETH`);
      console.log("  - Gas fees: ~0.0001 ETH");
      process.exit(1);
    }
  }

  // Upload
  console.log("\n📤 Uploading to Arweave...");
  
  const tags = [
    { name: "Content-Type", value: "text/html" },
    { name: "App-Name", value: "VectorDream" },
    { name: "App-Version", value: "1.0.0" },
    { name: "Type", value: "generative-art" },
    { name: "Network", value: "Base" },
  ];

  try {
    const receipt = await irys.uploadFile(htmlPath, { tags });
    
    const arweaveUrl = `https://arweave.net/${receipt.id}`;
    
    console.log("\n✅ SUCCESS!\n");
    console.log("=====================================");
    console.log(`Transaction ID: ${receipt.id}`);
    console.log(`Permanent URL:  ${arweaveUrl}`);
    console.log("=====================================\n");
    
    // Save URL
    fs.writeFileSync(
      path.join(__dirname, "..", ".arweave-url"),
      arweaveUrl
    );
    
    // Update .env
    const envPath = path.join(__dirname, "..", ".env");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    if (envContent.includes("ARWEAVE_URL=")) {
      envContent = envContent.replace(/ARWEAVE_URL=.*/, `ARWEAVE_URL=${arweaveUrl}`);
    } else {
      envContent += `\nARWEAVE_URL=${arweaveUrl}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log("📝 Saved to .env as ARWEAVE_URL");
    console.log("\n🚀 Next step: Deploy contract");
    console.log("   npm run deploy:base\n");
    
    console.log("⏳ Note: URL may take 5-10 minutes to be accessible");
    console.log(`   Test it: ${arweaveUrl}?seed=12345\n`);

  } catch (e) {
    console.log("\n❌ Upload failed:", e.message);
    process.exit(1);
  }
}

main().catch(console.error);
