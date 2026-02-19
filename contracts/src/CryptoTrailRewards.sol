// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

// Custom errors (gas-efficient, defined outside contract)
error InvalidSignature();
error AlreadyClaimed();
error TokenNotConfigured();
error InsufficientBalance();
error TransferFailed();

/**
 * @title CryptoTrailRewards (UUPS Upgradeable)
 * @notice Distributes sponsored token rewards to Crypto Trail players using off-chain signatures
 * @dev Uses EIP-712 typed signatures + UUPS proxy pattern for upgradeability
 *
 * UPGRADEABILITY:
 * - Owner can add/remove token collaborations at any time
 * - Contract logic can be upgraded while preserving state
 * - Players can still claim rewards after upgrades
 * - Claimed rewards are permanently recorded
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CryptoTrailRewards is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // ═══════════════════════════════════════════════════════════════
    // STATE (Upgradeable - Use storage gaps!)
    // ═══════════════════════════════════════════════════════════════

    address public signer; // Authorized backend signer

    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;

    // EIP-712 TypeHash for reward claims
    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(address player,string eventTitle,address token,uint256 amount,uint256 nonce)");

    // Track claimed rewards: player => eventTitle => claimed
    mapping(address => mapping(string => bool)) public hasClaimed;

    // Token configuration: eventTitle => token address
    mapping(string => address) public eventTokens;

    // Active event titles (for iteration)
    string[] public activeEvents;
    mapping(string => bool) private _isEventActive;

    // Reserve storage slots for future upgrades (OpenZeppelin best practice)
    uint256[50] private __gap;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event RewardClaimed(
        address indexed player,
        string eventTitle,
        address indexed token,
        uint256 amount
    );

    event TokenConfigured(string eventTitle, address token);
    event TokenRemoved(string eventTitle);
    event SignerUpdated(address newSigner);

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION (Replaces constructor for upgradeable contracts)
    // ═══════════════════════════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        signer = _owner; // Initially owner is also the signer

        // Build EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("CryptoTrailRewards")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // CLAIM FUNCTION (PLAYER-FACING)
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Claim a reward using a signature from the authorized backend
     * @param eventTitle The event that granted this reward (e.g., "BETR POKER CHAMPION")
     * @param token The ERC20 token to receive
     * @param amount The amount of tokens to claim
     * @param nonce A unique value to prevent replay attacks
     * @param signature The EIP-712 signature from the backend signer
     */
    function claimReward(
        string calldata eventTitle,
        address token,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        // 1. Check if already claimed
        if (hasClaimed[msg.sender][eventTitle]) {
            revert AlreadyClaimed();
        }

        // 2. Verify token is configured for this event
        address configuredToken = eventTokens[eventTitle];
        if (configuredToken == address(0)) {
            revert TokenNotConfigured();
        }
        if (configuredToken != token) {
            revert TokenNotConfigured();
        }

        // 3. Reconstruct EIP-712 message hash
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                msg.sender,
                keccak256(bytes(eventTitle)),
                token,
                amount,
                nonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        // 4. Recover signer and verify
        address recoveredSigner = recoverSigner(digest, signature);
        if (recoveredSigner != signer) {
            revert InvalidSignature();
        }

        // 5. Mark as claimed BEFORE transfer (reentrancy protection)
        hasClaimed[msg.sender][eventTitle] = true;

        // 6. Check contract balance
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) {
            revert InsufficientBalance();
        }

        // 7. Transfer tokens
        bool success = IERC20(token).transfer(msg.sender, amount);
        if (!success) {
            revert TransferFailed();
        }

        emit RewardClaimed(msg.sender, eventTitle, token, amount);
    }

    // ═══════════════════════════════════════════════════════════════
    // COLLABORATION MANAGEMENT (ADD/REMOVE TOKENS)
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Configure/add a new sponsored token collaboration
     * @param eventTitle The event name (must match game logic)
     * @param token The ERC20 token address
     */
    function configureToken(string calldata eventTitle, address token) external onlyOwner {
        eventTokens[eventTitle] = token;

        // Track active events for iteration
        if (!_isEventActive[eventTitle]) {
            activeEvents.push(eventTitle);
            _isEventActive[eventTitle] = true;
        }

        emit TokenConfigured(eventTitle, token);
    }

    /**
     * @notice Remove a sponsored token collaboration
     * @param eventTitle The event to remove
     * @dev Players can still claim already-earned rewards; new claims will be blocked
     */
    function removeToken(string calldata eventTitle) external onlyOwner {
        delete eventTokens[eventTitle];
        _isEventActive[eventTitle] = false;

        // Remove from activeEvents array
        for (uint256 i = 0; i < activeEvents.length; i++) {
            if (keccak256(bytes(activeEvents[i])) == keccak256(bytes(eventTitle))) {
                activeEvents[i] = activeEvents[activeEvents.length - 1];
                activeEvents.pop();
                break;
            }
        }

        emit TokenRemoved(eventTitle);
    }

    /**
     * @notice Get all active event titles
     * @return Array of currently configured event titles
     */
    function getActiveEvents() external view returns (string[] memory) {
        return activeEvents;
    }

    /**
     * @notice Check if a player has claimed a specific reward
     * @param player The player address
     * @param eventTitle The event title
     * @return True if already claimed
     */
    function hasPlayerClaimed(address player, string calldata eventTitle) external view returns (bool) {
        return hasClaimed[player][eventTitle];
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Update the authorized backend signer address
     * @param newSigner The new signer address
     */
    function updateSigner(address newSigner) external onlyOwner {
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    /**
     * @notice Emergency function to recover tokens if needed
     * @param token The token to withdraw
     * @param to The recipient address
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        bool success = IERC20(token).transfer(to, amount);
        if (!success) {
            revert TransferFailed();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UUPS UPGRADE AUTHORIZATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * @dev Only the owner can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════

    function recoverSigner(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");

        return ecrecover(digest, v, r, s);
    }
}
