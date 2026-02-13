// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title CryptoTrailNFT — UUPS Upgradeable ERC-721 on Base L2
/// @notice Free-mint NFT awarded to players who complete Crypto Trail
/// @dev Deployed behind an ERC1967 proxy. Owner = 0x15E916FbAF9762F1344e0544ecdadA62d2Face15
contract CryptoTrailNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ── STORAGE ──────────────────────────────────────────────
    uint256 private _nextTokenId;
    uint256 public maxMintsPerWallet; // 0 = unlimited
    bool public mintingEnabled;

    struct GameResult {
        uint256 score;
        uint8 classId;     // 0=Dev, 1=Trader, 2=Influencer, 3=VC
        uint8 survivors;   // 0-4
        uint16 daysPlayed;
        uint64 mintedAt;
    }

    mapping(uint256 => GameResult) public gameResults;
    mapping(address => uint256) public mintCount;

    // ── EVENTS ───────────────────────────────────────────────
    event GameNFTMinted(
        address indexed player,
        uint256 indexed tokenId,
        uint256 score,
        uint8 classId,
        uint8 survivors,
        uint16 daysPlayed
    );

    event MintingToggled(bool enabled);
    event MaxMintsUpdated(uint256 newMax);

    // ── ERRORS ───────────────────────────────────────────────
    error MintingDisabled();
    error MaxMintsReached();
    error InvalidClassId();
    error InvalidSurvivors();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (called once via proxy)
    /// @param owner_ The owner wallet (treasury)
    function initialize(address owner_) public initializer {
        __ERC721_init("Crypto Trail", "CTRAIL");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __Ownable_init(owner_);
        _nextTokenId = 1;
        maxMintsPerWallet = 0; // 0 = unlimited
        mintingEnabled = true;
    }

    // ── MINT (free — gas only) ───────────────────────────────

    /// @notice Mint a Crypto Trail NFT. Free — player pays gas only (~$0.01 on Base).
    /// @param score     Final game score
    /// @param classId   Player class (0=Dev, 1=Trader, 2=Influencer, 3=VC)
    /// @param survivors Number of surviving party members (0-4)
    /// @param daysPlayed Total days on the trail
    /// @param tokenURI_ Base64 data URI of the generated 8-bit NFT image
    /// @return tokenId  The minted token ID
    function mint(
        uint256 score,
        uint8 classId,
        uint8 survivors,
        uint16 daysPlayed,
        string calldata tokenURI_
    ) external returns (uint256) {
        if (!mintingEnabled) revert MintingDisabled();
        if (maxMintsPerWallet > 0 && mintCount[msg.sender] >= maxMintsPerWallet) revert MaxMintsReached();
        if (classId > 3) revert InvalidClassId();
        if (survivors > 4) revert InvalidSurvivors();

        uint256 tokenId = _nextTokenId++;
        mintCount[msg.sender]++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        gameResults[tokenId] = GameResult({
            score: score,
            classId: classId,
            survivors: survivors,
            daysPlayed: daysPlayed,
            mintedAt: uint64(block.timestamp)
        });

        emit GameNFTMinted(msg.sender, tokenId, score, classId, survivors, daysPlayed);

        return tokenId;
    }

    // ── ADMIN ────────────────────────────────────────────────

    /// @notice Toggle minting on/off
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingToggled(enabled);
    }

    /// @notice Update max mints per wallet
    function setMaxMintsPerWallet(uint256 newMax) external onlyOwner {
        maxMintsPerWallet = newMax;
        emit MaxMintsUpdated(newMax);
    }

    /// @notice Withdraw any accidental ETH sent to contract
    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    // ── UUPS UPGRADE AUTHORIZATION ──────────────────────────

    /// @dev Only owner can authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ── VIEW FUNCTIONS ──────────────────────────────────────

    /// @notice Get the game result for a token
    function getGameResult(uint256 tokenId) external view returns (GameResult memory) {
        _requireOwned(tokenId);
        return gameResults[tokenId];
    }

    /// @notice Get total supply of minted NFTs
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Returns the rarity tier string based on score
    function getRarity(uint256 score) external pure returns (string memory) {
        if (score >= 6000) return "Legendary";
        if (score >= 4000) return "Epic";
        if (score >= 2000) return "Rare";
        return "Common";
    }

    // ── REQUIRED OVERRIDES ──────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
