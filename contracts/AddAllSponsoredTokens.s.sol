// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "./CryptoTrailRewards.sol";

contract AddAllSponsoredTokens is Script {
    function run() external {
        address rewardsContract = 0x05B36Ca96630BD18808b84B9114B5919849Fab0D;

        // Token addresses from lib/sponsored-tokens.ts
        address betr = 0x051024B653E8ec69E72693F776c41C2A9401FB07;
        address brnd = 0x41Ed0311640A5e489A90940b1c33433501a21B07;
        address dau = 0xe3A7766d0361f50a3Dd038C967479673B75f8B34;
        address jesse = 0x50F88fe97f72CD3E75b9Eb4f747F59BcEBA80d59;
        address pizza = 0xa821f2ee19F4f62e404C934D43eB6E5763fbdb07;
        address qr = 0x2b5050F01d64FBb3e4Ac44dc07f0732BFb5ecadF;

        vm.startBroadcast();

        CryptoTrailRewards rewards = CryptoTrailRewards(rewardsContract);

        // Add each token (BRND already added, but safe to call again)
        console.log("Adding tokens to whitelist...");

        rewards.addToken(betr);
        console.log("BETR added");

        rewards.addToken(brnd);
        console.log("BRND added (already existed)");

        rewards.addToken(dau);
        console.log("DAU added");

        rewards.addToken(jesse);
        console.log("JESSE added");

        rewards.addToken(pizza);
        console.log("PIZZA added");

        rewards.addToken(qr);
        console.log("QR added");

        console.log("");
        console.log("All tokens whitelisted successfully!");

        vm.stopBroadcast();
    }
}
