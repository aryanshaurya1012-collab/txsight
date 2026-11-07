"use client";

import { useClient, useRequest } from "@solana/react";
import { useMemo } from "react";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";

export function BalancePanel() {
  const client = useClient();
  const connected = useConnectedWallet(client);
  
  const source = useMemo(() => {
    if (!connected) return null;
    return client.rpc.getBalance(connected.account.address, { commitment: 'confirmed' });
  }, [client, connected]);

  const { data, status, refresh } = useRequest(source);

  if (!connected) return null;

  return (
    <div className="glass-panel p-6 flex flex-col gap-2 transition-all">
      <h3 className="text-sm font-medium text-[hsl(var(--text-secondary))] uppercase tracking-wider">Available Balance</h3>
      <div className="flex items-end gap-2">
        {status === "fetching" || status === "pending" ? (
          <div className="h-8 w-24 bg-[hsl(var(--surface-secondary))] rounded animate-pulse" />
        ) : status === "error" ? (
          <span className="text-red-400 text-sm">Failed to load</span>
        ) : (
          <>
            <span className="text-3xl font-bold text-white">
              {data?.value ? (Number(data.value) / 1e9).toFixed(4) : "0.0000"}
            </span>
            <span className="text-lg text-[hsl(var(--accent))] font-medium mb-1">SOL</span>
          </>
        )}
      </div>
      <button 
        onClick={refresh} 
        disabled={status === "fetching"}
        className="text-xs text-[hsl(var(--text-secondary))] hover:text-white transition-colors w-fit mt-2"
      >
        Refresh Balance
      </button>
    </div>
  );
}
