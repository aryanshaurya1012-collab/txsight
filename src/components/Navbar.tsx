"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { WalletPanel } from "@/components/WalletPanel";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-[#0b091a]/70 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] shadow-[0_0_15px_rgba(20,241,149,0.35)] group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text">
              TxSight
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`flex items-center gap-1.5 transition-colors duration-300 ${
                pathname === "/"
                  ? "text-[#14F195] font-semibold"
                  : "text-[hsl(var(--text-secondary))] hover:text-white"
              }`}
            >
              {pathname === "/" && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
              )}
              Dashboard
            </Link>
            <Link
              href="/inspector"
              className={`flex items-center gap-1.5 transition-colors duration-300 ${
                pathname === "/inspector"
                  ? "text-[#14F195] font-semibold"
                  : "text-[hsl(var(--text-secondary))] hover:text-white"
              }`}
            >
              {pathname === "/inspector" && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
              )}
              Inspector
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-amber-300 uppercase tracking-wider">Devnet</span>
          </div>
          <WalletPanel />
        </div>
      </div>
    </nav>
  );
}

