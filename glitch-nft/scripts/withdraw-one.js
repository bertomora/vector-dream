const hre = require('hardhat');
const addr = process.env.CONTRACT || '0xEf04a8CA8337A7bbAC4D82dc5Aa7cE458182F2D4';

async function main() {
  console.log('Withdrawing from', addr);
  const c = await hre.ethers.getContractAt('VectorDream', addr);
  const bal = await hre.ethers.provider.getBalance(addr);
  console.log('Balance:', hre.ethers.formatEther(bal), 'ETH');
  
  if (bal > 0n) {
    const tx = await c.withdraw();
    await tx.wait();
    console.log('✅ Withdrawn!');
  } else {
    console.log('Nothing to withdraw');
  }
}
main().catch(console.error);
