import { ethers } from "hardhat";

async function main() {
  const STORE_ADDRESS = "0xEC69d4f48f4f1740976968FAb9828d645Ad1d77f"; // New store address

  const products = [
    { id: 1, price: 50, name: "UTM Cap" },
    { id: 2, price: 75, name: "UTM T-Shirt" },
    { id: 3, price: 100, name: "UTM Hoodie" },
    { id: 4, price: 25, name: "UTM Mug" },
    { id: 5, price: 35, name: "UTM Notebook" },
    { id: 6, price: 15, name: "UTM Sticker Pack" },
  ];

  const store = await ethers.getContractAt("UTMStore", STORE_ADDRESS);
  const signers = await ethers.getSigners();
  const talisman = signers[1]; // Use talisman (owner)

  console.log("Initializing products on UTMStore...\n");
  console.log("Using owner:", await talisman.getAddress());
  console.log("Store owner:", await store.owner());

  const storeWithOwner = store.connect(talisman);

  for (const product of products) {
    const priceInWei = ethers.parseUnits(product.price.toString(), 12);
    console.log(`Setting product ${product.id} (${product.name}): ${product.price} UTM (${priceInWei} wei)`);

    const tx = await storeWithOwner.setProduct(product.id, priceInWei, true);
    await tx.wait();
    console.log(`  ✅ Transaction: ${tx.hash}`);
  }

  console.log("\n🎉 All products initialized successfully!");

  console.log("\nVerifying products...");
  for (const product of products) {
    const [price, isActive] = await store.getProduct(product.id);
    console.log(`  Product ${product.id}: price=${ethers.formatUnits(price, 12)} UTM, active=${isActive}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
