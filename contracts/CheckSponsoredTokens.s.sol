// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CheckSponsoredTokens is Script {
    function run() external view {
        address rewardsContract = 0x05B36Ca96630BD18808b84B9114B5919849Fab0D;

        // All sponsored token addresses
        address betr = 0x051024B653E8ec69E72693F776c41C2A9401FB07;
        address brnd = 0x41Ed0311640A5e489A90940b1c33433501a21B07;
        address dau = 0xe3A7766d0361f50a3Dd038C967479673B75f8B34;
        address jesse = 0x50F88fe97f72CD3E75b9Eb4f747F59BcEBA80d59;
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        address pizza = 0xa821f2ee19F4f62e404C934D43eB6E5763fbdb07;
        address qr = 0x2b5050F01d64FBb3e4Ac44dc07f0732BFb5ecadF;

        console.log("=== SPONSORED TOKEN BALANCES ===");
        console.log("Rewards Contract:", rewardsContract);
        console.log("");

        // Check each token
        checkToken(rewardsContract, betr, "BETR");
        checkToken(rewardsContract, brnd, "BRND");
        checkToken(rewardsContract, dau, "DAU");
        checkToken(rewardsContract, jesse, "JESSE");
        checkToken(rewardsContract, usdc, "USDC");
        checkToken(rewardsContract, pizza, "PIZZA");
        checkToken(rewardsContract, qr, "QR");
    }

    function checkToken(address rewardsContract, address token, string memory expectedSymbol) internal view {
        try IERC20(token).balanceOf(rewardsContract) returns (uint256 balance) {
            try IERC20Metadata(token).symbol() returns (string memory symbol) {
                console.log("Token:", expectedSymbol);
                console.log("  Address:", token);
                console.log("  Symbol:", symbol);
                console.log("  Balance:", balance);

                if (balance > 0) {
                    console.log("  Status: FUNDED");
                } else {
                    console.log("  Status: EMPTY");
                }
                console.log("");
            } catch {
                console.log("Token:", expectedSymbol);
                console.log("  Address:", token);
                console.log("  Error: Could not read symbol");
                console.log("");
            }
        } catch {
            console.log("Token:", expectedSymbol);
            console.log("  Address:", token);
            console.log("  Error: Could not read balance");
            console.log("");
        }
    }
}
