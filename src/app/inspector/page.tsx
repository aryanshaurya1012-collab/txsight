"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import {
  Search,
  Sparkles,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  FileCode,
  Layers,
  Cpu,
  Coins,
} from "lucide-react";

/**
 * Framer Motion Animation Variants
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15,
    },
  },
};

const card3DHover = {
  whileHover: {
    scale: 1.015,
    y: -4,
    boxShadow:
      "0 20px 40px -10px rgba(0,0,0,0.7), 0 0 25px 2px rgba(153,69,255,0.18)",
  },
  transition: { duration: 0.25 },
};

interface InspectedAnalysis {
  explanation: string;
  status: "success" | "failed";
  feeSol: number;
  programs: string[];
  slot?: number;
}

export default function InspectorPage() {
  const [signature, setSignature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawTxData, setRawTxData] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<InspectedAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleSignature = "5WwqmWbcsXqEzcYvHKVRoR1tPPpJXQ1JgPKB2sRbfZ88W1VoVuaKHzK3fEYkhpbnc6vUuVydcs1hnhYGNWp7FRTQ";

  const handleCopyJson = () => {
    if (!rawTxData) return;
    navigator.clipboard.writeText(JSON.stringify(rawTxData, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInspect = async () => {
    setErrorMsg(null);
    const trimmedSig = signature.trim();

    if (!trimmedSig) {
      const msg = "Please enter a transaction signature to inspect.";
      setErrorMsg(msg);
      toast.error("Input Required", { description: msg });
      return;
    }

    setIsLoading(true);
    setRawTxData(null);
    setAnalysis(null);

    try {
      // 1. Query Solana Devnet RPC for parsed transaction
      const rpcResponse = await fetch("https://api.devnet.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [
            trimmedSig,
            {
              encoding: "jsonParsed",
              maxSupportedTransactionVersion: 0,
            },
          ],
        }),
      });

      const rpcJson = await rpcResponse.json();

      if (rpcJson.error) {
        throw new Error(rpcJson.error.message || "Failed to query Devnet RPC.");
      }

      if (!rpcJson.result) {
        throw new Error(
          "Transaction not found on Solana Devnet. Please verify the signature or wait if it was just broadcast."
        );
      }

      const txResult = rpcJson.result;
      setRawTxData(txResult);

      // 2. Send transaction data to AI analysis route for plain-English synthesis
      const aiResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "historical",
          signature: trimmedSig,
          txData: txResult,
        }),
      });

      if (!aiResponse.ok) {
        const aiErr = await aiResponse.json().catch(() => null);
        throw new Error(aiErr?.error || "AI Inspector failed to analyze transaction.");
      }

      const aiData: InspectedAnalysis = await aiResponse.json();
      setAnalysis(aiData);

      toast.success("Transaction Inspected Successfully!", {
        description: `Status: ${aiData.status.toUpperCase()} | Slot: ${aiData.slot ?? "Confirmed"}`,
      });
    } catch (err) {
      console.error("Inspector error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to inspect transaction signature.";
      setErrorMsg(message);
      toast.error("Inspection Failed", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-solana-mesh relative overflow-x-hidden">
      {/* Floating ambient glowing radial orbs */}
      <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-[#9945FF]/18 rounded-full blur-[120px] pointer-events-none -z-10 solana-orb-1" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-[#14F195]/14 rounded-full blur-[130px] pointer-events-none -z-10 solana-orb-2" />
      <div className="absolute -bottom-24 left-12 w-[450px] h-[450px] bg-[#9945FF]/14 rounded-full blur-[110px] pointer-events-none -z-10 solana-orb-1" />

      {/* Shared Global Navigation */}
      <Navbar />

      {/* Main Container */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 py-10 space-y-8"
      >
        {/* Top Header Card */}
        <motion.div
          variants={cardVariants}
          {...card3DHover}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-[#14F195] border border-[#14F195]/30 font-medium">
                  On-Chain Forensic AI
                </span>
                <span className="text-xs font-mono text-[hsl(var(--text-secondary))]">
                  Solana Devnet
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Search className="w-6 h-6 text-[#14F195]" />
                Transaction Signature Inspector
              </h1>
              <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
                Paste any Solana transaction signature to fetch on-chain state and unpack instruction actions with Gemini AI.
              </p>
            </div>
          </div>

          {/* Signature Input Bar */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[hsl(var(--text-secondary))] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#14F195]" />
                Try Devnet signature:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSignature(sampleSignature);
                  setErrorMsg(null);
                }}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-[#14F195]/40 transition-all duration-300 font-mono truncate max-w-xs"
              >
                {sampleSignature.slice(0, 12)}...{sampleSignature.slice(-12)}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => {
                    setSignature(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) handleInspect();
                  }}
                  disabled={isLoading}
                  placeholder="Paste 64-byte Solana transaction signature (e.g., 5WwqmWb...)"
                  className="w-full bg-black/40 border border-white/10 focus:border-[#14F195]/60 focus:ring-1 focus:ring-[#14F195]/50 rounded-xl px-4 py-3 text-white placeholder-[hsl(var(--text-secondary))] font-mono text-sm transition-all duration-300 focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleInspect}
                disabled={isLoading || !signature.trim()}
                className="gradient-sweep bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#9945FF] text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(20,241,149,0.35)] hover:shadow-[0_0_25px_rgba(20,241,149,0.5)] flex items-center justify-center gap-2 flex-shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Inspecting...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-black" />
                    <span>Inspect Signature</span>
                  </>
                )}
              </motion.button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-sm text-rose-300 backdrop-blur-sm transition-all duration-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <span className="font-mono text-xs">{errorMsg}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results Grid (Raw Data & Gemini AI Analysis) */}
        {(rawTxData || isLoading) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gemini AI Analysis Panel */}
            <motion.div
              variants={cardVariants}
              {...card3DHover}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <h2 className="text-sm font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#14F195]" />
                    Gemini AI Analysis
                  </h2>
                  {analysis && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                        analysis.status === "success"
                          ? "bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/40 shadow-[0_0_12px_rgba(20,241,149,0.25)]"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                      }`}
                    >
                      {analysis.status}
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="space-y-3 animate-pulse py-4">
                    <div className="h-4 bg-white/10 rounded-md w-3/4" />
                    <div className="h-4 bg-white/10 rounded-md w-full" />
                    <div className="h-4 bg-white/10 rounded-md w-5/6" />
                    <div className="h-10 bg-white/5 rounded-xl border border-white/5 mt-4" />
                  </div>
                ) : analysis ? (
                  <div className="space-y-4 check-item-enter">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/10 text-sm text-gray-100 leading-relaxed font-sans shadow-inner">
                      {analysis.explanation}
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <span className="text-[10px] text-[hsl(var(--text-secondary))] block uppercase tracking-wider">
                          Slot
                        </span>
                        <span className="text-white font-semibold font-mono">
                          {analysis.slot?.toLocaleString() ?? "N/A"}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <span className="text-[10px] text-[hsl(var(--text-secondary))] block uppercase tracking-wider">
                          Network Fee
                        </span>
                        <span className="text-[#14F195] font-semibold font-mono flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {analysis.feeSol.toFixed(6)} SOL
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-[hsl(var(--text-secondary))] block uppercase tracking-wider">
                          Programs Invoked
                        </span>
                        <span className="text-white font-semibold font-mono">
                          {analysis.programs.length} Program(s)
                        </span>
                      </div>
                    </div>

                    {/* Program Labels */}
                    {analysis.programs.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] text-[hsl(var(--text-secondary))] font-medium flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#9945FF]" />
                          Invoked Program IDs
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.programs.map((pid, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300"
                              title={pid}
                            >
                              {pid.length > 16 ? `${pid.slice(0, 6)}...${pid.slice(-6)}` : pid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Explorer Button */}
              {rawTxData && (
                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--text-secondary))] font-mono">
                    Cluster: Solana Devnet
                  </span>
                  <a
                    href={`https://explorer.solana.com/tx/${signature.trim()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#14F195] hover:underline transition-all"
                  >
                    View on Solana Explorer
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </motion.div>

            {/* Raw On-Chain Data Panel */}
            <motion.div
              variants={cardVariants}
              {...card3DHover}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h2 className="text-sm font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#9945FF]" />
                  Raw On-Chain Data (JSON)
                </h2>
                {rawTxData && (
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-all font-mono"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#14F195]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 bg-black/60 rounded-xl p-4 border border-white/10 overflow-auto max-h-[460px] font-mono text-xs leading-relaxed text-gray-300 shadow-inner">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20 text-[hsl(var(--text-secondary))] gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#14F195]" />
                    <span>Fetching transaction from Devnet RPC...</span>
                  </div>
                ) : rawTxData ? (
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(rawTxData, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center py-20 text-[hsl(var(--text-secondary))]">
                    No transaction data loaded.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.main>
    </div>
  );
}

