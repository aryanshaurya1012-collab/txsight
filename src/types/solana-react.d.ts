import { client } from "@/solana/client";
import { Client, ReactiveActionSource, Address } from "@solana/kit";

type DefaultClient = typeof client;

declare module "@solana/react" {
  export function useClient<TClient extends object = DefaultClient>(): Client<TClient>;
  export function useRequest<T = { value?: bigint | number }>(
    source: ReactiveActionSource<T> | null | undefined,
    options?: unknown
  ): {
    data: T | undefined;
    error: unknown;
    refresh: (...args: unknown[]) => void;
    status: "disabled" | "error" | "fetching" | "success" | "pending";
  };
}

declare module "@wallet-standard/base" {
  interface WalletAccount {
    readonly address: Address;
  }
}

declare module "@wallet-standard/ui" {
  interface UiWalletAccount {
    readonly address: Address;
  }
}

declare module "@solana/rpc-api" {
  export type GetBalanceApi = {
    getBalance(
      address: Address | string,
      config?: Readonly<{
        commitment?: import("@solana/rpc-types").Commitment;
        minContextSlot?: import("@solana/rpc-types").Slot;
      }>
    ): import("@solana/rpc-types").SolanaRpcResponse<import("@solana/rpc-types").Lamports>;
  };
}
