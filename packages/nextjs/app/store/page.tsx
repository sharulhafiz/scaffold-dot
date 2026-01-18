"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { RegisterButton } from "~~/components/utm-store/RegisterButton";
import { ProductCard } from "~~/components/utm-store/ProductCard";
import { products } from "~~/utils/utm-store/products";

export default function StorePage() {
  const { address } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: utmStoreInfo } = useDeployedContractInfo({ contractName: "UTMStore" });

  const { data: balance } = useScaffoldReadContract({
    contractName: "UTMCoin",
    functionName: "balanceOf",
    args: [address],
  });

  const { data: hasClaimed } = useScaffoldReadContract({
    contractName: "UTMCoin",
    functionName: "hasClaimed",
    args: [address],
  });

  const { data: allowanceData } = useScaffoldReadContract({
    contractName: "UTMCoin",
    functionName: "allowance",
    args: [address, utmStoreInfo?.address],
  });

  const handleBuy = (productId: number, price: bigint) => {
    setRefreshKey(prev => prev + 1);
  };

  const formatPolkadotBalance = (bal: bigint | undefined) => {
    if (bal === undefined) return "0";
    return (bal / 10n ** 12n).toString();
  };

  return (
    <div className="flex flex-col items-center gap-12">
      <div className="w-full max-w-7xl px-4 py-8">
        <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-8">UTM Merchandise Store</h1>
          <p className="text-center text-base-content/70 mb-8">
            Browse our collection of UTM-branded merchandise and purchase with UTMCoin
          </p>

          {!address ? (
            <div className="bg-base-200 rounded-xl p-8 text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Welcome to UTM Store!</h2>
              <p className="mb-6 text-base-content/80">
                Connect your wallet to start shopping and receive 1000 free UTMCoin.
              </p>
            </div>
          ) : balance === undefined ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner"></span>
            </div>
          ) : (
            <>
              <div className="bg-base-200 rounded-xl p-6 mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Your Balance</h2>
                  <p className="text-4xl font-bold text-primary">{formatPolkadotBalance(balance)} UTMCoin</p>
                </div>
                {hasClaimed === false && balance === 0n && (
                  <div className="bg-warning/20 border border-warning rounded-lg p-4">
                    <p className="text-sm font-semibold text-warning-content mb-2">
                      You have 0 UTMCoin. Claim your free 1000 coins to start shopping!
                    </p>
                    <RegisterButton />
                  </div>
                )}
                {!hasClaimed && (
                  <div className="bg-success/20 border border-success rounded-lg p-4">
                    <p className="text-sm font-semibold text-success-content mb-2">New user? Get free coins!</p>
                    <RegisterButton />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" key={refreshKey}>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userBalance={balance ?? 0n}
                    userAllowance={allowanceData ?? 0n}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
