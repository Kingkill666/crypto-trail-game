// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "./CryptoTrailRewards.sol";

/// @notice Deploy CryptoTrailRewards on Base mainnet
/// @dev Usage:
///   forge script contracts/DeployCryptoTrailRewards.s.sol:DeployCryptoTrailRewardsScript \
///     --rpc-url https://mainnet.base.org \
///     --broadcast --verify \
///     --etherscan-api-key $BASESCAN_API_KEY
contract DeployCryptoTrailRewardsScript is Script {
    address constant OWNER = 0x15E916FbAF9762F1344e0544ecdadA62d2Face15;
    // Signer can be the same as owner, or a dedicated server-side key
    address constant SIGNER = 0x15E916FbAF9762F1344e0544ecdadA62d2Face15;

    function run() external {
        vm.startBroadcast();

        CryptoTrailRewards rewards = new CryptoTrailRewards(OWNER, SIGNER);

        vm.stopBroadcast();

        console.log("CryptoTrailRewards deployed at:", address(rewards));
        console.log("Owner:", OWNER);
        console.log("Signer:", SIGNER);
        console.log("");
        console.log("Next steps:");
        console.log("  1. Add NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS= to .env.local");
        console.log("  2. Call addToken() for each sponsored token address");
        console.log("  3. Transfer ERC-20 tokens to the contract");
    }
}
