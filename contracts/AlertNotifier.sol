// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AlertNotifier
 * @notice Emits on-chain events to notify admin wallet of low token balances
 * @dev Events can be monitored via wallet notifications or block explorers
 */
contract AlertNotifier {
    address public immutable alertWallet;
    address public rewardsContract;

    event LowBalanceAlert(
        address indexed token,
        string tokenSymbol,
        uint256 claimsRemaining,
        AlertLevel level,
        uint256 timestamp
    );

    enum AlertLevel {
        WARNING,  // < 100 claims remaining
        CRITICAL  // < 50 claims remaining
    }

    constructor(address _alertWallet, address _rewardsContract) {
        alertWallet = _alertWallet;
        rewardsContract = _rewardsContract;
    }

    /**
     * @notice Emit a low balance alert event
     * @dev Called by backend when token balance drops below threshold
     */
    function emitAlert(
        address token,
        string calldata tokenSymbol,
        uint256 claimsRemaining,
        AlertLevel level
    ) external {
        emit LowBalanceAlert(
            token,
            tokenSymbol,
            claimsRemaining,
            level,
            block.timestamp
        );
    }

    /**
     * @notice Batch emit multiple alerts at once
     */
    function emitBatchAlerts(
        address[] calldata tokens,
        string[] calldata symbols,
        uint256[] calldata claimsRemaining,
        AlertLevel[] calldata levels
    ) external {
        require(
            tokens.length == symbols.length &&
            tokens.length == claimsRemaining.length &&
            tokens.length == levels.length,
            "Array length mismatch"
        );

        for (uint i = 0; i < tokens.length; i++) {
            emit LowBalanceAlert(
                tokens[i],
                symbols[i],
                claimsRemaining[i],
                levels[i],
                block.timestamp
            );
        }
    }
}
