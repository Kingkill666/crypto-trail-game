// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CheckTokenBalances is Script {
    function run() external view {
        address rewardsContract = 0x05B36Ca96630BD18808b84B9114B5919849Fab0D;

        // Token addresses based on trail events
        address brnd = 0x41Ed0311640A5e489A90940b1c33433501a21B07;
        address betr = address(0); // TODO: Find BETR address
        address dau = address(0);  // TODO: Find DAU address
        address pizza = address(0); // TODO: Find PIZZA address
        address jesse = address(0); // TODO: Find Jesse/Base related token
        address qr = address(0);    // TODO: Find QR address

        console.log("=== TOKEN BALANCES IN REWARDS CONTRACT ===");
        console.log("Contract:", rewardsContract);
        console.log("");

        // Check BRND
        if (brnd != address(0)) {
            uint256 brndBal = IERC20(brnd).balanceOf(rewardsContract);
            string memory brndSym = IERC20Metadata(brnd).symbol();
            console.log("Token:", brnd);
            console.log("  Symbol:", brndSym);
            console.log("  Balance:", brndBal);
            console.log("");
        }

        // Try common token addresses on Base
        address[] memory commonTokens = new address[](10);
        commonTokens[0] = 0x532f27101965dd16442E59d40670FaF5eBB142E4; // BRETT
        commonTokens[1] = 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed; // DEGEN
        commonTokens[2] = 0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe; // HIGHER
        commonTokens[3] = 0x6921B130D297cc43754afba22e5EAc0FBf8Db75b; // DOGINME
        commonTokens[4] = 0x4a3636C97Da92DDf2c854BBf64a3e3B0C0d09D3c; // SPEC
        commonTokens[5] = 0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9; // BSWAP
        commonTokens[6] = 0x0C92B8cd43F3A91C8DE4d2C5eF2CB1D0C1B35F01; // BASED
        commonTokens[7] = 0x532f27101965dd16442E59d40670FaF5eBB142E4; // BRETT (duplicate check)
        commonTokens[8] = 0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42; // EURC
        commonTokens[9] = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // USDC

        console.log("Checking common Base tokens for non-zero balances...");
        console.log("");

        for (uint i = 0; i < commonTokens.length; i++) {
            try IERC20(commonTokens[i]).balanceOf(rewardsContract) returns (uint256 bal) {
                if (bal > 0) {
                    try IERC20Metadata(commonTokens[i]).symbol() returns (string memory sym) {
                        console.log("Token:", commonTokens[i]);
                        console.log("  Symbol:", sym);
                        console.log("  Balance:", bal);
                        console.log("");
                    } catch {}
                }
            } catch {}
        }
    }
}
