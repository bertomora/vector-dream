// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Vector Dream Dynamic - External Metadata for True Dynamic NFTs
 * @notice Like Jack Butcher's Trademark - metadata served from API, can update anytime
 * @dev Metadata changes based on: market data, time of day, holder actions, etc.
 */
contract VectorDreamDynamic is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public totalSupply;
    uint256 public mintPrice;
    
    // External metadata API - can update metadata dynamically
    string public baseURI = "https://vector-dream.vercel.app/api/dynamic/";
    
    // Store seed for each token
    mapping(uint256 => uint256) public tokenSeed;
    mapping(uint256 => bool) public seedMinted;

    event ArtMinted(address indexed to, uint256 indexed tokenId, uint256 seed);
    event BaseURIUpdated(string newURI);
    event MetadataUpdate(uint256 indexed tokenId); // EIP-4906

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
     * @notice Returns external metadata URL - API handles dynamic content
     * @dev API can return different metadata based on time, market data, etc.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        // URL format: baseURI/{tokenId}?seed={seed}
        return string(abi.encodePacked(
            baseURI,
            tokenId.toString(),
            "?seed=",
            tokenSeed[tokenId].toString()
        ));
    }

    /**
     * @notice Trigger metadata refresh on OpenSea (EIP-4906)
     */
    function refreshMetadata(uint256 tokenId) external onlyOwner {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        emit MetadataUpdate(tokenId);
    }

    /**
     * @notice Refresh all metadata (batch)
     */
    function refreshAllMetadata() external onlyOwner {
        for (uint256 i = 1; i <= totalSupply; i++) {
            emit MetadataUpdate(i);
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

    // EIP-4906 support
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }
}
