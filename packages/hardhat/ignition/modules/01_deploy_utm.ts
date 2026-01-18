import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title UTMModule
 * @dev Deployment module for UTM Store system
 *      Deploys UTMCoin (ERC20 token) and UTMStore (marketplace)
 *      Uses account 1 (Talisman wallet) as the owner for both contracts
 */
const UTMModule = buildModule("UTMModule", (m) => {
  const owner = m.getAccount(1); // Talisman wallet: 0x2BC144311d2D21B782d5953157d4B9e1249e856B
  const utmCoin = m.contract("UTMCoin", [owner]);
  const utmStore = m.contract("UTMStore", [utmCoin, owner]);

  return { utmCoin, utmStore };
});

export default UTMModule;
