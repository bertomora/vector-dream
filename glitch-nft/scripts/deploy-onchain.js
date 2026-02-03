const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Chunk size (safe limit for SSTORE2, ~24KB per chunk)
const CHUNK_SIZE = 24000;

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    // Read and prepare the art HTML
    const htmlPath = path.join(__dirname, "..", "index.onchain.html");
    if (!fs.existsSync(htmlPath)) {
        console.log("Creating on-chain optimized HTML...");
        await createOnChainHtml();
    }
    
    let artHtml = fs.readFileSync(htmlPath, "utf8");
    console.log(`Art size: ${artHtml.length} bytes`);

    // Calculate chunks needed
    const numChunks = Math.ceil(artHtml.length / CHUNK_SIZE);
    console.log(`Will store in ${numChunks} chunks`);

    // Deploy contract
    const maxSupply = 10000;
    const mintPrice = hre.ethers.parseEther("0.01"); // 0.01 ETH

    console.log("\n📜 Deploying VectorDreamOnChain...");
    const VectorDream = await hre.ethers.getContractFactory("VectorDreamOnChain");
    const contract = await VectorDream.deploy(maxSupply, mintPrice);
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);

    // Store art chunks
    console.log("\n🎨 Storing art on-chain...");
    for (let i = 0; i < numChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, artHtml.length);
        const chunk = artHtml.slice(start, end);
        
        console.log(`  Storing chunk ${i + 1}/${numChunks} (${chunk.length} bytes)...`);
        const tx = await contract.storeArtChunk(hre.ethers.toUtf8Bytes(chunk));
        await tx.wait();
        console.log(`  ✅ Chunk ${i + 1} stored`);
    }

    // Lock the art
    console.log("\n🔒 Locking art permanently...");
    const lockTx = await contract.lockArt();
    await lockTx.wait();
    console.log("✅ Art locked forever!");

    // Verify
    console.log("\n📊 Verification:");
    console.log("  Chunks stored:", (await contract.getArtChunkCount()).toString());
    console.log("  Art locked:", await contract.artLocked());
    
    // Test read
    console.log("\n🧪 Testing art retrieval...");
    const storedArt = await contract.getArt();
    console.log(`  Retrieved ${storedArt.length} characters`);
    console.log("  Match:", storedArt.length === artHtml.length ? "✅ PERFECT" : "❌ MISMATCH");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50));
    console.log(`Contract: ${contractAddress}`);
    console.log(`Network: ${hre.network.name}`);
    console.log(`Art chunks: ${numChunks}`);
    console.log(`Max supply: ${maxSupply}`);
    console.log(`Mint price: ${hre.ethers.formatEther(mintPrice)} ETH`);
    
    // Save deployment info
    const deployInfo = {
        contract: contractAddress,
        network: hre.network.name,
        deployer: deployer.address,
        artChunks: numChunks,
        artSize: artHtml.length,
        maxSupply,
        mintPrice: mintPrice.toString(),
        deployedAt: new Date().toISOString()
    };
    fs.writeFileSync(
        path.join(__dirname, "..", `deployment-${hre.network.name}.json`),
        JSON.stringify(deployInfo, null, 2)
    );
    console.log(`\n💾 Deployment info saved to deployment-${hre.network.name}.json`);
}

async function createOnChainHtml() {
    // Read original HTML
    const originalPath = path.join(__dirname, "..", "index.html");
    let html = fs.readFileSync(originalPath, "utf8");
    
    // Modify to read seed from window.SEED instead of URL
    html = html.replace(
        "let seed = parseInt(new URLSearchParams(window.location.search).get('seed')) || Math.floor(Math.random() * 100000);",
        "let seed = window.SEED || parseInt(new URLSearchParams(window.location.search).get('seed')) || Math.floor(Math.random() * 100000);"
    );
    
    // Remove the HTML wrapper (will be added by contract)
    // Extract just the content between <body> tags
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
        html = bodyMatch[1].trim();
    }
    
    // Basic minification
    html = html
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
        .replace(/\/\/.*$/gm, '') // Remove JS single-line comments  
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .replace(/^\s+/gm, '') // Remove leading whitespace
        .trim();
    
    const outPath = path.join(__dirname, "..", "index.onchain.html");
    fs.writeFileSync(outPath, html);
    console.log(`Created on-chain HTML: ${html.length} bytes`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
