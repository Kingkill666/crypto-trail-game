// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "./CryptoTrailRewards.sol";

contract AddBRNDToken is Script {
    function run() external {
        address rewardsContract = 0x05B36Ca96630BD18808b84B9114B5919849Fab0D;
        address brndToken = 0x41Ed0311640A5e489A90940b1c33433501a21B07;

        vm.startBroadcast();

        CryptoTrailRewards rewards = CryptoTrailRewards(rewardsContract);
        rewards.addToken(brndToken);

        console.log("BRND token added to whitelist");
        console.log("Token address:", brndToken);
        console.log("Balance in contract:", rewards.tokenBalance(brndToken));

        vm.stopBroadcast();
    }
}
