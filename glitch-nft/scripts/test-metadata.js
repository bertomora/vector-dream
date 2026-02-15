/**
 * Test metadata output locally before deploying
 */
const hre = require("hardhat");

async function main() {
  console.log("Testing VectorDream metadata...\n");

  // Deploy locally
  const VectorDream = await hre.ethers.getContractFactory("VectorDream");
  const contract = await VectorDream.deploy(hre.ethers.parseEther("0.002"));
  await contract.waitForDeployment();

  // Mint a test token
  const [signer] = await hre.ethers.getSigners();
  await contract.mint(1744, { value: hre.ethers.parseEther("0.002") });

  // Get tokenURI
  const uri = await contract.tokenURI(1);
  console.log("Raw URI length:", uri.length);
  console.log("URI prefix:", uri.slice(0, 50));

  // Decode and validate JSON
  const base64 = uri.replace("data:application/json;base64,", "");
  const json = Buffer.from(base64, "base64").toString();
  
  console.log("\n--- Decoded JSON ---");
  console.log(json);
  
  // Validate it's proper JSON
  try {
    const parsed = JSON.parse(json);
    console.log("\n✅ Valid JSON!");
    console.log("\nParsed fields:");
    console.log("  name:", parsed.name);
    console.log("  description:", parsed.description?.slice(0, 50) + "...");
    console.log("  image:", parsed.image);
    console.log("  animation_url:", parsed.animation_url);
    console.log("  attributes:", parsed.attributes?.length, "traits");
    
    for (const attr of parsed.attributes || []) {
      console.log(`    - ${attr.trait_type}: ${attr.value}`);
    }
  } catch (e) {
    console.log("\n❌ Invalid JSON:", e.message);
  }
}

main().catch(console.error);
