// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VectorDreamMinimal is ERC721, Ownable {
    using Strings for uint256;

    uint256 public totalSupply;
    uint256 public mintPrice = 0.002 ether;
    
    mapping(uint256 => uint256) public tokenSeed;

    constructor() ERC721("Vector Dream", "VDREAM") Ownable(msg.sender) {}

    mapping(uint256 => bool) public seedMinted;

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
        
        string memory json = string(abi.encodePacked(
            '{"name":"Vector Dream #', tokenId.toString(),
            '","description":"Generative art on Base",',
            '"image":"https://vector-dream.vercel.app/images/', seed.toString(), '.png',
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
