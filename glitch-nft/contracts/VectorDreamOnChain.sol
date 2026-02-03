// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SSTORE2 - Store data as contract bytecode
 * @notice Gas-efficient storage for large data
 */
library SSTORE2 {
    function write(bytes memory data) internal returns (address pointer) {
        bytes memory code = abi.encodePacked(
            hex"00", // STOP opcode (prevents execution)
            data
        );
        assembly {
            pointer := create(0, add(code, 32), mload(code))
        }
        require(pointer != address(0), "SSTORE2: deployment failed");
    }

    function read(address pointer) internal view returns (bytes memory data) {
        uint256 size;
        assembly { size := extcodesize(pointer) }
        require(size > 1, "SSTORE2: invalid pointer");
        
        data = new bytes(size - 1);
        assembly {
            extcodecopy(pointer, add(data, 32), 1, sub(size, 1))
        }
    }
}

/**
 * @title Vector Dream - Fully On-Chain Generative Art
 * @notice The art lives as code on Ethereum forever
 * @dev Art stored as bytecode using SSTORE2, reassembled at read time
 */
contract VectorDreamOnChain is ERC721, Ownable {
    using Strings for uint256;

    // Art chunks stored as contract bytecode (SSTORE2)
    address[] public artChunks;
    bool public artLocked;
    
    // Collection info
    uint256 public totalSupply;
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    // Track minted seeds
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => uint256) public tokenSeed;
    
    // Events
    event ArtMinted(address indexed to, uint256 indexed tokenId, uint256 seed);
    event ArtChunkStored(uint256 indexed chunkIndex, address pointer);
    event ArtLocked();

    constructor(
        uint256 _maxSupply,
        uint256 _mintPrice
    ) ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
    }

    /**
     * @notice Store a chunk of the art (call multiple times for large files)
     * @param chunk The HTML/JS chunk as bytes
     */
    function storeArtChunk(bytes calldata chunk) external onlyOwner {
        require(!artLocked, "Art is locked");
        address pointer = SSTORE2.write(chunk);
        artChunks.push(pointer);
        emit ArtChunkStored(artChunks.length - 1, pointer);
    }

    /**
     * @notice Lock the art permanently (no more changes)
     */
    function lockArt() external onlyOwner {
        require(artChunks.length > 0, "No art stored");
        artLocked = true;
        emit ArtLocked();
    }

    /**
     * @notice Read the full art HTML from on-chain storage
     */
    function getArt() public view returns (string memory) {
        require(artChunks.length > 0, "No art stored");
        
        // Calculate total size
        uint256 totalSize = 0;
        for (uint256 i = 0; i < artChunks.length; i++) {
            uint256 size;
            address ptr = artChunks[i];
            assembly { size := extcodesize(ptr) }
            totalSize += size - 1;
        }
        
        // Assemble chunks
        bytes memory result = new bytes(totalSize);
        uint256 offset = 0;
        for (uint256 i = 0; i < artChunks.length; i++) {
            bytes memory chunk = SSTORE2.read(artChunks[i]);
            for (uint256 j = 0; j < chunk.length; j++) {
                result[offset++] = chunk[j];
            }
        }
        
        return string(result);
    }

    /**
     * @notice Mint with a specific seed
     */
    function mint(uint256 seed) external payable {
        require(artLocked, "Art not locked yet");
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
     * @notice Mint with random seed
     */
    function mintRandom() external payable {
        require(artLocked, "Art not locked yet");
        require(totalSupply < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, msg.sender, totalSupply
        ))) % 99999 + 1;

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
     * @notice Returns fully on-chain metadata with data URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token does not exist");
        
        uint256 seed = tokenSeed[tokenId];
        string memory art = getArt();
        
        // Build the full HTML with seed injected
        string memory fullHtml = string(abi.encodePacked(
            _getArtPrefix(),
            art,
            _getArtSuffix(seed)
        ));
        
        // Get style info
        (string memory styleName, string memory palette) = _getTraits(seed);

        // Build JSON metadata with data URI
        string memory json = string(abi.encodePacked(
            '{"name":"Vector Dream #', tokenId.toString(),
            '","description":"Fully on-chain generative glitch art. Seed: ', seed.toString(),
            '","animation_url":"data:text/html;base64,', Base64.encode(bytes(fullHtml)),
            '","attributes":[{"trait_type":"Seed","value":"', seed.toString(),
            '"},{"trait_type":"Style","value":"', styleName,
            '"},{"trait_type":"Palette","value":"', palette,
            '"},{"trait_type":"Storage","value":"On-Chain"}]}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _getArtPrefix() internal pure returns (string memory) {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>VECTOR DREAM</title></head><body>';
    }

    function _getArtSuffix(uint256 seed) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<script>window.SEED=', seed.toString(), ';</script></body></html>'
        ));
    }

    /**
     * @notice Get traits from seed (matches JS logic)
     */
    function _getTraits(uint256 seed) internal pure returns (string memory style, string memory palette) {
        uint256 t = seed + 0x6D2B79F5;
        t = (t ^ (t >> 15)) * (t | 1);
        t ^= t + ((t ^ (t >> 7)) * (t | 61));
        uint256 styleIdx = ((t ^ (t >> 14)) % 1000) * 11 / 1000;
        
        // Next random for palette
        t = t + 0x6D2B79F5;
        t = (t ^ (t >> 15)) * (t | 1);
        t ^= t + ((t ^ (t >> 7)) * (t | 61));
        uint256 palIdx = ((t ^ (t >> 14))) % 16;
        
        if (styleIdx == 0) style = "Synthwave";
        else if (styleIdx == 1) style = "Databend";
        else if (styleIdx == 2) style = "Corrupt";
        else if (styleIdx == 3) style = "Liquid";
        else if (styleIdx == 4) style = "Minimal";
        else if (styleIdx == 5) style = "Retro";
        else if (styleIdx == 6) style = "Neon";
        else if (styleIdx == 7) style = "Geometric";
        else if (styleIdx == 8) style = "Void";
        else if (styleIdx == 9) style = "Isometric";
        else style = "Chaos";
        
        string[16] memory palettes = [
            "Pink Cyan", "Magenta Teal", "Coral Aqua", "Fuchsia Mint",
            "Rose Turquoise", "Orange Magenta", "Purple Yellow", "Red Lavender",
            "Cyan Pink", "Blue Orange", "RedOrange Teal", "Magenta Lime",
            "Gold Violet", "Purple Green", "Red Blue", "Blue Pink"
        ];
        palette = palettes[palIdx];
    }

    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return !seedMinted[seed] && seed > 0 && seed < 100000;
    }
    
    function getArtChunkCount() external view returns (uint256) {
        return artChunks.length;
    }
}
