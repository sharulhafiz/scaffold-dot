import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title UTMModule
 * @dev Deployment module for UTM Store system
 *      Deploys UTMCoin (ERC20 token) and UTMStore (marketplace)
 *      Uses account 1 (MetaMask wallet) as the owner for both contracts
 */
const UTMModule = buildModule("UTMModule", (m) => {
  const owner = m.getAccount(1); // MetaMask wallet: 0x9ddaF7f82EE540ebF01a0FE11fbF251E30fD0373
  const utmCoin = m.contract("UTMCoin", [owner]);
  const utmStore = m.contract("UTMStore", [utmCoin, owner]);

  return { utmCoin, utmStore };
});

export default UTMModule;
