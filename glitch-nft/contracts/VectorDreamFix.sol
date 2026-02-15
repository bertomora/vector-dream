// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Vector Dream - EXACT copy of working contract pattern
 * @notice Uses Arweave for animation_url like the working 0x8f66 contract
 */
contract VectorDreamFix is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public totalSupply;
    uint256 public mintPrice;
    
    string public imageBaseURI = "https://vector-dream.vercel.app/api/image?seed=";
    string public constant ARWEAVE_ART = "https://arweave.net/lZQFvapdJasRD_E9Dbuvj_LsSpL9NN-sctxIM093hP8?seed=";
    
    mapping(uint256 => bool) public seedMinted;
    mapping(uint256 => uint256) public tokenSeed;

    event ArtMinted(address indexed to, uint256 indexed tokenId, uint256 seed);

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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token doesn't exist");
        uint256 seed = tokenSeed[tokenId];
        
        bytes memory json = abi.encodePacked(
            _part1(tokenId, seed),
            _part2(seed),
            _part3(seed)
        );
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(json)
        ));
    }

    function _part1(uint256 tokenId, uint256 seed) internal view returns (bytes memory) {
        return abi.encodePacked(
            '{"name":"Vector Dream #', tokenId.toString(),
            '","description":"Generative glitch art. Seed: ', seed.toString(),
            '","image":"', imageBaseURI, seed.toString(), '"'
        );
    }

    function _part2(uint256 seed) internal pure returns (bytes memory) {
        return abi.encodePacked(
            ',"animation_url":"', ARWEAVE_ART, seed.toString(), '"'
        );
    }

    function _part3(uint256 seed) internal pure returns (bytes memory) {
        return abi.encodePacked(
            ',"attributes":[',
            '{"trait_type":"Style","value":"', _getStyle(seed), '"},',
            '{"trait_type":"Seed","value":"', seed.toString(), '"},',
            '{"trait_type":"Market Reactive","value":"Yes"}',
            ']}'
        );
    }

    function _getStyle(uint256 seed) internal pure returns (string memory) {
        unchecked {
            uint256 t = seed + 0x6D2B79F5;
            t = (t ^ (t >> 15)) * (t | 1);
            t ^= t + ((t ^ (t >> 7)) * (t | 61));
            uint256 s = (t ^ (t >> 14)) % 6;
            if (s == 0) return "Synthwave";
            if (s == 1) return "Databend";
            if (s == 2) return "Corrupt";
            if (s == 3) return "Neon";
            if (s == 4) return "Isometric";
            return "Void";
        }
    }

    function setImageBaseURI(string calldata _uri) external onlyOwner {
        imageBaseURI = _uri;
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
