const puppeteer = require('puppeteer');
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

async function renderGif(seed) {
  console.log(`Rendering GIF for seed ${seed}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const size = 400; // GIF size
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  
  // Load the art from Arweave
  const url = `https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=${seed}`;
  console.log(`Loading ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('canvas');
  
  // Wait for initial render
  await new Promise(r => setTimeout(r, 2000));
  
  // Create GIF encoder
  const encoder = new GIFEncoder(size, size, 'neuquant', false);
  const outputDir = path.join(__dirname, '..', 'images');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  
  const outputPath = path.join(outputDir, `${seed}.gif`);
  const stream = fs.createWriteStream(outputPath);
  
  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setDelay(100); // 100ms between frames = 10fps
  encoder.setQuality(10); // Lower = better quality
  encoder.setRepeat(0); // Loop forever
  
  const canvas = await page.$('canvas');
  const frames = 20; // 2 seconds at 10fps
  
  console.log(`Capturing ${frames} frames...`);
  
  for (let i = 0; i < frames; i++) {
    // Take screenshot as PNG buffer using puppeteer's built-in method
    const buffer = await canvas.screenshot({ type: 'png', encoding: 'binary' });
    
    // Parse PNG to get raw pixel data
    const png = PNG.sync.read(Buffer.from(buffer));
    encoder.addFrame(png.data);
    
    // Small delay to let animation progress
    await new Promise(r => setTimeout(r, 100));
    
    if ((i + 1) % 5 === 0) {
      console.log(`  Frame ${i + 1}/${frames}`);
    }
  }
  
  encoder.finish();
  
  await new Promise(resolve => stream.on('finish', resolve));
  console.log(`Saved GIF to ${outputPath}`);
  
  // Also save a static PNG for fallback
  const pngPath = path.join(outputDir, `${seed}.png`);
  await canvas.screenshot({ path: pngPath, type: 'png' });
  console.log(`Saved PNG fallback to ${pngPath}`);
  
  await browser.close();
  
  const stats = fs.statSync(outputPath);
  console.log(`GIF size: ${(stats.size / 1024).toFixed(1)} KB`);
  
  return outputPath;
}

const seed = process.argv[2];
if (seed) {
  renderGif(parseInt(seed)).catch(console.error);
} else {
  console.log('Usage: node render-gif.js <seed>');
  console.log('Example: node render-gif.js 1744');
}
