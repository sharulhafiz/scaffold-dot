"use client";

import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { getProductById } from "~~/utils/utm-store/products";
import { notification } from "~~/utils/scaffold-eth/notification";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const { data: utmStoreInfo } = useDeployedContractInfo({ contractName: "UTMStore" });

  const { data: ownerData } = useScaffoldReadContract({
    contractName: "UTMStore",
    functionName: "owner",
  });

  const { data: storeStats } = useScaffoldReadContract({
    contractName: "UTMStore",
    functionName: "getStoreStats",
  });

  const { data: tokenBalance } = useScaffoldReadContract({
    contractName: "UTMCoin",
    functionName: "balanceOf",
    args: [address],
  });

  const { data: contractBalance } = useScaffoldReadContract({
    contractName: "UTMCoin",
    functionName: "balanceOf",
    args: [utmStoreInfo?.address],
  });

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useScaffoldEventHistory({
    contractName: "UTMStore",
    eventName: "ItemPurchased",
    fromBlock: 0n,
  });

  const { writeContractAsync: writeStoreAsync } = useScaffoldWriteContract({
    contractName: "UTMStore",
  });

  useEffect(() => {
    if (ownerData && address) {
      setIsOwner(address.toLowerCase() === (ownerData as Address).toLowerCase());
    }
  }, [ownerData, address]);

  const formatPolkadotBalance = (bal: bigint | undefined) => {
    if (bal === undefined) return "0";
    return (bal / 10n ** 12n).toString();
  };

  const handleWithdraw = async () => {
    const amount = withdrawAmount ? BigInt(withdrawAmount) * 10n ** 12n : 0n;

    if (amount === 0n) {
      notification.error("Please enter an amount");
      return;
    }

    try {
      await writeStoreAsync({
        functionName: "withdraw",
        args: [amount],
      });
      setWithdrawAmount("");
      notification.success(`Withdrawn ${withdrawAmount} UTMCoin`);
    } catch (error) {
      console.error("Withdrawal error:", error);
      notification.error("Failed to withdraw UTMCoin");
    }
  };

  const handleWithdrawAll = async () => {
    try {
      await writeStoreAsync({
        functionName: "withdraw",
        args: [0n],
      });
      notification.success("Withdrawn all UTMCoin");
    } catch (error) {
      console.error("Withdrawal error:", error);
      notification.error("Failed to withdraw UTMCoin");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="bg-base-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-base-content/70">Connect your admin wallet to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (ownerData && !isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="bg-error/20 rounded-xl p-8 text-center border border-error border-2">
          <h2 className="text-2xl font-bold mb-4 text-error">Access Denied</h2>
          <p className="text-base-content/70">
            You are not the contract owner. Only the admin wallet can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="bg-base-200 rounded-xl p-8 text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/70">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">UTM Store Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Store Statistics</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-base-content/60">Total Purchases</p>
              <p className="text-3xl font-bold text-primary">
                {storeStats ? (storeStats as [bigint, bigint])[0]?.toString() ?? "0" : "0"}
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">Total Revenue</p>
              <p className="text-3xl font-bold text-success">
                {storeStats ? formatPolkadotBalance((storeStats as [bigint, bigint])[1]) : "0"} UTMCoin
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">Contract Balance</p>
              <p className="text-3xl font-bold">{formatPolkadotBalance(contractBalance)} UTMCoin</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Admin Balance</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-base-content/60">Your UTMCoin Balance</p>
              <p className="text-3xl font-bold text-primary">{formatPolkadotBalance(tokenBalance)} UTM</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Withdraw Funds</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Amount to Withdraw (UTMCoin)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="input input-bordered w-full"
              />
            </div>
            <div className="flex gap-4">
              <button className="btn btn-primary flex-1" onClick={handleWithdraw} type="button">
                Withdraw
              </button>
              <button className="btn btn-secondary flex-1" onClick={handleWithdrawAll} type="button">
                Withdraw All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-base-100 rounded-xl border border-base-300 shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
        <div className="overflow-x-auto">
          {eventsError ? (
            <p className="text-error">Error loading events: {eventsError.message}</p>
          ) : events && events.length > 0 ? (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Buyer</th>
                  <th>Product</th>
                  <th>Price (UTM)</th>
                  <th>Block</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => {
                  const product = getProductById(Number(event.args?.productId ?? 0));
                  return (
                    <tr key={index}>
                      <td className="text-xs font-mono">
                        {event.transactionHash ? `${event.transactionHash.slice(0, 10)}...` : "N/A"}
                      </td>
                      <td className="font-mono text-xs">
                        {event.args?.buyer
                          ? `${event.args.buyer.slice(0, 6)}...${event.args.buyer.slice(-4)}`
                          : "N/A"}
                      </td>
                      <td>{product?.name || `Product #${event.args?.productId ?? "?"}`}</td>
                      <td className="font-bold">{formatPolkadotBalance(event.args?.price)}</td>
                      <td className="text-xs text-base-content/60">{event.blockNumber?.toString() ?? "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-base-content/70 text-center py-8">
              No transactions yet. Wait for customers to make purchases!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
