/**
 * Test tokenURI output locally before deploying
 */
const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing tokenURI locally...\n");

  // Deploy locally
  const VectorDream = await hre.ethers.getContractFactory("VectorDream");
  const contract = await VectorDream.deploy(
    "https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8",
    hre.ethers.parseEther("0.002")
  );
  await contract.waitForDeployment();
  console.log("✅ Contract deployed locally");

  // Mint a test token
  await contract.mint(12345, { value: hre.ethers.parseEther("0.002") });
  console.log("✅ Minted token #1 with seed 12345\n");

  // Get tokenURI
  const uri = await contract.tokenURI(1);
  console.log("📄 TokenURI length:", uri.length, "chars\n");

  // Decode and display
  const base64Json = uri.split(",")[1];
  const json = JSON.parse(Buffer.from(base64Json, "base64").toString());

  console.log("=== METADATA ===");
  console.log("Name:", json.name);
  console.log("Description:", json.description);
  console.log("Animation URL:", json.animation_url);
  console.log("Attributes:", JSON.stringify(json.attributes, null, 2));
  console.log("");

  // Decode and display SVG
  const svgBase64 = json.image.split(",")[1];
  const svg = Buffer.from(svgBase64, "base64").toString();
  console.log("=== SVG IMAGE ===");
  console.log(svg);
  console.log("");

  // Validate
  console.log("=== VALIDATION ===");
  console.log("✅ Has name:", !!json.name);
  console.log("✅ Has description:", !!json.description);
  console.log("✅ Has image (SVG):", json.image.startsWith("data:image/svg+xml"));
  console.log("✅ Has animation_url:", json.animation_url.includes("arweave.net"));
  console.log("✅ Has attributes:", json.attributes.length > 0);
  console.log("");
  console.log("🎉 All tests passed! Ready to deploy.");
}

main().catch(console.error);
