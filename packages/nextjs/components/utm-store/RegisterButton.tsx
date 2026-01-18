"use client";

import { notification } from "~~/utils/scaffold-eth/notification";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

export const RegisterButton = () => {
  const { address, isConnected } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "UTMCoin",
  });

  const handleRegister = async () => {
    try {
      await writeContractAsync({
        functionName: "register",
        args: [],
      });
      notification.success("You've received 1000 UTMCoin!");
    } catch (error) {
      console.error("Registration error:", error);
      notification.error("Failed to register. You may have already claimed.");
    }
  };

  if (!isConnected) {
    return null;
  }

  const hasClaimed = false;

  return (
    <button className="btn btn-primary" onClick={handleRegister} disabled={hasClaimed} type="button">
      {hasClaimed ? "Already Registered" : "Claim 1000 UTMCoin"}
    </button>
  );
};
