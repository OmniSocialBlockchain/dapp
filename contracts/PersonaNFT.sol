// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PersonaNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Persona {
        string name;
        string imageURI;
        string description;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Persona) public personas;
    mapping(address => uint256) public activePersona;

    event PersonaCreated(uint256 indexed tokenId, address indexed owner, string name);
    event PersonaActivated(uint256 indexed tokenId, address indexed owner);

    constructor() ERC721("OmniSocial Persona", "OSP") Ownable(msg.sender) {}

    function createPersona(
        string memory name,
        string memory imageURI,
        string memory description
    ) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, imageURI);

        personas[newTokenId] = Persona({
            name: name,
            imageURI: imageURI,
            description: description,
            createdAt: block.timestamp,
            isActive: false
        });

        emit PersonaCreated(newTokenId, msg.sender, name);
        return newTokenId;
    }

    function activatePersona(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!personas[tokenId].isActive, "Persona already active");

        personas[tokenId].isActive = true;
        activePersona[msg.sender] = tokenId;

        emit PersonaActivated(tokenId, msg.sender);
    }

    function getPersona(uint256 tokenId) public view returns (Persona memory) {
        return personas[tokenId];
    }

    function getActivePersona(address user) public view returns (uint256) {
        return activePersona[user];
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }
} 