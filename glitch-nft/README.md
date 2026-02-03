# VΞCTOR DRΞΛM

> Generative vaporwave art that breathes with the crypto market.

![Vector Dream](https://arweave.net/preview)

## 🎨 About

Vector Dream is a collection of generative 3D vaporwave artworks living permanently on the Ethereum blockchain. Each piece is unique, determined by a seed, and reacts dynamically to real-time cryptocurrency market data.

**Features:**
- 🔮 6 unique scene types (busts, crystals, pyramids, etc.)
- 🎨 5 vaporwave color palettes
- 📈 Market-reactive visuals (BTC/ETH price influences the art)
- ♾️ Infinite, never-repeating animation
- 💾 100% on-chain metadata, art stored permanently on Arweave
- 🌐 Pure WebGL/GLSL — no images, videos, or external dependencies

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd glitch-nft
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your keys
```

You'll need:
- **Private Key**: From your ETH wallet (MetaMask: Settings > Security > Export)
- **RPC URL**: Free from [Alchemy](https://alchemy.com) or [Infura](https://infura.io)
- **Etherscan API Key**: For contract verification (optional but recommended)

### 3. Upload Art to Arweave (Permanent Storage)

Option A: Using script (requires AR tokens)
```bash
npm run upload:arweave
```

Option B: Free upload via [Akord](https://akord.com) or [ArDrive](https://ardrive.io)
1. Upload `index.html`
2. Copy the Arweave URL
3. Add to `.env`: `ARWEAVE_URL=https://arweave.net/YOUR_TX_ID`

### 4. Deploy Contract

Test on Sepolia first:
```bash
npm run deploy:sepolia
```

Deploy to mainnet:
```bash
npm run deploy:mainnet
```

### 5. Mint NFTs

```bash
# Mint with random seed
npm run mint

# Mint specific seed
npm run mint 42069
```

### 6. List on OpenSea

```bash
# List token #1 for 0.1 ETH
npm run list:opensea 1 0.1
```

Or list manually at [opensea.io](https://opensea.io)

## 📁 Project Structure

```
glitch-nft/
├── index.html              # The generative art (WebGL/GLSL)
├── contracts/
│   └── VectorDream.sol     # ERC-721 smart contract
├── scripts/
│   ├── upload-arweave.js   # Upload art to permanent storage
│   ├── deploy.js           # Deploy contract to ETH
│   ├── mint.js             # Mint NFTs
│   └── list-opensea.js     # List on OpenSea via Seaport
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

## 🔗 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      ETHEREUM MAINNET                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  VectorDream.sol (ERC-721)                          │   │
│  │  - Stores seed per tokenId                          │   │
│  │  - Generates on-chain metadata                      │   │
│  │  - Points to Arweave for animation_url              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ animation_url
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ARWEAVE (PERMANENT)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  index.html?seed=12345                              │   │
│  │  - Pure WebGL/GLSL shaders                          │   │
│  │  - Reads seed from URL param                        │   │
│  │  - Fetches live crypto prices                       │   │
│  │  - Renders unique, infinite animation               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ displays in
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OPENSEA / WALLETS                         │
│  - Shows animated preview via animation_url                 │
│  - Metadata attributes from on-chain tokenURI               │
│  - Full interactivity in browsers                           │
└─────────────────────────────────────────────────────────────┘
```

## 🎛️ Customization

### Mint Price
Edit in `scripts/deploy.js`:
```javascript
const mintPrice = hre.ethers.parseEther("0.05");  // Change price
```

### Max Supply
```javascript
const maxSupply = 10000;  // Change max supply
```

### Art Parameters
Edit `index.html` to modify:
- Color palettes
- Scene types
- Animation speeds
- Market influence strength
- Glitch effects

## 📊 Market Reactivity

The art responds to real BTC/ETH market data:

| Market Condition | Visual Effect |
|------------------|---------------|
| Bullish (prices up) | Warmer hues, expanded geometry |
| Bearish (prices down) | Cooler hues, contracted forms |
| High volatility | Increased glitch effects |
| Low volatility | Smoother, calmer animation |

Data fetched from CoinGecko API (free, no key needed).

## 🔒 Permanence

- **Metadata**: Generated on-chain, can't be changed or removed
- **Art**: Stored on Arweave, paid once, stored forever
- **Contract**: Immutable after deployment (except Arweave URL for emergencies)

Even if this project disappears, your NFT and its art will exist as long as Ethereum and Arweave exist.

## 📜 License

MIT — Do whatever you want with this code.

## 🙏 Credits

Built with:
- WebGL/GLSL for rendering
- OpenZeppelin for secure contracts
- Seaport for OpenSea integration
- Arweave for permanent storage
- CoinGecko for market data

---

*Made with 💜 in the metaverse*
