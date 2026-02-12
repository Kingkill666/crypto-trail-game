// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CryptoTrailPayment
/// @notice Accepts game entry fee payments and forwards them to the treasury.
///         Using a contract call (instead of a raw ETH transfer) avoids
///         "untrusted address" warnings from wallet transaction scanners.
contract CryptoTrailPayment {
    address public immutable owner;

    event GameEntry(address indexed player, uint256 amount, uint256 timestamp);

    error NoPayment();
    error NotOwner();
    error TransferFailed();

    constructor(address _owner) {
        owner = _owner;
    }

    /// @notice Pay the game entry fee. ETH is forwarded to the treasury immediately.
    function payEntry() external payable {
        if (msg.value == 0) revert NoPayment();

        emit GameEntry(msg.sender, msg.value, block.timestamp);

        // Forward ETH to treasury
        (bool sent, ) = owner.call{value: msg.value}("");
        if (!sent) revert TransferFailed();
    }

    /// @notice Emergency withdraw in case ETH gets stuck
    function withdraw() external {
        if (msg.sender != owner) revert NotOwner();
        (bool sent, ) = owner.call{value: address(this).balance}("");
        if (!sent) revert TransferFailed();
    }
}
