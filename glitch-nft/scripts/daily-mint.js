const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Daily Mint Script
 * Generates a unique seed, mints the NFT, and optionally lists on OpenSea
 */
async function main() {
    const [deployer] = await hre.ethers.getSigners();
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "..", `deployment-${hre.network.name}.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for ${hre.network.name}. Run deploy-onchain.js first.`);
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    console.log("🎨 DAILY MINT - Vector Dream");
    console.log("=".repeat(40));
    console.log(`Network: ${hre.network.name}`);
    console.log(`Contract: ${deployment.contract}`);
    console.log(`Minter: ${deployer.address}`);
    
    // Connect to contract
    const VectorDream = await hre.ethers.getContractFactory("VectorDreamOnChain");
    const contract = VectorDream.attach(deployment.contract);
    
    // Get current state
    const totalSupply = await contract.totalSupply();
    const mintPrice = await contract.mintPrice();
    
    console.log(`\nCurrent supply: ${totalSupply}`);
    console.log(`Mint price: ${hre.ethers.formatEther(mintPrice)} ETH`);
    
    // Generate daily seed based on date (ensures unique per day)
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Create seed from date hash
    let seed = parseInt(
        hre.ethers.keccak256(hre.ethers.toUtf8Bytes(dateStr)).slice(-8),
        16
    ) % 99999 + 1;
    
    // Check if seed is available, if not find next available
    while (!(await contract.isSeedAvailable(seed))) {
        console.log(`Seed ${seed} taken, trying next...`);
        seed = (seed % 99999) + 1;
    }
    
    console.log(`\n📅 Date: ${dateStr}`);
    console.log(`🎲 Seed: ${seed}`);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    if (balance < mintPrice) {
        throw new Error(`Insufficient balance. Need ${hre.ethers.formatEther(mintPrice)} ETH, have ${hre.ethers.formatEther(balance)} ETH`);
    }
    
    // Mint
    console.log(`\n⛏️  Minting...`);
    const tx = await contract.mint(seed, { value: mintPrice });
    console.log(`Transaction: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Minted in block ${receipt.blockNumber}`);
    
    // Get token ID from event
    const mintEvent = receipt.logs.find(log => {
        try {
            return contract.interface.parseLog(log)?.name === 'ArtMinted';
        } catch { return false; }
    });
    
    let tokenId;
    if (mintEvent) {
        const parsed = contract.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId.toString();
        console.log(`🎉 Token ID: #${tokenId}`);
    } else {
        tokenId = (BigInt(totalSupply) + 1n).toString();
        console.log(`🎉 Token ID: #${tokenId} (estimated)`);
    }
    
    // Save mint record
    const mintRecord = {
        date: dateStr,
        seed: seed,
        tokenId: tokenId,
        txHash: tx.hash,
        block: receipt.blockNumber,
        mintedAt: new Date().toISOString()
    };
    
    const recordsPath = path.join(__dirname, "..", "mint-records.json");
    let records = [];
    if (fs.existsSync(recordsPath)) {
        records = JSON.parse(fs.readFileSync(recordsPath, "utf8"));
    }
    records.push(mintRecord);
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
    
    console.log(`\n💾 Record saved to mint-records.json`);
    
    // OpenSea link
    const openseaBase = hre.network.name === 'mainnet' 
        ? 'https://opensea.io/assets/ethereum'
        : `https://testnets.opensea.io/assets/${hre.network.name}`;
    console.log(`\n🌊 OpenSea: ${openseaBase}/${deployment.contract}/${tokenId}`);
    
    console.log("\n" + "=".repeat(40));
    console.log("✨ Daily mint complete!");
    
    return { tokenId, seed, txHash: tx.hash };
}

// Run if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main };
