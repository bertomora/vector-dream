// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VectorDream is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public totalSupply;
    uint256 public mintPrice;
    
    // External metadata URL - points to API or Arweave
    string public baseTokenURI = "https://vector-dream.vercel.app/api/metadata/";
    
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => uint256) public tokenSeed;

    event MetadataUpdate(uint256 _tokenId);

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
        emit MetadataUpdate(tokenId);
    }

    function mintRandom() external payable {
        require(totalSupply < MAX_SUPPLY, "Sold out");
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
        emit MetadataUpdate(tokenId);
    }

    // Returns external URL to metadata JSON
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Nonexistent token");
        return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
    }

    function setBaseTokenURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
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
