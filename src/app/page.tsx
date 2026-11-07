import { WalletPanel } from "@/components/WalletPanel";
import { BalancePanel } from "@/components/BalancePanel";
import { ShieldCheck, Activity, TerminalSquare, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <nav className="border-b border-[hsl(var(--surface-secondary))] bg-[hsl(var(--surface-primary))]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[hsl(var(--accent))]" />
              <span className="text-lg font-bold text-white tracking-tight">TxSight</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[hsl(var(--text-secondary))]">
              <span className="text-[hsl(var(--accent))]">Dashboard</span>
              <span className="hover:text-white cursor-not-allowed opacity-50">Inspector</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 bg-[hsl(var(--surface-secondary))] px-2.5 py-1 rounded-md border border-[hsl(var(--warning))]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--warning))]" />
              <span className="text-xs font-mono text-[hsl(var(--warning))] uppercase tracking-wider">Devnet</span>
            </div>
            <WalletPanel />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BalancePanel />
          
          <div className="glass-panel p-1">
            <div className="p-5 border-b border-[hsl(var(--surface-secondary))]">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-[hsl(var(--accent))]" />
                Transaction Request
              </h2>
              <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
                Describe the transaction you want to execute in plain English.
              </p>
            </div>
            <div className="p-5">
              <textarea 
                className="w-full h-32 bg-[hsl(var(--surface-secondary))]/50 border border-[hsl(var(--surface-secondary))] rounded-lg p-4 text-white placeholder-[hsl(var(--text-secondary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))] resize-none transition-all"
                placeholder="e.g., Send 0.01 SOL to 7NX... and verify it."
                disabled
              />
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-[hsl(var(--text-secondary))] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[hsl(var(--warning))]" />
                  AI parsing disabled for Phase 1.
                </span>
                <button disabled className="bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))] px-6 py-2 rounded-lg font-medium cursor-not-allowed">
                  Analyze Intent
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-4">Security Checks</h3>
            <ul className="space-y-4">
              {["Devnet network validation", "Recipient address formatting", "Balance & fee sufficiency", "Transaction simulation", "Instruction footprint check"].map((check, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-[hsl(var(--surface-secondary))] border border-gray-700 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]" />
                  </div>
                  <span className="text-sm text-gray-300">{check}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-[hsl(var(--surface-secondary))] rounded-lg">
              <span className="text-[hsl(var(--text-secondary))] text-sm">No transactions yet.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
