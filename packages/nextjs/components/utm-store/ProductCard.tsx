"use client";

import { useAccount } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Product } from "~~/utils/utm-store/products";
import { notification } from "~~/utils/scaffold-eth/notification";

export type ProductCardProps = {
  product: Product;
  userBalance?: bigint;
  userAllowance?: bigint;
  onBuy?: (productId: number, price: bigint) => void;
};

export const ProductCard = ({ product, userBalance, userAllowance, onBuy }: ProductCardProps) => {
  const { address } = useAccount();

  const price = BigInt(product.price) * 10n ** 12n;

  const { data: utmStoreInfo } = useDeployedContractInfo({ contractName: "UTMStore" });

  const { data: productData } = useScaffoldReadContract({
    contractName: "UTMStore",
    functionName: "getProduct",
    args: [product.id],
  });

  const { data: allowanceData } = useScaffoldReadContract({
    contractName: "UTMCoin",
    functionName: "allowance",
    args: [address, utmStoreInfo?.address],
  });

  const { writeContractAsync: writeTokenAsync } = useScaffoldWriteContract({
    contractName: "UTMCoin",
  });

  const { writeContractAsync: writeStoreAsync } = useScaffoldWriteContract({
    contractName: "UTMStore",
  });

  const isLoading = productData === undefined;
  const isActive = productData ? (productData as [bigint, boolean])[1] : false;
  const productPrice = productData ? (productData as [bigint, boolean])[0] : 0n;
  const hasEnoughBalance = userBalance !== undefined && userBalance >= price;
  const currentAllowance = allowanceData ?? userAllowance ?? 0n;
  const hasEnoughAllowance = currentAllowance >= price;

  const handleApprove = async () => {
    if (!utmStoreInfo?.address) {
      notification.error("Store contract not found");
      return;
    }

    try {
      await writeTokenAsync({
        functionName: "approve",
        args: [utmStoreInfo.address, price],
      });
      notification.success(`Approved ${price / 10n ** 12n} UTMCoin for purchase`);
    } catch (error) {
      console.error("Approval error:", error);
      notification.error("Failed to approve UTMCoin");
    }
  };

  const handleBuy = async () => {
    try {
      await writeStoreAsync({
        functionName: "purchaseItem",
        args: [product.id],
      });
      if (onBuy) {
        onBuy(product.id, price);
      }
      notification.success(`Purchased ${product.name}!`);
    } catch (error) {
      console.error("Purchase error:", error);
      notification.error("Failed to purchase item");
    }
  };

  const canBuy = hasEnoughBalance && hasEnoughAllowance && isActive;

  const formatPolkadotBalance = (bal: bigint | undefined) => {
    if (bal === undefined) return "0";
    return (bal / 10n ** 12n).toString();
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <figure className="relative aspect-square">
        <div className="absolute inset-0 bg-base-200 flex items-center justify-center">
          <span className="text-6xl">{product.image}</span>
        </div>
      </figure>
      <div className="card-body p-4">
        <h3 className="card-title text-xl font-bold">{product.name}</h3>
        <p className="text-sm text-base-content/80 mb-3">{product.description}</p>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold text-primary">
              {isLoading ? "Loading..." : `${formatPolkadotBalance(price)} UTMCoin`}
            </span>
            {userBalance !== undefined && (
              <span className="text-xs text-base-content/60">Balance: {formatPolkadotBalance(userBalance)} UTM</span>
            )}
          </div>
          {!utmStoreInfo?.address ? (
            <button className="btn btn-disabled w-full" disabled type="button">
              Store Not Deployed
            </button>
          ) : !isActive && !isLoading ? (
            <button className="btn btn-disabled w-full" disabled type="button">
              Out of Stock
            </button>
          ) : !address ? (
            <button className="btn btn-disabled w-full" disabled type="button">
              Connect Wallet
            </button>
          ) : !hasEnoughBalance ? (
            <button className="btn btn-disabled w-full" disabled type="button">
              Insufficient Balance
            </button>
          ) : !hasEnoughAllowance ? (
            <button className="btn btn-primary w-full" onClick={handleApprove} type="button">
              Approve {formatPolkadotBalance(price)} UTM
            </button>
          ) : (
            <button className="btn btn-success w-full" onClick={handleBuy} type="button">
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
