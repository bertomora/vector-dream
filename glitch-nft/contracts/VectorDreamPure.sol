// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * Vector Dream - Pure Code NFT
 * No images, no videos - just live generative code on Arweave
 */
contract VectorDreamPure is ERC721, Ownable {
    using Strings for uint256;

    uint256 public totalSupply;
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public mintPrice = 0.002 ether;
    
    // The art lives here forever - pure HTML/JS/WebGL
    string public constant ARWEAVE_ART = "https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8";
    
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
        
        uint256 seed = tokenSeed[tokenId];
        string memory artUrl = string(abi.encodePacked(ARWEAVE_ART, "?seed=", seed.toString()));
        
        // Metadata points to live code - both image and animation
        string memory json = string(abi.encodePacked(
            '{"name":"Vector Dream #', tokenId.toString(),
            '","description":"Pure generative code art. No static images - this IS the code, running live forever on Arweave. Seed: ', seed.toString(),
            '","image":"', artUrl,
            '","animation_url":"', artUrl,
            '","attributes":[{"trait_type":"Seed","value":"', seed.toString(),
            '"},{"trait_type":"Type","value":"Pure Code"}]}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return seed > 0 && seed < 100000 && !seedMinted[seed];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
