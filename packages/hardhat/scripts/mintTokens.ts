const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const talismanWallet = new ethers.Wallet("0xecc471898fd1ecad87731ff76ab3eaf3c0d2937c3d3832dc5f8c76b1a8ee00a3", provider);

  const tokenAddress = "0x82745827D0B8972eC0583B3100eCb30b81Db0072";
  const token = await ethers.getContractAt("UTMCoin", tokenAddress);

  console.log("Talisman address:", talismanWallet.address);
  console.log("Token owner:", await token.owner());

  // Encode mint function data
  const iface = new ethers.Interface([
    "function mint(address to, uint256 amount)"
  ]);
  const amountToMint = 100000n * 10n ** 12n;
  const data = iface.encodeFunctionData("mint", [talismanWallet.address, amountToMint]);

  console.log("\nMinting", amountToMint.toString(), "UTMCoin...");

  // Send transaction
  const tx = await talismanWallet.sendTransaction({
    to: tokenAddress,
    data: data,
    gasLimit: 2000000n,
    gasPrice: 25000000n
  });
  console.log("Transaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Minted! Block:", receipt.blockNumber);

  const balance = await token.balanceOf(talismanWallet.address);
  console.log("\nTalisman UTMCoin balance:", (balance / 10n**12n).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
