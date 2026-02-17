// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "./AlertNotifier.sol";

contract DeployAlertNotifier is Script {
    function run() external {
        address alertWallet = 0x257Cbe89968495C3aE8C81BccB8BE7f257CD5f66;
        address rewardsContract = 0x05B36Ca96630BD18808b84B9114B5919849Fab0D;

        vm.startBroadcast();

        AlertNotifier notifier = new AlertNotifier(alertWallet, rewardsContract);

        console.log("AlertNotifier deployed at:", address(notifier));
        console.log("Alert wallet:", notifier.alertWallet());
        console.log("Rewards contract:", notifier.rewardsContract());
        console.log("");
        console.log("Next steps:");
        console.log("1. Add ALERT_NOTIFIER_CONTRACT to .env.local");
        console.log("2. Monitor events at this address on Basescan");
        console.log("3. Set up wallet notifications for LowBalanceAlert events");

        vm.stopBroadcast();
    }
}
