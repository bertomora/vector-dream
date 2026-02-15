// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * Vector Dream - Final Version
 * Uses external metadata URL for flexibility
 */
contract VectorDreamFinal is ERC721, Ownable {
    using Strings for uint256;

    uint256 public totalSupply;
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public mintPrice = 0.002 ether;
    
    string public baseURI = "https://vector-dream.vercel.app/api/metadata/";
    
    mapping(uint256 => uint256) public tokenSeed;
    mapping(uint256 => bool) public seedMinted;
    
    event Minted(address indexed to, uint256 indexed tokenId, uint256 seed);

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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseURI = _uri;
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return seed > 0 && seed < 100000 && !seedMinted[seed];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
