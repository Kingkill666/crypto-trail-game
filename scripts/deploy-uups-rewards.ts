import { ethers, upgrades } from "hardhat";

const OWNER_ADDRESS = process.env.OWNER_PRIVATE_KEY
  ? new ethers.Wallet(process.env.OWNER_PRIVATE_KEY).address
  : "0x15E916FbAF9762F1344e0544ecdadA62d2Face15"; // Crypto Trail owner

async function main() {
  console.log("🚀 Deploying CryptoTrailRewards (UUPS Upgradeable) to Base mainnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer wallet:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("ETH Balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.001")) {
    console.error("❌ Insufficient balance! Need at least 0.001 ETH for deployment.");
    process.exit(1);
  }

  // Verify deployer is the expected owner
  if (deployer.address.toLowerCase() !== OWNER_ADDRESS.toLowerCase()) {
    console.log("⚠️  WARNING: Deployer wallet does not match expected Crypto Trail owner!");
    console.log("Expected:", OWNER_ADDRESS);
    console.log("Got:     ", deployer.address);
    console.log("\nContinuing anyway in 3 seconds... (Ctrl+C to cancel)\n");
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Deploy the UUPS proxy + implementation
  console.log("Deploying CryptoTrailRewards (proxy + implementation)...\n");

  const CryptoTrailRewards = await ethers.getContractFactory("CryptoTrailRewards");

  // Deploy with UUPS proxy pattern
  const proxy = await upgrades.deployProxy(
    CryptoTrailRewards,
    [OWNER_ADDRESS], // initialize(address _owner)
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n✅ Contract deployed successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Proxy Address (USE THIS):    ", proxyAddress);
  console.log("Implementation Address:      ", implementationAddress);
  console.log("Owner:                       ", OWNER_ADDRESS);
  console.log("Network:                      Base Mainnet");
  console.log("Proxy Pattern:                UUPS (Upgradeable)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📋 Next steps:");
  console.log(`1. Add to Vercel environment variables:`);
  console.log(`   NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS="${proxyAddress}"`);
  console.log(`\n2. Set REWARDS_SIGNER_PRIVATE_KEY in Vercel to the same as OWNER_PRIVATE_KEY`);
  console.log(`   (since you're using Option 2: owner = signer)`);
  console.log(`\n3. Verify the proxy on BaseScan:`);
  console.log(`   npx hardhat verify --network base ${proxyAddress}`);
  console.log(`\n4. Fund the contract with sponsored tokens (transfer to ${proxyAddress})`);
  console.log(`\n5. Configure sponsored tokens using configureToken()`);
  console.log(`   - Example: contract.configureToken("BETR POKER CHAMPION", "0xBETRTokenAddress")`);

  console.log("\n\n🔧 UPGRADEABILITY:");
  console.log("- You can add/remove collaborations using configureToken() and removeToken()");
  console.log("- To upgrade contract logic: npx hardhat run scripts/upgrade-rewards.ts");
  console.log("- Players can still claim rewards after upgrades");
  console.log("- All claimed rewards are permanently recorded\n");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    proxyAddress,
    implementationAddress,
    owner: OWNER_ADDRESS,
    network: "base",
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "contracts/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to contracts/deployment.json");
}

main().catch((error) => {
  console.error("\n❌ Deployment error:");
  console.error(error);
  process.exitCode = 1;
});
