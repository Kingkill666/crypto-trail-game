// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title CryptoTrailRewards
/// @notice Distributes ERC-20 token rewards for sponsored trail events.
///         Owner pre-funds the contract with tokens. Server signs claim
///         authorizations. Players submit signed claims on-chain.
contract CryptoTrailRewards is Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ── STORAGE ──

    /// @notice Address whose signatures authorize claims
    address public signer;

    /// @notice Whitelisted reward tokens
    mapping(address => bool) public supportedTokens;

    /// @notice Used claim IDs (prevents replay)
    mapping(bytes32 => bool) public claimedIds;

    /// @notice Per-player per-token lifetime claimed totals
    mapping(address => mapping(address => uint256)) public totalClaimed;

    // ── EVENTS ──

    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event RewardClaimed(
        address indexed player,
        address indexed token,
        uint256 amount,
        bytes32 indexed claimId
    );
    event TokensWithdrawn(address indexed token, uint256 amount);

    // ── ERRORS ──

    error TokenNotSupported();
    error InvalidSignature();
    error AlreadyClaimed();
    error InsufficientBalance();
    error ZeroAddress();
    error ZeroAmount();
    error Expired();
    error LengthMismatch();

    // ── CONSTRUCTOR ──

    constructor(address _owner, address _signer) Ownable(_owner) {
        if (_signer == address(0)) revert ZeroAddress();
        signer = _signer;
    }

    // ── CLAIM ──

    /// @notice Claim a token reward with a server-signed authorization
    /// @param token    ERC-20 token address
    /// @param amount   Token amount (smallest unit)
    /// @param claimId  Unique claim identifier
    /// @param expiry   Signature expiry timestamp
    /// @param signature Server signature
    function claim(
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 expiry,
        bytes calldata signature
    ) external {
        _verifyClaim(msg.sender, token, amount, claimId, expiry, signature);
        _executeClaim(msg.sender, token, amount, claimId);
    }

    /// @notice Batch claim multiple rewards in one transaction
    function batchClaim(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes32[] calldata claimIds,
        uint256[] calldata expiries,
        bytes[] calldata signatures
    ) external {
        uint256 len = tokens.length;
        if (
            len != amounts.length ||
            len != claimIds.length ||
            len != expiries.length ||
            len != signatures.length
        ) revert LengthMismatch();

        for (uint256 i = 0; i < len; i++) {
            _verifyClaim(msg.sender, tokens[i], amounts[i], claimIds[i], expiries[i], signatures[i]);
            _executeClaim(msg.sender, tokens[i], amounts[i], claimIds[i]);
        }
    }

    // ── INTERNAL ──

    function _verifyClaim(
        address player,
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 expiry,
        bytes calldata signature
    ) internal view {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (amount == 0) revert ZeroAmount();
        if (claimedIds[claimId]) revert AlreadyClaimed();
        if (block.timestamp > expiry) revert Expired();

        bytes32 messageHash = keccak256(
            abi.encodePacked(player, token, amount, claimId, expiry, block.chainid, address(this))
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        if (ethSignedHash.recover(signature) != signer) revert InvalidSignature();
    }

    function _executeClaim(
        address player,
        address token,
        uint256 amount,
        bytes32 claimId
    ) internal {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        claimedIds[claimId] = true;
        totalClaimed[player][token] += amount;

        IERC20(token).safeTransfer(player, amount);

        emit RewardClaimed(player, token, amount, claimId);
    }

    // ── ADMIN ──

    function addToken(address token) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function removeToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerUpdated(signer, newSigner);
        signer = newSigner;
    }

    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
        emit TokensWithdrawn(token, amount);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(owner(), bal);
            emit TokensWithdrawn(token, bal);
        }
    }

    /// @notice Check contract balance for a token
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Withdraw any accidental ETH
    function withdrawETH() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "ETH withdraw failed");
    }
}
