const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function renderArt(seed) {
  console.log(`Rendering seed ${seed}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1000 });
  
  // Load the art from Arweave
  const url = `https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=${seed}`;
  console.log(`Loading ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for canvas to render
  await page.waitForSelector('canvas');
  await new Promise(r => setTimeout(r, 3000)); // Let it render a few frames
  
  // Screenshot the canvas
  const canvas = await page.$('canvas');
  const outputDir = path.join(__dirname, '..', 'images');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  
  const outputPath = path.join(outputDir, `${seed}.png`);
  await canvas.screenshot({ path: outputPath, type: 'png' });
  
  console.log(`Saved to ${outputPath}`);
  
  await browser.close();
  return outputPath;
}

// Get seed from command line or render all minted
const seed = process.argv[2];
if (seed) {
  renderArt(parseInt(seed)).catch(console.error);
} else {
  console.log('Usage: node render-art.js <seed>');
  console.log('Example: node render-art.js 1744');
}
