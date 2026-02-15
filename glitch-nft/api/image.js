module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const seed = req.query.seed || '1';
  
  // Pre-rendered seeds - redirect to static PNG
  const preRendered = ['30163', '53984', '58614', '59759', '67097', '88882', '98852'];
  
  if (preRendered.includes(seed)) {
    // 302 redirect to static PNG - OpenSea will cache the final URL
    res.setHeader('Location', `https://vector-dream.vercel.app/images/${seed}.png`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(302).end();
  }
  
  // SVG fallback for non-rendered seeds
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(generateSVG(seed));
};

function generateSVG(seed) {
  function mulberry32(s) {
    return function() {
      let t = s += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }
  
  const rand = mulberry32(parseInt(seed));
  const styles = ['SYNTHWAVE', 'DATABEND', 'CORRUPT', 'NEON', 'ISOMETRIC', 'VOID'];
  const palettes = [['#ff6ec4', '#7873f5', '#4ff0ff'], ['#ff00ff', '#00b4b4', '#ffaa00'], ['#ff6b6b', '#48dbfb', '#a55eea']];
  
  const style = styles[Math.floor(rand() * styles.length)];
  const [c1, c2, c3] = palettes[Math.floor(rand() * palettes.length)];
  
  let shapes = '';
  for (let i = 0; i < 6; i++) {
    shapes += `<circle cx="${rand()*1000}" cy="${rand()*1000}" r="${50+rand()*150}" fill="${[c1,c2,c3][i%3]}" opacity="0.2"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
<rect width="1000" height="1000" fill="#0a0a12"/>
${shapes}
<text x="500" y="380" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="900" fill="${c1}">VECTOR DREAM</text>
<text x="500" y="550" text-anchor="middle" font-family="sans-serif" font-size="200" font-weight="900" fill="#fff">#${seed}</text>
<text x="500" y="700" text-anchor="middle" font-family="sans-serif" font-size="40" fill="${c2}">${style}</text>
</svg>`;
}
