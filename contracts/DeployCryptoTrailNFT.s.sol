// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./CryptoTrailNFT.sol";

/// @notice Deploy CryptoTrailNFT behind a UUPS proxy on Base mainnet
/// @dev Usage:
///   forge script contracts/DeployCryptoTrailNFT.s.sol:DeployCryptoTrailNFT \
///     --rpc-url https://mainnet.base.org \
///     --broadcast --verify \
///     --etherscan-api-key $BASESCAN_API_KEY
contract DeployCryptoTrailNFT is Script {
    address constant OWNER = 0x15E916FbAF9762F1344e0544ecdadA62d2Face15;

    function run() external {
        vm.startBroadcast();

        // 1. Deploy implementation
        CryptoTrailNFT implementation = new CryptoTrailNFT();

        // 2. Deploy proxy with initialize() call
        bytes memory initData = abi.encodeWithSelector(
            CryptoTrailNFT.initialize.selector,
            OWNER
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        vm.stopBroadcast();

        console.log("Implementation:", address(implementation));
        console.log("Proxy (use this):", address(proxy));
    }
}
