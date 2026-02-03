// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Vector Dream - Generative Vaporwave Art
 * @notice Dynamic NFTs that react to crypto market data
 * @dev Art is stored permanently on Arweave, metadata generated on-chain
 */
contract VectorDream is ERC721, Ownable {
    using Strings for uint256;

    // Arweave base URL for the HTML art (permanent storage)
    string public arweaveBaseUrl;
    
    // Collection info
    uint256 public totalSupply;
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    // Track minted seeds to ensure uniqueness
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => uint256) public tokenSeed;
    
    // Events
    event ArtMinted(address indexed to, uint256 indexed tokenId, uint256 seed);
    event ArweaveUrlUpdated(string newUrl);

    constructor(
        string memory _arweaveBaseUrl,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {
        arweaveBaseUrl = _arweaveBaseUrl;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
    }

    /**
     * @notice Mint a new piece with a specific seed
     * @param seed The seed determining the artwork's unique parameters
     */
    function mint(uint256 seed) external payable {
        require(totalSupply < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(!seedMinted[seed], "Seed already minted");
        require(seed > 0 && seed < 100000, "Invalid seed range");

        uint256 tokenId = totalSupply + 1;
        seedMinted[seed] = true;
        tokenSeed[tokenId] = seed;
        totalSupply++;

        _safeMint(msg.sender, tokenId);
        
        emit ArtMinted(msg.sender, tokenId, seed);
    }

    /**
     * @notice Mint with a random seed
     */
    function mintRandom() external payable {
        require(totalSupply < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        // Generate pseudo-random seed
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            totalSupply
        ))) % 99999 + 1;

        // Find unused seed if collision
        while (seedMinted[seed]) {
            seed = (seed + 1) % 99999 + 1;
        }

        uint256 tokenId = totalSupply + 1;
        seedMinted[seed] = true;
        tokenSeed[tokenId] = seed;
        totalSupply++;

        _safeMint(msg.sender, tokenId);
        
        emit ArtMinted(msg.sender, tokenId, seed);
    }

    /**
     * @notice Returns fully on-chain metadata with Arweave animation_url
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token does not exist");
        
        uint256 seed = tokenSeed[tokenId];
        
        // Generate attributes based on seed (matching the JS config generation)
        string memory sceneType = _getSceneType(seed);
        string memory palette = _getPalette(seed);
        
        // Build animation URL pointing to Arweave
        string memory animationUrl = string(abi.encodePacked(
            arweaveBaseUrl,
            "?seed=",
            seed.toString()
        ));

        // Build JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name":"Vector Dream #',
            tokenId.toString(),
            '","description":"Generative vaporwave art that breathes with the crypto market. Seed: ',
            seed.toString(),
            '","image":"',
            animationUrl,
            '","animation_url":"',
            animationUrl,
            '","attributes":[{"trait_type":"Seed","value":"',
            seed.toString(),
            '"},{"trait_type":"Scene","value":"',
            sceneType,
            '"},{"trait_type":"Palette","value":"',
            palette,
            '"},{"trait_type":"Market Reactive","value":"Yes"}]}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @notice Determine scene type from seed (matches JS logic)
     */
    function _getSceneType(uint256 seed) internal pure returns (string memory) {
        // Replicate mulberry32 first few iterations to get sceneType
        uint256 t = seed + 0x6D2B79F5;
        t = (t ^ (t >> 15)) * (t | 1);
        t ^= t + ((t ^ (t >> 7)) * (t | 61));
        uint256 r1 = ((t ^ (t >> 14))) % 1000;
        
        // Skip a few iterations to match JS rand() calls before sceneType
        for (uint i = 0; i < 5; i++) {
            t = t + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
        }
        uint256 sceneIdx = ((t ^ (t >> 14))) % 6;
        
        if (sceneIdx == 0) return "Classical Bust";
        if (sceneIdx == 1) return "Crystal Cluster";
        if (sceneIdx == 2) return "Ring Structure";
        if (sceneIdx == 3) return "Pyramid Complex";
        if (sceneIdx == 4) return "Data Sculpture";
        return "Glitched Head";
    }

    /**
     * @notice Determine palette from seed
     */
    function _getPalette(uint256 seed) internal pure returns (string memory) {
        uint256 t = seed + 0x6D2B79F5;
        t = (t ^ (t >> 15)) * (t | 1);
        t ^= t + ((t ^ (t >> 7)) * (t | 61));
        uint256 paletteIdx = ((t ^ (t >> 14))) % 5;
        
        if (paletteIdx == 0) return "Sunset Chrome";
        if (paletteIdx == 1) return "Violet Teal";
        if (paletteIdx == 2) return "Hot Pink Aqua";
        if (paletteIdx == 3) return "Fuchsia Cyan";
        return "Rose Turquoise";
    }

    /**
     * @notice Update Arweave URL (only owner, for emergencies)
     */
    function setArweaveUrl(string memory _newUrl) external onlyOwner {
        arweaveBaseUrl = _newUrl;
        emit ArweaveUrlUpdated(_newUrl);
    }

    /**
     * @notice Update mint price
     */
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
    }

    /**
     * @notice Withdraw contract funds
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @notice Check if a seed is available
     */
    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return !seedMinted[seed] && seed > 0 && seed < 100000;
    }
}
