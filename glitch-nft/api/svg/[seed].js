module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const { seed } = req.query;
  const seedNum = parseInt(seed) || 1;
  
  // Get colors based on seed
  const colors = ['#ff6ec4', '#7873f5', '#4ff0ff', '#00ff87', '#60efff', '#ffaa00', '#ff6b6b', '#a55eea'];
  const c1 = colors[seedNum % 8];
  const c2 = colors[Math.floor(seedNum / 8) % 8];
  
  // Get style
  const styles = ['Synthwave', 'Databend', 'Corrupt', 'Neon', 'Isometric', 'Void'];
  const style = styles[seedNum % 6];
  
  // Generate circle positions from seed
  const cx1 = 80 + ((seedNum * 7) % 240);
  const cy1 = 80 + ((seedNum * 11) % 240);
  const cx2 = 80 + ((seedNum * 13) % 240);
  const cy2 = 80 + ((seedNum * 17) % 240);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#0a0a12"/>
  <circle cx="${cx1}" cy="${cy1}" r="80" fill="${c1}" opacity="0.3"/>
  <circle cx="${cx2}" cy="${cy2}" r="100" fill="${c2}" opacity="0.3"/>
  <text x="200" y="160" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${c1}">VECTOR DREAM</text>
  <text x="200" y="230" text-anchor="middle" font-family="sans-serif" font-size="56" fill="#fff">#${seedNum}</text>
  <text x="200" y="290" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${c2}">${style}</text>
</svg>`;

  res.status(200).send(svg);
};
