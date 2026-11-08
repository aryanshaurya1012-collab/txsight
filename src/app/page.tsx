"use client";

import { useState } from "react";
import { useClient, useSignAndSendTransaction } from "@solana/react";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { address, getBase58Decoder } from "@solana/kit";
import { BalancePanel } from "@/components/BalancePanel";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  Activity,
  TerminalSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Clock,
  ArrowUpRight,
  Cpu,
  Wallet,
} from "lucide-react";
import {
  inspectAndSimulateTransfer,
  buildTransferTransactionBytes,
} from "@/lib/solana/transfer";
import { solToLamports } from "@/lib/security/validator";
import {
  AIAnalysisResult,
  InspectionReport,
  TransferIntent,
  ValidationContext,
} from "@/types/transaction";

export interface ParsedIntent {
  amount: string;
  recipient: string;
  memo?: string;
}

export interface ActivityItem {
  id: string;
  type: "TRANSFER_SOL";
  amount: string;
  recipient: string;
  signature: string;
  timestamp: Date;
  status: "confirmed" | "failed";
}

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

/**
 * Calls the backend Gemini AI analysis endpoint to extract intent and generate safety explanations.
 */
async function analyzeIntentWithAI(prompt: string): Promise<AIAnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to analyze transaction with Gemini AI.");
  }

  return data as AIAnalysisResult;
}

/**
 * Subcomponent to isolate useSignAndSendTransaction hook call with a guaranteed non-null account.
 */
function ExecuteButton({
  account,
  onExecute,
  isExecuting,
  verdict,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  account: any;
  onExecute: (
    signAndSend: (input: { transaction: Uint8Array }) => Promise<{ signature: Uint8Array }>
  ) => Promise<void>;
  isExecuting: boolean;
  verdict: "READY" | "WARNING";
}) {
  const signAndSendTransaction = useSignAndSendTransaction(account, "solana:devnet");

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onExecute(signAndSendTransaction)}
      disabled={isExecuting}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${verdict === "WARNING"
          ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
          : "gradient-sweep bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#9945FF] text-black hover:brightness-110 shadow-[0_0_25px_rgba(20,241,149,0.45)] animate-pulse"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isExecuting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-black" />
          <span>Signing & Sending...</span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-4 h-4 text-black" />
          <span>Sign & Execute Transaction</span>
        </>
      )}
    </motion.button>
  );
}

export default function Dashboard() {
  const client = useClient();
  const connected = useConnectedWallet(client);

  // State Management
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [lastParsedIntent, setLastParsedIntent] = useState<ParsedIntent | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const resetAnalysisState = () => {
    if (report) setReport(null);
    if (aiExplanation) setAiExplanation(null);
    if (errorMsg) setErrorMsg(null);
    if (successMsg) setSuccessMsg(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    resetAnalysisState();
  };

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    resetAnalysisState();
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setErrorMsg('Please enter a transaction prompt, e.g. "Send 0.05 SOL to <address>".');
      return;
    }

    setIsAnalyzing(true);
    try {
      // 1. Parse intent and risk explanation with Gemini AI
      const aiData = await analyzeIntentWithAI(trimmedInput);
      setAiExplanation(aiData.explanation);

      const parsed: ParsedIntent = {
        amount: aiData.amount.toString(),
        recipient: aiData.recipient,
      };
      setLastParsedIntent(parsed);

      // 2. Fetch current sender balance from Devnet RPC if connected, or use sandbox balance
      let balanceLamports = 2_000_000_000n; // 2.0 SOL demo sandbox balance
      const senderAddress = connected
        ? connected.account.address
        : "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

      if (connected) {
        try {
          const balanceResp = await client.rpc
            .getBalance(address(connected.account.address), { commitment: "confirmed" })
            .send();
          balanceLamports = balanceResp.value;
        } catch (balErr) {
          console.warn("Could not fetch balance from Devnet RPC, defaulting to 0:", balErr);
          balanceLamports = 0n;
        }
      }

      // 3. Construct ValidationContext & TransferIntent
      const context: ValidationContext = {
        senderAddress,
        senderBalanceLamports: balanceLamports,
      };

      const intent: TransferIntent = {
        action: "transfer_sol",
        recipient: parsed.recipient,
        amount: parsed.amount,
      };

      // 4. Run through deterministic security validator & pre-sign Devnet simulation
      const inspectionReport = await inspectAndSimulateTransfer(intent, context, client);
      setReport(inspectionReport);
    } catch (err) {
      console.error("Analysis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze transaction intent.";
      setErrorMsg(message);
      toast.error("Analysis Error", {
        description: message,
      });
      setReport(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecute = async (
    signAndSend: (input: { transaction: Uint8Array }) => Promise<{ signature: Uint8Array }>
  ) => {
    if (!connected || !report || !lastParsedIntent) return;
    setIsExecuting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const amountLamports = solToLamports(lastParsedIntent.amount);
      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();

      const transactionBytes = buildTransferTransactionBytes({
        sender: connected.account.address,
        recipient: lastParsedIntent.recipient,
        amountLamports,
        latestBlockhash,
      });

      const { signature } = await signAndSend({
        transaction: transactionBytes,
      });

      const signatureBase58 = getBase58Decoder().decode(signature);

      const newActivity: ActivityItem = {
        id: signatureBase58,
        type: "TRANSFER_SOL",
        amount: lastParsedIntent.amount,
        recipient: lastParsedIntent.recipient,
        signature: signatureBase58,
        timestamp: new Date(),
        status: "confirmed",
      };

      setActivities((prev) => [newActivity, ...prev]);
      setSuccessMsg(`Transaction successfully confirmed on Devnet! Signature: ${signatureBase58.slice(0, 8)}...${signatureBase58.slice(-8)}`);
      setReport(null);

      // Trigger rich Web3 toast notification
      toast.success("Transaction Confirmed on Solana Devnet!", {
        description: (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-mono text-gray-300">
              Transferred <strong className="text-white">{lastParsedIntent.amount} SOL</strong> to{" "}
              <span className="font-mono text-gray-200">{lastParsedIntent.recipient.slice(0, 4)}...{lastParsedIntent.recipient.slice(-4)}</span>
            </span>
            <a
              href={`https://explorer.solana.com/tx/${signatureBase58}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#14F195] hover:underline flex items-center gap-1 mt-0.5"
            >
              View on Solana Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ),
        duration: 8000,
      });
    } catch (err) {
      console.error("Execution error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to sign or submit transaction.";
      setErrorMsg(errMsg);
      toast.error("Transaction Failed", {
        description: errMsg,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-solana-mesh relative overflow-x-hidden">
      {/* Floating ambient glowing radial orbs for 3D depth */}
      <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-[#9945FF]/18 rounded-full blur-[120px] pointer-events-none -z-10 solana-orb-1" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-[#14F195]/14 rounded-full blur-[130px] pointer-events-none -z-10 solana-orb-2" />
      <div className="absolute -bottom-24 left-12 w-[450px] h-[450px] bg-[#9945FF]/14 rounded-full blur-[110px] pointer-events-none -z-10 solana-orb-1" />

      {/* Navigation Bar */}
      <Navbar />

      {/* Main Dashboard Animated Container */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column: Balance & Transaction Input */}
        <div className="lg:col-span-2 space-y-6">
          <BalancePanel />

          {/* Transaction Request Panel */}
          <motion.div
            variants={cardVariants}
            {...card3DHover}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="pb-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TerminalSquare className="w-5 h-5 text-[#14F195]" />
                  Transaction Request
                </h2>
                <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
                  Describe your intended transaction in natural English. TxSight inspects safety before you sign.
                </p>
              </div>
            </div>

            <div className="pt-5">
              {/* Sample prompt quick chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3.5">
                <span className="text-xs text-[hsl(var(--text-secondary))] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#14F195]" />
                  Try prompt:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectSample("Send 0.01 SOL to 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4x5bPPxEdZZ")
                  }
                  className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-[#14F195]/40 transition-all duration-300 font-mono shadow-sm"
                >
                  0.01 SOL to Devnet Test
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectSample("Send 50 SOL to So11111111111111111111111111111111111111112")
                  }
                  className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-rose-500/40 transition-all duration-300 font-mono shadow-sm"
                >
                  50 SOL (Insufficient Balance Test)
                </button>
              </div>

              {/* Textarea with dynamic glowing animated border while analyzing */}
              <textarea
                value={inputText}
                onChange={handleTextChange}
                disabled={isAnalyzing}
                className={`w-full h-32 bg-black/40 border rounded-xl p-4 text-white placeholder-[hsl(var(--text-secondary))] focus:outline-none resize-none transition-all duration-300 font-mono text-sm leading-relaxed ${isAnalyzing
                    ? "analyzing-border-glow cursor-wait"
                    : "border-white/10 focus:border-[#14F195]/60 focus:ring-1 focus:ring-[#14F195]/50 hover:border-white/20"
                  }`}
                placeholder="e.g., Send 0.01 SOL to 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4x5bPPxEdZZ"
              />

              {errorMsg && (
                <div className="mt-3 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-sm text-rose-300 backdrop-blur-sm transition-all duration-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-xs">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mt-3 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-sm text-emerald-300 backdrop-blur-sm transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-xs">{successMsg}</span>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xs text-[hsl(var(--text-secondary))] flex items-center gap-1.5 font-medium">
                  <Cpu className="w-4 h-4 text-[#9945FF]" />
                  Gemini 1.5 Flash Copilot + Solana System Guard
                </span>

                <div className="flex items-center gap-2">
                  {isAnalyzing ? (
                    <button
                      disabled
                      className="flex items-center gap-2 bg-white/10 text-gray-300 px-6 py-2.5 rounded-xl font-medium cursor-wait border border-white/10 shadow-[0_0_15px_rgba(153,69,255,0.2)] transition-all duration-300"
                    >
                      <Loader2 className="w-4 h-4 animate-spin text-[#14F195]" />
                      Analyzing with AI...
                    </button>
                  ) : report?.verdict === "BLOCKED" ? (
                    <button
                      disabled
                      className="flex items-center gap-2 bg-rose-950/70 text-rose-300 border border-rose-500/50 px-6 py-2.5 rounded-xl font-medium cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      Transaction Blocked
                    </button>
                  ) : report &&
                    (report.verdict === "READY" || report.verdict === "WARNING") &&
                    connected ? (
                    <ExecuteButton
                      account={connected.account}
                      onExecute={handleExecute}
                      isExecuting={isExecuting}
                      verdict={report.verdict}
                    />
                  ) : report &&
                    (report.verdict === "READY" || report.verdict === "WARNING") &&
                    !connected ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        toast.info("Wallet Connection Required to Broadcast", {
                          description:
                            "Please connect your Solana Devnet wallet via the top-right button to sign and broadcast this transaction on-chain.",
                        });
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-semibold hover:brightness-110 px-6 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_18px_rgba(153,69,255,0.35)] hover:shadow-[0_0_25px_rgba(20,241,149,0.5)]"
                    >
                      <Wallet className="w-4 h-4 text-black" />
                      Connect Wallet to Execute
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAnalyze}
                      disabled={!inputText.trim() || isAnalyzing}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-semibold hover:brightness-110 px-6 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(153,69,255,0.35)] hover:shadow-[0_0_25px_rgba(20,241,149,0.5)]"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      Analyze Intent
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: AI Analysis, Security Checks & Activity */}
        <div className="space-y-6">
          {/* AI ANALYSIS PANEL */}
          <motion.div
            variants={cardVariants}
            {...card3DHover}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#14F195]" />
                AI Analysis
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-[#14F195] border border-[#14F195]/30 shadow-[0_0_10px_rgba(20,241,149,0.15)] font-medium">
                Gemini 1.5 Flash
              </span>
            </div>

            {isAnalyzing ? (
              <div className="space-y-3 animate-pulse py-2">
                <div className="h-4 bg-white/10 rounded-md w-3/4" />
                <div className="h-4 bg-white/10 rounded-md w-full" />
                <div className="h-4 bg-white/10 rounded-md w-1/2" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5" />
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5" />
                </div>
              </div>
            ) : aiExplanation ? (
              <div className="space-y-3 check-item-enter">
                <div className="p-4 bg-black/30 rounded-xl border border-white/10 text-sm text-gray-200 leading-relaxed font-sans shadow-inner">
                  {aiExplanation}
                </div>
                {lastParsedIntent && (
                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] text-[hsl(var(--text-secondary))] block uppercase tracking-wider">
                        Target Amount
                      </span>
                      <span className="text-white font-semibold font-mono text-sm">{lastParsedIntent.amount} SOL</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] text-[hsl(var(--text-secondary))] block uppercase tracking-wider">
                        Recipient
                      </span>
                      <span
                        className="text-white font-semibold truncate block font-mono text-sm"
                        title={lastParsedIntent.recipient}
                      >
                        {lastParsedIntent.recipient
                          ? `${lastParsedIntent.recipient.slice(0, 4)}...${lastParsedIntent.recipient.slice(-4)}`
                          : "None"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
                <p className="text-xs text-[hsl(var(--text-secondary))] px-4 leading-relaxed">
                  Enter a transfer request and click <span className="text-white font-medium">&quot;Analyze Intent&quot;</span> to extract intent and review risk explanation with Gemini AI.
                </p>
              </div>
            )}
          </motion.div>

          {/* DYNAMIC SECURITY CHECKS PANEL */}
          <motion.div
            variants={cardVariants}
            {...card3DHover}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider">
                  Security Checks
                </h3>
                {report && !connected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-[#14F195] border border-[#14F195]/30">
                    Sandbox
                  </span>
                )}
              </div>
              {report && (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-mono font-bold tracking-wide uppercase transition-all duration-300 ${report.verdict === "READY"
                      ? "bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/40 shadow-[0_0_15px_rgba(20,241,149,0.25)]"
                      : report.verdict === "WARNING"
                        ? "bg-amber-400/15 text-amber-300 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                        : "bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    }`}
                >
                  {report.verdict}
                </span>
              )}
            </div>

            <ul className="space-y-3">
              {report ? (
                report.checks.map((check, i) => {
                  let Icon = CheckCircle2;
                  let iconColor = "text-[#14F195]";

                  if (!check.passed) {
                    if (check.severity === "CRITICAL") {
                      Icon = XCircle;
                      iconColor = "text-rose-400";
                    } else {
                      Icon = AlertTriangle;
                      iconColor = "text-amber-400";
                    }
                  }

                  return (
                    <li
                      key={i}
                      style={{ animationDelay: `${i * 70}ms` }}
                      className="check-item-enter flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all duration-300"
                    >
                      <div className={`mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                        <Icon className="w-4 h-4 drop-shadow-[0_0_8px_currentColor]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-200">{check.name}</span>
                        {check.reason && (
                          <span className="text-xs text-[hsl(var(--text-secondary))] mt-0.5 leading-relaxed font-mono">
                            {check.reason}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                [
                  "Devnet network validation",
                  "Recipient address formatting",
                  "Balance & fee sufficiency",
                  "Transaction simulation",
                  "Instruction footprint check",
                ].map((check, i) => (
                  <li key={i} className="flex items-start gap-3 p-1.5 transition-all duration-300">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                    </div>
                    <span className="text-sm text-gray-300">{check}</span>
                  </li>
                ))
              )}
            </ul>

            {report?.simulationResult && report.simulationResult.status !== "skipped" && (
              <div className="mt-5 pt-4 border-t border-white/10 text-xs text-[hsl(var(--text-secondary))] flex items-center justify-between font-mono">
                <span>Simulation: {report.simulationResult.status}</span>
                <span className="text-[#14F195] font-semibold">{report.simulationResult.unitsConsumed?.toString() ?? 0} CU consumed</span>
              </div>
            )}
          </motion.div>

          {/* DYNAMIC RECENT ACTIVITY PANEL */}
          <motion.div
            variants={cardVariants}
            {...card3DHover}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <h3 className="text-sm font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#9945FF]" />
              Recent Activity
            </h3>

            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/10 rounded-xl">
                <span className="text-[hsl(var(--text-secondary))] text-sm">No transactions yet.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-black/30 border border-white/10 rounded-xl flex flex-col gap-2 transition-all duration-300 hover:border-[#14F195]/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#14F195]" />
                        Sent {item.amount} SOL
                      </span>
                      <span className="text-[10px] font-mono text-[#14F195] bg-[#14F195]/10 px-2 py-0.5 rounded-md border border-[#14F195]/30">
                        Confirmed
                      </span>
                    </div>

                    <div className="text-[11px] text-[hsl(var(--text-secondary))] truncate font-mono">
                      To: {item.recipient.slice(0, 6)}...{item.recipient.slice(-6)}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] text-[hsl(var(--text-secondary))]">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      <a
                        href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#14F195] hover:underline flex items-center gap-0.5 font-mono font-medium"
                      >
                        Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
