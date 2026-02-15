// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Vector Dream V2 - On-Chain Metadata with Inline SVG
 * @notice Thumbnails work instantly on OpenSea via inline SVG
 */
contract VectorDreamV2 is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public totalSupply;
    uint256 public mintPrice;
    
    string public arweaveBase = "https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8";
    
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => uint256) public tokenSeed;

    // Vaporwave name components
    string[16] private adjectives = [
        "Prism", "Neon", "Crystal", "Vapor", "Chrome", "Laser", "Cyber", "Holo",
        "Synth", "Pixel", "Glitch", "Dream", "Nova", "Echo", "Pulse", "Zero"
    ];
    string[16] private nouns = [
        "Dream", "Wave", "Grid", "Void", "Core", "Zone", "Flux", "Dawn",
        "Dusk", "Glow", "Haze", "Mist", "Rift", "Surge", "Bloom", "Fade"
    ];

    event ArtMinted(address indexed to, uint256 indexed tokenId, uint256 seed);

    constructor(uint256 _mintPrice) ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {
        mintPrice = _mintPrice;
    }

    function mint(uint256 seed) external payable {
        require(totalSupply < MAX_SUPPLY, "Sold out");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(seed > 0 && seed < 100000, "Invalid seed");
        require(!seedMinted[seed], "Seed taken");

        uint256 tokenId = totalSupply + 1;
        seedMinted[seed] = true;
        tokenSeed[tokenId] = seed;
        totalSupply++;
        
        _safeMint(msg.sender, tokenId);
        emit ArtMinted(msg.sender, tokenId, seed);
    }

    function mintRandom() external payable {
        require(totalSupply < MAX_SUPPLY, "Sold out");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 seed;
        unchecked {
            seed = uint256(keccak256(abi.encodePacked(
                block.timestamp, block.prevrandao, msg.sender, totalSupply
            ))) % 99999 + 1;
            
            uint256 attempts = 0;
            while (seedMinted[seed] && attempts < 100) {
                seed = (seed % 99999) + 1;
                attempts++;
            }
        }
        require(!seedMinted[seed], "No seeds available");

        uint256 tokenId = totalSupply + 1;
        seedMinted[seed] = true;
        tokenSeed[tokenId] = seed;
        totalSupply++;
        
        _safeMint(msg.sender, tokenId);
        emit ArtMinted(msg.sender, tokenId, seed);
    }

    /**
     * @notice Fully on-chain metadata with inline SVG thumbnail
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Nonexistent token");
        
        uint256 seed = tokenSeed[tokenId];
        
        // Build metadata in parts to avoid stack-too-deep
        string memory json = string(abi.encodePacked(
            _buildJsonPart1(tokenId, seed),
            _buildJsonPart2(seed),
            _buildJsonPart3(seed)
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _buildJsonPart1(uint256 tokenId, uint256 seed) internal view returns (string memory) {
        (string memory adj, string memory noun) = _getName(seed);
        return string(abi.encodePacked(
            '{"name":"', adj, ' ', noun, ' #', tokenId.toString(),
            '","description":"Generative glitch art from pure math. Each seed is unique. Live on Base, forever on Arweave.',
            '","external_url":"https://vector-dream.vercel.app"'
        ));
    }

    function _buildJsonPart2(uint256 seed) internal view returns (string memory) {
        return string(abi.encodePacked(
            ',"image":"', _buildSvgDataUri(seed),
            '","animation_url":"', arweaveBase, '?seed=', seed.toString(), '"'
        ));
    }

    function _buildJsonPart3(uint256 seed) internal view returns (string memory) {
        (string memory style, string memory palette) = _getTraits(seed);
        return string(abi.encodePacked(
            ',"attributes":[',
            '{"trait_type":"Style","value":"', style, '"},',
            '{"trait_type":"Palette","value":"', palette, '"},',
            '{"trait_type":"Seed","value":"', seed.toString(), '"}',
            ']}'
        ));
    }

    /**
     * @notice Generate inline SVG based on seed - simple gradient
     */
    function _buildSvgDataUri(uint256 seed) internal pure returns (string memory) {
        (string memory c1, string memory c2) = _getColors(seed);
        
        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" stop-color="', c1, '"/>',
            '<stop offset="100%" stop-color="', c2, '"/>',
            '</linearGradient></defs>',
            '<rect width="400" height="400" fill="url(#g)"/>',
            '<text x="200" y="200" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="48" font-family="monospace">',
            seed.toString(),
            '</text></svg>'
        );
        
        return string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(svg)
        ));
    }

    function _getColors(uint256 seed) internal pure returns (string memory c1, string memory c2) {
        unchecked {
            uint256 t = seed + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            uint256 idx = (t ^ (t >> 14)) % 8;
            
            // Vaporwave color pairs
            if (idx == 0) { c1 = "#ff6ec4"; c2 = "#7873f5"; }
            else if (idx == 1) { c1 = "#f857a6"; c2 = "#ff5858"; }
            else if (idx == 2) { c1 = "#4ff0ff"; c2 = "#845ec2"; }
            else if (idx == 3) { c1 = "#00d9ff"; c2 = "#ff00e4"; }
            else if (idx == 4) { c1 = "#fc466b"; c2 = "#3f5efb"; }
            else if (idx == 5) { c1 = "#11998e"; c2 = "#38ef7d"; }
            else if (idx == 6) { c1 = "#ee0979"; c2 = "#ff6a00"; }
            else { c1 = "#6a11cb"; c2 = "#2575fc"; }
        }
    }

    function _getName(uint256 seed) internal view returns (string memory adj, string memory noun) {
        unchecked {
            uint256 t = seed + 0x9E3779B9;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            uint256 hash = t ^ (t >> 14);
            
            adj = adjectives[hash % 16];
            noun = nouns[(hash >> 8) % 16];
        }
    }

    function _getTraits(uint256 seed) internal pure returns (string memory style, string memory palette) {
        unchecked {
            uint256 t = seed + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            uint256 styleIdx = ((t ^ (t >> 14)) % 1000) * 6 / 1000;
            
            t = t + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            uint256 palIdx = ((t ^ (t >> 14))) % 8;
            
            if (styleIdx == 0) style = "Synthwave";
            else if (styleIdx == 1) style = "Databend";
            else if (styleIdx == 2) style = "Corrupt";
            else if (styleIdx == 3) style = "Neon";
            else if (styleIdx == 4) style = "Isometric";
            else style = "Void";
            
            if (palIdx == 0) palette = "Pink Cyan";
            else if (palIdx == 1) palette = "Magenta Teal";
            else if (palIdx == 2) palette = "Coral Aqua";
            else if (palIdx == 3) palette = "Neon Sunset";
            else if (palIdx == 4) palette = "Electric";
            else if (palIdx == 5) palette = "Vapor";
            else if (palIdx == 6) palette = "Retro";
            else palette = "Midnight";
        }
    }

    function setArweaveBase(string calldata _uri) external onlyOwner {
        arweaveBase = _uri;
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return seed > 0 && seed < 100000 && !seedMinted[seed];
    }
}
