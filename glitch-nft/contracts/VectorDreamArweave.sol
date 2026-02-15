// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * Vector Dream - Full Arweave
 * All metadata and images stored permanently on Arweave
 */
contract VectorDreamArweave is ERC721, Ownable {
    using Strings for uint256;

    uint256 public totalSupply;
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public mintPrice = 0.002 ether;
    
    mapping(uint256 => uint256) public tokenSeed;
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => string) public tokenMetadataURI; // Arweave URLs
    
    event Minted(address indexed to, uint256 indexed tokenId, uint256 seed);
    event MetadataSet(uint256 indexed tokenId, string uri);

    constructor() ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {}

    function mint(uint256 seed) external payable {
        require(totalSupply < MAX_SUPPLY, "Sold out");
        require(msg.value >= mintPrice, "Need 0.002 ETH");
        require(seed > 0 && seed < 100000, "Invalid seed");
        require(!seedMinted[seed], "Seed taken");
        
        totalSupply++;
        seedMinted[seed] = true;
        tokenSeed[totalSupply] = seed;
        
        _mint(msg.sender, totalSupply);
        emit Minted(msg.sender, totalSupply, seed);
    }

    function mintRandom() external payable {
        require(totalSupply < MAX_SUPPLY, "Sold out");
        require(msg.value >= mintPrice, "Need 0.002 ETH");
        
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, msg.sender, totalSupply
        ))) % 99999 + 1;
        
        while (seedMinted[seed]) {
            seed = (seed % 99999) + 1;
        }
        
        totalSupply++;
        seedMinted[seed] = true;
        tokenSeed[totalSupply] = seed;
        
        _mint(msg.sender, totalSupply);
        emit Minted(msg.sender, totalSupply, seed);
    }

    // Owner sets Arweave metadata URL after uploading
    function setTokenMetadataURI(uint256 tokenId, string calldata uri) external onlyOwner {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        tokenMetadataURI[tokenId] = uri;
        emit MetadataSet(tokenId, uri);
    }

    // Batch set metadata URIs
    function batchSetTokenMetadataURI(uint256[] calldata tokenIds, string[] calldata uris) external onlyOwner {
        require(tokenIds.length == uris.length, "Length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenIds[i] > 0 && tokenIds[i] <= totalSupply, "Token doesn't exist");
            tokenMetadataURI[tokenIds[i]] = uris[i];
            emit MetadataSet(tokenIds[i], uris[i]);
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        
        string memory uri = tokenMetadataURI[tokenId];
        require(bytes(uri).length > 0, "Metadata not set yet");
        
        return uri;
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return seed > 0 && seed < 100000 && !seedMinted[seed];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
