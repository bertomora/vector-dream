// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VectorDreamTest is ERC721, Ownable {
    using Strings for uint256;

    uint256 public totalSupply;
    uint256 public mintPrice = 0.002 ether;
    
    mapping(uint256 => uint256) public tokenSeed;
    mapping(uint256 => bool) public seedMinted;

    constructor() ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {}

    function mint(uint256 seed) external payable {
        require(msg.value >= mintPrice, "Need 0.002 ETH");
        require(seed > 0 && seed < 100000, "Bad seed");
        require(!seedMinted[seed], "Seed taken");
        
        totalSupply++;
        seedMinted[seed] = true;
        tokenSeed[totalSupply] = seed;
        _mint(msg.sender, totalSupply);
    }

    function mintRandom() external payable {
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
    }

    function isSeedAvailable(uint256 seed) external view returns (bool) {
        return seed > 0 && seed < 100000 && !seedMinted[seed];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "No token");
        
        uint256 seed = tokenSeed[tokenId];
        
        // Tiny 1x1 pink pixel PNG as base64 (44 bytes)
        // This is a valid PNG that OpenSea MUST render
        string memory pinkPixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        
        string memory json = string(abi.encodePacked(
            '{"name":"Vector Dream #', tokenId.toString(),
            '","description":"Generative art on Base. Seed: ', seed.toString(),
            '","image":"data:image/png;base64,', pinkPixel,
            '","animation_url":"https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=', seed.toString(),
            '"}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
