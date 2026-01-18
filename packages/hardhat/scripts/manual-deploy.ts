import hre from "hardhat";
import { ethers } from "hardhat";

const main = async () => {
  console.log("Deploying UTM Store contracts to local network...");

  const [owner, addr1, addr2] = await hre.ethers.getSigners();

  console.log("Deployer (admin):", owner.address);
  console.log("Test user 1:", addr1.address);
  console.log("Test user 2:", addr2.address);

  const UTMCoin = await hre.ethers.deployContract("UTMCoin", owner);
  await UTMCoin.waitForDeployment();

  const utmStore = await hre.ethers.deployContract("UTMStore", UTMCoin.target, owner);
  await utmStore.waitForDeployment();

  console.log("\n=== Contracts Deployed Successfully ===");
  console.log("UTMCoin address:", UTMCoin.target);
  console.log("UTMStore address:", utmStore.target);

  console.log("\n=== Setting up initial products ===");

  await utmStore.setProduct(1, ethers.parseUnits("50", 12), true);
  await utmStore.setProduct(2, ethers.parseUnits("75", 12), true);
  await utmStore.setProduct(3, ethers.parseUnits("100", 12), true);
  await utmStore.setProduct(4, ethers.parseUnits("25", 12), true);
  await utmStore.setProduct(5, ethers.parseUnits("35", 12), true);
  await utmStore.setProduct(6, ethers.parseUnits("15", 12), true);

  console.log("\n=== Products configured ===");
  console.log("1: UTM Cap - 50 UTMCoin");
  console.log("2: UTM T-Shirt - 75 UTMCoin");
  console.log("3: UTM Hoodie - 100 UTMCoin");
  console.log("4: UTM Mug - 25 UTMCoin");
  console.log("5: UTM Notebook - 35 UTMCoin");
  console.log("6: UTM Sticker Pack - 15 UTMCoin");

  console.log("\n=== Verifying deployments ===");

  const ownerBalance = await UTMCoin.balanceOf(owner.address);
  const addr1Balance = await UTMCoin.balanceOf(addr1.address);

  console.log("Owner balance:", ethers.formatUnits(ownerBalance, 12));
  console.log("User 1 balance:", ethers.formatUnits(addr1Balance, 12));

  console.log("\n=== Deployment Complete ===");
  console.log("\nNext steps:");
  console.log("1. The frontend can now use these contracts");
  console.log("2. Update packages/nextjs/contracts/deployedContracts.ts manually:");
  console.log("");
  console.log('export const deployedContracts = {');
  console.log('  [31337] = {');
  console.log('    address: "' + utmStore.target + '",');
  console.log('    abi: ' + JSON.stringify(JSON.parse(UTMCoin.interface.formatJson()), null, 2) + ",");
  console.log("  },");
  console.log('  [420420420] = {');
  console.log('    address: "' + UTMCoin.target + '",');
  console.log('    abi: ' + JSON.stringify(JSON.parse(UTMCoin.interface.formatJson()), null, 2));
  console.log("  },");
  console.log("};");
};

main()
  .catch(error => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
