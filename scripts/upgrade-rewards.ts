import { ethers, upgrades } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔄 Upgrading CryptoTrailRewards contract...\n");

  // Load deployment info
  if (!fs.existsSync("contracts/deployment.json")) {
    console.error("❌ No deployment found! Run deploy:rewards first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync("contracts/deployment.json", "utf8"));
  const proxyAddress = deploymentInfo.proxyAddress;

  console.log("Current Proxy Address:", proxyAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Upgrading from wallet:", deployer.address);

  // Get the new contract factory
  const CryptoTrailRewardsV2 = await ethers.getContractFactory("CryptoTrailRewards");

  console.log("\nUpgrading contract implementation...");

  // Upgrade the proxy to point to new implementation
  const upgraded = await upgrades.upgradeProxy(proxyAddress, CryptoTrailRewardsV2);

  await upgraded.waitForDeployment();

  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n✅ Contract upgraded successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Proxy Address (UNCHANGED):", proxyAddress);
  console.log("Old Implementation:       ", deploymentInfo.implementationAddress);
  console.log("New Implementation:       ", newImplementationAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n✨ All player claims and token configurations are preserved!");
  console.log("Players can continue claiming rewards without interruption.\n");

  // Update deployment info
  deploymentInfo.implementationAddress = newImplementationAddress;
  deploymentInfo.upgradedAt = new Date().toISOString();

  fs.writeFileSync(
    "contracts/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Updated deployment info saved to contracts/deployment.json");
}

main().catch((error) => {
  console.error("\n❌ Upgrade error:");
  console.error(error);
  process.exitCode = 1;
});
