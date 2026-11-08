import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "TxSight | Understand before you sign",
  description: "AI-powered transaction safety copilot for Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--text-primary))] antialiased selection:bg-[hsl(var(--accent))] selection:text-[hsl(var(--accent-foreground))]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
