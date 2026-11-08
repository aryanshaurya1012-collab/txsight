"use client";

import { useWallets, useWalletStatus, useConnectedWallet, useConnect, useDisconnect } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useSyncExternalStore } from "react";

// Official React pattern for hydration detection without triggering cascading renders
const emptySubscribe = () => () => { };
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function WalletPanel() {
  const client = useClient();
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  const mounted = useHydrated();

  const phantomWallet = wallets.find((w) => w.name.toLowerCase().includes("phantom"));

  const handleConnect = async () => {
    try {
      if (phantomWallet) {
        await connect.dispatchAsync(phantomWallet);
      } else if (wallets.length > 0) {
        await connect.dispatchAsync(wallets[0]);
      } else {
        window.open("https://phantom.app/", "_blank");
      }
    } catch (error) {
      console.warn("Wallet connection cancelled or closed:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.dispatchAsync();
    } catch (error) {
      console.warn("Wallet disconnect failed:", error);
    }
  };

  if (!mounted || status === "pending" || status === "connecting" || status === "reconnecting") {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))] px-4 py-2 rounded-lg font-medium border border-[hsl(var(--surface-primary))] opacity-80"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
          <span className="text-sm font-mono text-white font-medium">
            {connected.account.address.slice(0, 4)}...{connected.account.address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          title="Disconnect Wallet"
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-[hsl(var(--text-secondary))] hover:text-rose-400 border border-transparent hover:border-white/10"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-semibold hover:brightness-110 active:scale-95 px-4 py-2 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(20,241,149,0.3)] hover:shadow-[0_0_20px_rgba(20,241,149,0.45)]"
    >
      <Wallet className="w-4 h-4 text-black" />
      {phantomWallet ? "Connect Phantom" : "Connect Wallet"}
    </button>
  );
}