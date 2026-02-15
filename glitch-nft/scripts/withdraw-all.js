/**
 * Withdraw ETH from all deployed VectorDream contracts
 */

const hre = require("hardhat");

// All contracts you've deployed (add any others if needed)
const CONTRACTS = [
  // New contracts (Dynamic, V3)
  "0xbaE88927F84adc3a16aa3A41340631f5F285FA0A", // VectorDreamDynamic - CURRENT (clean)
  "0xE87Cfb82f780d3cCe3571245AFE9156BbB825C71", // VectorDreamDynamic old
  "0x7CFA602fE5F944aEd324d9d48767Ed16c09A6171", // VectorDreamV3
  "0x114A60DFDcE702015572528c05464596e573251b", // VectorDreamV3 old
  "0x8F4772124C550483649DD55c86D3045888e56FCE", // VectorDream  
  "0xEf04a8CA8337a7bbAc4d82dc5AA7Ce458182F2D4", // VectorDreamPure
  // Original contracts
  "0xca0754E2cff6D0d77f82cE9b9265e53F03c51b9B",
  "0x93A12Ec29395fe4D60A4BBfFcD7E53C76E1f197c",
  "0x8F69deCA96b94282178f206f47492e6cc2B07397",
  "0x8f66B06D02d857c3B7739aa9318BEeea54bBa03b",
  "0xad7F532bdA26eA6Bd0A34F493aD4D6c1eF8ab476",
  "0xBefb2221463DDaA9c79E2765FbF8b889BB759ED0",
  "0x1Ca304B14299e49719088c5EFb204319102E0E11",
  "0x1b5f72478d4a9A0806353177Fd82c9A140B69aAc",
  "0x4722E4246C59eC7471900ae0F35a9C6b3551B432",
  "0x2Db312c537d23007C6bd5C11a83886Ec4272b22e",
  "0x45C3625143F0655Ff7d12cC527E10C34ED7f7f2E",
  "0xEc06f16bEdCC21F510e86E6EFA3F248d215250d4",
  "0xcd1dC75DbA3311639A8204814579d38f2f282890",
  "0x55E1f78D1D5eAa709da191c5e3e6F7dd4F65FbB9",
  "0xA3204Ad18363c7B87c2072043a87D3a7028f8611",
  "0xE63325a00D333Ab93DD3Aff5f8326C83a8E97716",
  "0x541Da16F50b4FB52Ada4A45e7D04627Ee10594bb",
  "0xE9156642a7EFb3B27D77B71f90De78Bfd12D09a9",
  "0x9832d704fB60C45CC41d07b03F6bf016E94f7c4D",
  "0x9FdE862d46177561FB5a27E000395D8bC2Fe9Bc1",
  "0x63DDdc2Caf45Fb0A7D92BAf36832D9A5B589b39C",
  "0xa704fA7804ACCefa4f36cD1d30A624DAA5007c52",
  "0xFb150A508a8E878D73B07072719d4C983d79B7a3",
  "0xBa8FFB712A5AD6EAC3BeA1639BE20b33089e1a66",
  "0x8ee36aE1c2528De80B27628A75e4f3FE44280da2",
  "0xcf87D3e69b820b7723f9f4543b4E9d4a625D2eAb",
  "0xE62063ab44cC5B069e2C088afd876baC3d73b447",
  "0xf7662Ba510a7613e39aed2Bce9Ebc461f620b62f",
  "0xc6e6711eEd3AE72fdB8f9F3d8B9DaebF5DD69953",
  "0xD477B3139f610d804AE573b95Ae1BC58cD37cCEa",
  "0xB14722D8c6748852FD3eE021713B8110CF6F4188",
  "0x8A2bbb1384EBD7Eb0C4be4A298c7bE1B7c03e757",
  "0x15cF1d8BDeAa683D20098Bc5EB47c3C8F29c1Ea7",
  "0x93AF338BD5212191Edce791F3F4769BE4349973c",
  "0x4fcf5b33a152Df0db445D70DAd0e67e9968758A4",
  "0xCE1b390410c45A8ef39BcA935e2Db4dce7E40494",
];

async function main() {
  console.log("\n💰 Withdrawing ETH from all contracts...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Wallet:", signer.address);
  
  const startBalance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Starting balance:", hre.ethers.formatEther(startBalance), "ETH\n");

  let totalWithdrawn = 0n;

  for (const addr of CONTRACTS) {
    try {
      const balance = await hre.ethers.provider.getBalance(addr);
      console.log(`Contract ${addr.slice(0,8)}...${addr.slice(-4)}: ${hre.ethers.formatEther(balance)} ETH`);
      
      if (balance > 0n) {
        const contract = await hre.ethers.getContractAt("VectorDream", addr);
        const tx = await contract.withdraw();
        await tx.wait();
        console.log(`  ✅ Withdrawn!`);
        totalWithdrawn += balance;
      } else {
        console.log(`  ⏭️  Nothing to withdraw`);
      }
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
    }
  }

  const endBalance = await hre.ethers.provider.getBalance(signer.address);
  console.log("\n" + "=".repeat(50));
  console.log("Total withdrawn:", hre.ethers.formatEther(totalWithdrawn), "ETH");
  console.log("Final balance:", hre.ethers.formatEther(endBalance), "ETH");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
