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
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col gap-2 transition-all duration-300 shadow-xl">
      <h3 className="text-sm font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Available Balance</h3>
      <div className="flex items-end gap-2">
        {status === "fetching" || status === "pending" ? (
          <div className="h-8 w-28 bg-white/10 rounded-lg animate-pulse" />
        ) : status === "error" ? (
          <span className="text-rose-400 text-sm font-mono">Failed to load</span>
        ) : (
          <>
            <span className="text-3xl font-bold text-white font-mono tracking-tight">
              {data?.value ? (Number(data.value) / 1e9).toFixed(4) : "0.0000"}
            </span>
            <span className="text-lg text-[#14F195] font-semibold mb-1 font-mono">SOL</span>
          </>
        )}
      </div>
      <button
        onClick={refresh}
        disabled={status === "fetching"}
        className="text-xs text-[hsl(var(--text-secondary))] hover:text-[#14F195] transition-all duration-300 w-fit mt-2 font-mono"
      >
        Refresh Balance
      </button>
    </div>
  );
}
