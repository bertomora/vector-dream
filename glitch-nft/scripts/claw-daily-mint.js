/**
 * Daily Mint Script for OpenClaw Cron
 * This script is designed to be triggered by OpenClaw's cron system
 * It mints the daily NFT and returns a status message
 */

const { execSync } = require('child_process');
const path = require('path');

async function main() {
    const projectDir = path.join(__dirname, '..');
    
    try {
        // Run the daily mint on mainnet
        const output = execSync('npm run daily:mainnet', {
            cwd: projectDir,
            encoding: 'utf8',
            timeout: 120000 // 2 min timeout
        });
        
        // Extract key info from output
        const tokenMatch = output.match(/Token ID: #(\d+)/);
        const seedMatch = output.match(/Seed: (\d+)/);
        const openseaMatch = output.match(/OpenSea: (https:\/\/[^\s]+)/);
        
        const result = {
            success: true,
            tokenId: tokenMatch ? tokenMatch[1] : 'unknown',
            seed: seedMatch ? seedMatch[1] : 'unknown',
            opensea: openseaMatch ? openseaMatch[1] : null,
            message: `✅ Daily mint complete! Token #${tokenMatch?.[1] || '?'} (seed ${seedMatch?.[1] || '?'})`
        };
        
        console.log(JSON.stringify(result, null, 2));
        return result;
        
    } catch (error) {
        const result = {
            success: false,
            error: error.message,
            message: `❌ Daily mint failed: ${error.message}`
        };
        console.error(JSON.stringify(result, null, 2));
        throw error;
    }
}

main();
