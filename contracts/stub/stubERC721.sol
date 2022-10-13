// SPDX-License-Identifier: MIT
// Created by Yu-Chen Song on 2022/9/16 https://www.linkedin.com/in/yu-chen-song-08892a77/
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../interfaces/IFactoryERC721PayWithEther.sol";

contract stubERC721 is IFactoryERC721PayWithEther, Ownable, ERC721Enumerable {
    using MerkleProof for bytes32[];

    uint256 public constant MAX_TOTAL_TOKEN_MINT = 200;

    uint256 public latestMintedId;

    uint256 constant public PRICE = 0.0001 ether;

    bool private isBlindBoxOpened = false;
    string private BLIND_BOX_URI;

    bool private isMetadataFrozen = false;
    string private contractDataURI;

    string private metadataURI;

    event Withdraw(address _address, uint256 balance);
    event SetContractDataURI(string _contractDataURI);
    event SetURI(string _uri);
    event MetadataFrozen();
    event BlindBoxOpened();
    event Mint(address _address, uint256 tokenId);

    constructor(
        string memory _contractDataURI,
        string memory _blindBoxURI,
        string memory _uri
    ) ERC721("Alliance C", "ALLIC") {
        require(keccak256(abi.encodePacked(_contractDataURI)) != keccak256(abi.encodePacked("")), "init from empty uri");
        require(keccak256(abi.encodePacked(_blindBoxURI)) != keccak256(abi.encodePacked("")), "init from empty uri");
        contractDataURI = _contractDataURI;
        BLIND_BOX_URI = _blindBoxURI;
        metadataURI = _uri;
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");

        if (isBlindBoxOpened) {
            return string(abi.encodePacked(metadataURI, Strings.toString(_tokenId), ".json"));
        }
        return BLIND_BOX_URI;
    }

    /// @dev https://docs.opensea.io/docs/contract-level-metadata
    function contractURI() public view returns (string memory) {
        return contractDataURI;
    }

    function setContractDataURI(string memory _contractDataURI) external onlyOwner {
        contractDataURI = _contractDataURI;
        emit SetContractDataURI(_contractDataURI);
    }

    function setURI(string memory _uri) external onlyOwner {
        require(!isMetadataFrozen, "URI Already Frozen");
        metadataURI = _uri;
        emit SetURI(_uri);
    }

    function metadataFrozen() external onlyOwner {
        isMetadataFrozen = true;
        emit MetadataFrozen();
    }

    function blindBoxOpened() external onlyOwner {
        isBlindBoxOpened = true;
        emit BlindBoxOpened();
    }

    function withdraw(address _address, uint256 _amount) external onlyOwner override {
        require(_amount > 0, "Amount cannot be 0");
        require(payable(_address).send(_amount), "Fail to withdraw");
        emit Withdraw(_address, _amount);
    }

    function mint(uint256 _numberTokens) canMint(_numberTokens) external payable override {
        uint256 amount = _numberTokens * PRICE;
        require(amount <= msg.value, "Sent value is not enough");

        uint256 id = latestMintedId + 1;

        latestMintedId += _numberTokens;

        for (uint256 i = 0; i < _numberTokens; i++) {
            _safeMint(msg.sender, id + i);
            emit Mint(msg.sender, id + i);
        }
    }

    modifier canMint(uint256 _amount) {
        require(_amount > 0, "Number tokens cannot be 0");
        require(latestMintedId + _amount <= MAX_TOTAL_TOKEN_MINT, "Over maximum minted amount");
        _;
    }
}
