"use client";

import { ClientProvider } from "@solana/react";
import { client } from "@/solana/client";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClientProvider client={client}>
      {children}
    </ClientProvider>
  );
}
