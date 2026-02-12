// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "./CryptoTrailPayment.sol";

/// @notice Deploy CryptoTrailPayment on Base mainnet
/// @dev Usage:
///   forge script contracts/DeployCryptoTrailPayment.s.sol:DeployCryptoTrailPaymentScript \
///     --rpc-url https://mainnet.base.org \
///     --broadcast --verify \
///     --etherscan-api-key $BASESCAN_API_KEY
contract DeployCryptoTrailPaymentScript is Script {
    address constant OWNER = 0x15E916FbAF9762F1344e0544ecdadA62d2Face15;

    function run() external {
        vm.startBroadcast();

        CryptoTrailPayment payment = new CryptoTrailPayment(OWNER);

        vm.stopBroadcast();

        console.log("CryptoTrailPayment deployed at:", address(payment));
        console.log("Owner (treasury):", OWNER);
        console.log("");
        console.log("Add to .env.local:");
        console.log("  NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS=", address(payment));
    }
}
