"use client";

import { ClientProvider } from "@solana/react";
import { client } from "@/solana/client";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClientProvider client={client}>
      {children}
      <Toaster position="top-right" richColors theme="dark" closeButton />
    </ClientProvider>
  );
}

