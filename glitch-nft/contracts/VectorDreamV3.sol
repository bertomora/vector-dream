// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Vector Dream V3 - On-Chain Metadata with External Images
 * @notice Fully on-chain metadata, external image API for thumbnails, Arweave for animation
 * @dev This pattern works reliably on OpenSea: image=PNG/SVG, animation_url=WebGL
 */
contract VectorDreamV3 is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public totalSupply;
    uint256 public mintPrice;
    
    // Base URLs - both mutable for flexibility
    string public baseURI = "https://vector-dream.vercel.app";
    
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => uint256) public tokenSeed;

    event ArtMinted(address indexed to, uint256 indexed tokenId, uint256 seed);
    event BaseURIUpdated(string newURI);

    constructor(uint256 _mintPrice) ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {
        mintPrice = _mintPrice;
    }

    function mint(uint256 seed) external payable {
        require(totalSupply < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(seed > 0 && seed < 100000, "Invalid seed range");
        require(!seedMinted[seed], "Seed already minted");

        uint256 tokenId = totalSupply + 1;
        seedMinted[seed] = true;
        tokenSeed[tokenId] = seed;
        totalSupply++;
        
        _safeMint(msg.sender, tokenId);
        emit ArtMinted(msg.sender, tokenId, seed);
    }

    function mintRandom() external payable {
        require(totalSupply < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, msg.sender, totalSupply
        ))) % 99999 + 1;
        
        while (seedMinted[seed]) {
            seed = (seed % 99999) + 1;
        }

        uint256 tokenId = totalSupply + 1;
        seedMinted[seed] = true;
        tokenSeed[tokenId] = seed;
        totalSupply++;
        
        _safeMint(msg.sender, tokenId);
        emit ArtMinted(msg.sender, tokenId, seed);
    }

    /**
     * @notice Fully on-chain metadata generation
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        
        uint256 seed = tokenSeed[tokenId];
        
        string memory json = string(abi.encodePacked(
            _buildPart1(tokenId, seed),
            _buildPart2(seed),
            _buildPart3(seed)
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _buildPart1(uint256 tokenId, uint256 seed) internal view returns (string memory) {
        return string(abi.encodePacked(
            '{"name":"Vector Dream #', tokenId.toString(),
            '","description":"Fully generative art from pure math. Synthwave spires, glitch tears, neon voids, and pixel-sorted dreams. Each seed mints once. Each piece responds to live crypto markets. Forever on-chain. Seed: ', seed.toString(),
            '","image":"', baseURI, '/api/image?seed=', seed.toString(), '"'
        ));
    }

    function _buildPart2(uint256 seed) internal view returns (string memory) {
        return string(abi.encodePacked(
            ',"animation_url":"', baseURI, '?seed=', seed.toString(), '"'
        ));
    }

    function _buildPart3(uint256 seed) internal pure returns (string memory) {
        (
            string memory style,
            string memory variant,
            string memory composition,
            string memory palette,
            string memory intensity
        ) = _getTraits(seed);
        
        return string(abi.encodePacked(
            ',"attributes":[',
            '{"trait_type":"Style","value":"', style, '"},',
            '{"trait_type":"Variant","value":"', variant, '"},',
            '{"trait_type":"Composition","value":"', composition, '"},',
            _buildPart3b(palette, intensity, seed)
        ));
    }

    function _buildPart3b(string memory palette, string memory intensity, uint256 seed) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{"trait_type":"Palette","value":"', palette, '"},',
            '{"trait_type":"Intensity","value":"', intensity, '"},',
            '{"trait_type":"Seed","value":"', seed.toString(), '"},',
            '{"trait_type":"Market Reactive","value":"Yes"}]}'
        ));
    }

    function _getTraits(uint256 seed) internal pure returns (
        string memory style,
        string memory variant,
        string memory composition,
        string memory palette,
        string memory intensity
    ) {
        unchecked {
            // Mulberry32 PRNG
            uint256 t = seed + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            uint256 hash = t ^ (t >> 14);
            
            // Style (6 options)
            uint256 styleIdx = hash % 6;
            if (styleIdx == 0) style = "Synthwave";
            else if (styleIdx == 1) style = "Databend";
            else if (styleIdx == 2) style = "Corrupt";
            else if (styleIdx == 3) style = "Neon";
            else if (styleIdx == 4) style = "Isometric";
            else style = "Void";
            
            // Advance PRNG
            t = hash + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            hash = t ^ (t >> 14);
            
            // Variant (3 options)
            uint256 varIdx = hash % 3;
            if (varIdx == 0) variant = "Alpha";
            else if (varIdx == 1) variant = "Beta";
            else variant = "Gamma";
            
            // Advance PRNG
            t = hash + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            hash = t ^ (t >> 14);
            
            // Composition (7 options)
            uint256 compIdx = hash % 7;
            if (compIdx == 0) composition = "Top";
            else if (compIdx == 1) composition = "Bottom";
            else if (compIdx == 2) composition = "Left";
            else if (compIdx == 3) composition = "Right";
            else if (compIdx == 4) composition = "Center";
            else if (compIdx == 5) composition = "Edges";
            else composition = "Scattered";
            
            // Advance PRNG
            t = hash + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            hash = t ^ (t >> 14);
            
            // Palette (8 options)
            uint256 palIdx = hash % 8;
            if (palIdx == 0) palette = "Pixel Cyan";
            else if (palIdx == 1) palette = "Midnight Teal";
            else if (palIdx == 2) palette = "Coral Aqua";
            else if (palIdx == 3) palette = "Fuchsia Mint";
            else if (palIdx == 4) palette = "Rose Turquoise";
            else if (palIdx == 5) palette = "Citrus Violet";
            else if (palIdx == 6) palette = "Bronze Indigo";
            else palette = "Ember Violet";
            
            // Advance PRNG
            t = hash + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            hash = t ^ (t >> 14);
            
            // Intensity (3 options)
            uint256 intIdx = hash % 3;
            if (intIdx == 0) intensity = "Subtle";
            else if (intIdx == 1) intensity = "Balanced";
            else intensity = "Intense";
        }
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseURI = _uri;
        emit BaseURIUpdated(_uri);
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return seed > 0 && seed < 100000 && !seedMinted[seed];
    }
}
