"use client";

import { useWallets, useWalletStatus, useConnectedWallet, useConnect, useDisconnect } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { Wallet, LogOut, Loader2 } from "lucide-react";

export function WalletPanel() {
  const client = useClient();
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  const phantomWallet = wallets.find((w) => w.name.toLowerCase().includes("phantom"));

  const handleConnect = async () => {
    if (phantomWallet) {
      await connect.dispatchAsync(phantomWallet);
    } else if (wallets.length > 0) {
      await connect.dispatchAsync(wallets[0]);
    } else {
      window.open("https://phantom.app/", "_blank");
    }
  };

  if (status === "pending" || status === "connecting" || status === "reconnecting") {
    return (
      <button disabled className="flex items-center gap-2 bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))] px-4 py-2 rounded-lg font-medium border border-[hsl(var(--surface-primary))]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[hsl(var(--surface-secondary))] px-3 py-1.5 rounded-lg border border-gray-800">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" />
          <span className="text-sm font-mono text-[hsl(var(--text-primary))]">
            {connected.account.address.slice(0, 4)}...{connected.account.address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect.dispatchAsync()}
          className="p-2 hover:bg-[hsl(var(--surface-secondary))] rounded-lg transition-colors text-[hsl(var(--text-secondary))] hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-opacity shadow-[0_0_15px_rgba(34,211,238,0.2)]"
    >
      <Wallet className="w-4 h-4" />
      {phantomWallet ? "Connect Phantom" : "Connect Wallet"}
    </button>
  );
}
