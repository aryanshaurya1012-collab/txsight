import { isAddress } from "@solana/kit";
import {
  TransferIntent,
  SecurityCheckResult,
  SecurityVerdict,
  InspectionReport,
  SimulationResult,
  ValidationContext,
} from "../../types/transaction";

export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const LAMPORTS_PER_SOL = 1_000_000_000n;
export const DEFAULT_FEE_LAMPORTS = 5_000n;
export const DEFAULT_RENT_BUFFER_LAMPORTS = 890_880n;

/**
 * Converts a SOL string or number amount into integer lamports.
 * Uses exact decimal string arithmetic to avoid floating-point imprecision.
 */
export function solToLamports(solAmount: string | number): bigint {
  const raw = typeof solAmount === "number" ? solAmount.toString() : solAmount.trim();

  if (!raw || !/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Invalid SOL amount format: "${solAmount}". Must be a non-negative decimal number.`);
  }

  const [wholePart, fracPart = ""] = raw.split(".");

  if (fracPart.length > 9) {
    throw new Error(`SOL amount exceeds Solana precision of 9 decimal places (lamports): "${solAmount}".`);
  }

  const paddedFrac = fracPart.padEnd(9, "0");
  const wholeLamports = BigInt(wholePart) * LAMPORTS_PER_SOL;
  const fracLamports = BigInt(paddedFrac);

  return wholeLamports + fracLamports;
}

/**
 * Converts integer lamports back to a readable SOL string.
 */
export function lamportsToSol(lamports: bigint): string {
  const isNegative = lamports < 0n;
  const abs = isNegative ? -lamports : lamports;
  const whole = abs / LAMPORTS_PER_SOL;
  const frac = abs % LAMPORTS_PER_SOL;
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  const result = fracStr ? `${whole}.${fracStr}` : `${whole}.0`;
  return isNegative ? `-${result}` : result;
}

/**
 * Validates the recipient address format and warns if it matches the sender (self-transfer).
 */
export function validateRecipientAddress(
  recipient: string,
  senderAddress?: string
): SecurityCheckResult[] {
  const results: SecurityCheckResult[] = [];

  const trimmedRecipient = recipient.trim();
  const isValidBase58Address = isAddress(trimmedRecipient);

  if (!trimmedRecipient || !isValidBase58Address) {
    results.push({
      name: "Recipient Address Format",
      description: "Verifies recipient is a valid 32-byte base58-encoded Solana address.",
      passed: false,
      severity: "CRITICAL",
      reason: `Recipient "${trimmedRecipient || "(empty)"}" is not a valid Solana base58 public key.`,
    });
    return results;
  }

  results.push({
    name: "Recipient Address Format",
    description: "Verifies recipient is a valid 32-byte base58-encoded Solana address.",
    passed: true,
    severity: "CRITICAL",
    reason: `Recipient "${trimmedRecipient}" is a valid Solana public key.`,
  });

  if (senderAddress && trimmedRecipient === senderAddress.trim()) {
    results.push({
      name: "Self-Transfer Detection",
      description: "Checks whether the recipient address is identical to the sender wallet.",
      passed: false,
      severity: "WARNING",
      reason: "Recipient address matches the sender wallet. Self-transfers consume transaction fees without moving funds.",
    });
  } else {
    results.push({
      name: "Self-Transfer Detection",
      description: "Checks whether the recipient address is identical to the sender wallet.",
      passed: true,
      severity: "INFO",
      reason: "Recipient is distinct from the sender wallet.",
    });
  }

  return results;
}

/**
 * Verifies that the sender address matches the currently connected wallet.
 */
export function validateSenderWallet(
  sender: string,
  connectedWalletAddress: string
): SecurityCheckResult {
  const trimmedSender = sender.trim();
  const trimmedConnected = connectedWalletAddress.trim();

  if (!isAddress(trimmedSender) || !isAddress(trimmedConnected)) {
    return {
      name: "Sender Wallet Authorization",
      description: "Verifies sender address matches the currently authenticated wallet.",
      passed: false,
      severity: "CRITICAL",
      reason: "Invalid sender address or connected wallet address.",
    };
  }

  if (trimmedSender !== trimmedConnected) {
    return {
      name: "Sender Wallet Authorization",
      description: "Verifies sender address matches the currently authenticated wallet.",
      passed: false,
      severity: "CRITICAL",
      reason: `Sender mismatch: transfer requested for "${trimmedSender}", but connected wallet is "${trimmedConnected}".`,
    };
  }

  return {
    name: "Sender Wallet Authorization",
    description: "Verifies sender address matches the currently authenticated wallet.",
    passed: true,
    severity: "CRITICAL",
    reason: "Sender address matches the connected wallet.",
  };
}

/**
 * Verifies that the program ID is strictly the native Solana System Program.
 */
export function validateProgramId(programId?: string): SecurityCheckResult {
  const targetProgram = (programId ?? SYSTEM_PROGRAM_ID).trim();

  if (targetProgram !== SYSTEM_PROGRAM_ID) {
    return {
      name: "Program ID Whitelist",
      description: "Verifies instructions target strictly the native Solana System Program (11111111111111111111111111111111).",
      passed: false,
      severity: "CRITICAL",
      reason: `Unauthorized program ID "${targetProgram}". Native SOL transfers must target strictly "${SYSTEM_PROGRAM_ID}".`,
    };
  }

  return {
    name: "Program ID Whitelist",
    description: "Verifies instructions target strictly the native Solana System Program (11111111111111111111111111111111).",
    passed: true,
    severity: "CRITICAL",
    reason: `Target program verified as native Solana System Program (${SYSTEM_PROGRAM_ID}).`,
  };
}

/**
 * Verifies transfer amount positivity, wallet balance sufficiency, and rent/fee buffers.
 */
export function validateTransferAmount(
  amount: string | number,
  senderBalanceLamports: bigint,
  estimatedFeeLamports: bigint = DEFAULT_FEE_LAMPORTS,
  rentBufferLamports: bigint = DEFAULT_RENT_BUFFER_LAMPORTS
): { checks: SecurityCheckResult[]; amountLamports: bigint | null } {
  const checks: SecurityCheckResult[] = [];
  let amountLamports: bigint | null = null;

  // 1. Amount positivity check
  try {
    amountLamports = solToLamports(amount);
    if (amountLamports <= 0n) {
      checks.push({
        name: "Transfer Amount Positivity",
        description: "Verifies transfer amount is greater than zero.",
        passed: false,
        severity: "CRITICAL",
        reason: "Transfer amount must be strictly greater than 0 SOL.",
      });
      return { checks, amountLamports: null };
    }

    checks.push({
      name: "Transfer Amount Positivity",
      description: "Verifies transfer amount is greater than zero.",
      passed: true,
      severity: "CRITICAL",
      reason: `Transfer amount is valid: ${lamportsToSol(amountLamports)} SOL (${amountLamports.toString()} lamports).`,
    });
  } catch (error) {
    checks.push({
      name: "Transfer Amount Positivity",
      description: "Verifies transfer amount is greater than zero.",
      passed: false,
      severity: "CRITICAL",
      reason: error instanceof Error ? error.message : "Invalid transfer amount format.",
    });
    return { checks, amountLamports: null };
  }

  // 2. Balance and fee sufficiency check
  const totalRequiredLamports = amountLamports + estimatedFeeLamports;
  if (senderBalanceLamports < totalRequiredLamports) {
    checks.push({
      name: "Balance and Fee Sufficiency",
      description: "Verifies wallet balance covers transfer amount and transaction fee.",
      passed: false,
      severity: "CRITICAL",
      reason: `Insufficient balance: available ${lamportsToSol(senderBalanceLamports)} SOL, but required ${lamportsToSol(totalRequiredLamports)} SOL (${lamportsToSol(amountLamports)} SOL transfer + ${lamportsToSol(estimatedFeeLamports)} SOL network fee).`,
    });
  } else {
    checks.push({
      name: "Balance and Fee Sufficiency",
      description: "Verifies wallet balance covers transfer amount and transaction fee.",
      passed: true,
      severity: "CRITICAL",
      reason: `Balance of ${lamportsToSol(senderBalanceLamports)} SOL is sufficient for ${lamportsToSol(amountLamports)} SOL transfer and ${lamportsToSol(estimatedFeeLamports)} SOL network fee.`,
    });
  }

  // 3. Rent-exempt buffer warning check
  const remainingLamports = senderBalanceLamports - totalRequiredLamports;
  if (senderBalanceLamports >= totalRequiredLamports && remainingLamports < rentBufferLamports) {
    checks.push({
      name: "Rent-Exempt Reserve Buffer",
      description: "Verifies wallet retains recommended reserve buffer for rent exemption and subsequent fees.",
      passed: false,
      severity: "WARNING",
      reason: `Remaining balance after transfer will be ${lamportsToSol(remainingLamports)} SOL, which is below the recommended reserve buffer (${lamportsToSol(rentBufferLamports)} SOL). The account may have difficulty executing future transactions without a deposit.`,
    });
  } else if (senderBalanceLamports >= totalRequiredLamports) {
    checks.push({
      name: "Rent-Exempt Reserve Buffer",
      description: "Verifies wallet retains recommended reserve buffer for rent exemption and subsequent fees.",
      passed: true,
      severity: "INFO",
      reason: `Remaining balance after transfer (${lamportsToSol(remainingLamports)} SOL) comfortably satisfies the reserve threshold.`,
    });
  }

  return { checks, amountLamports };
}

/**
 * Pure deterministic verdict evaluator.
 * Strict rule: Never allow warnings or failures on critical checks to yield READY.
 */
export function evaluateSecurityVerdict(
  checks: SecurityCheckResult[],
  simulationResult?: SimulationResult
): SecurityVerdict {
  // Any critical check failure => BLOCKED
  const hasCriticalFailure = checks.some((c) => c.severity === "CRITICAL" && !c.passed);
  if (hasCriticalFailure) {
    return "BLOCKED";
  }

  // Simulation failure => BLOCKED
  if (simulationResult && simulationResult.status === "failed") {
    return "BLOCKED";
  }

  // Any warning check failure => WARNING
  const hasWarningFailure = checks.some((c) => c.severity === "WARNING" && !c.passed);
  if (hasWarningFailure) {
    return "WARNING";
  }

  return "READY";
}

/**
 * Produces a complete InspectionReport given a TransferIntent, ValidationContext, and optional SimulationResult.
 */
export function generateInspectionReport(
  intent: TransferIntent,
  context: ValidationContext,
  simulationResult?: SimulationResult
): InspectionReport {
  const checks: SecurityCheckResult[] = [];

  // 1. Recipient checks
  const recipientChecks = validateRecipientAddress(intent.recipient, context.senderAddress);
  checks.push(...recipientChecks);

  // 2. Sender wallet check
  const senderCheck = validateSenderWallet(context.senderAddress, context.senderAddress);
  checks.push(senderCheck);

  // 3. Program ID check
  const programCheck = validateProgramId(context.programId);
  checks.push(programCheck);

  // 4. Amount, balance, fee, rent buffer checks
  const fee = context.estimatedFeeLamports ?? DEFAULT_FEE_LAMPORTS;
  const rentBuffer = context.rentExemptBufferLamports ?? DEFAULT_RENT_BUFFER_LAMPORTS;
  const amountValidation = validateTransferAmount(
    intent.amount,
    context.senderBalanceLamports,
    fee,
    rentBuffer
  );
  checks.push(...amountValidation.checks);

  // 5. Pre-sign simulation check if simulation was executed
  if (simulationResult) {
    if (simulationResult.status === "failed") {
      checks.push({
        name: "Pre-Sign Simulation",
        description: "Pre-execution simulation on Solana Devnet.",
        passed: false,
        severity: "CRITICAL",
        reason: simulationResult.error || "Simulation failed on Devnet.",
      });
    } else if (simulationResult.status === "success") {
      checks.push({
        name: "Pre-Sign Simulation",
        description: "Pre-execution simulation on Solana Devnet.",
        passed: true,
        severity: "INFO",
        reason: `Simulation passed successfully on Devnet (${simulationResult.unitsConsumed?.toString() ?? 0} compute units consumed, ${simulationResult.logs.length} log lines).`,
      });
    } else {
      checks.push({
        name: "Pre-Sign Simulation",
        description: "Pre-execution simulation on Solana Devnet.",
        passed: true,
        severity: "INFO",
        reason: "Simulation skipped.",
      });
    }
  }

  const verdict = evaluateSecurityVerdict(checks, simulationResult);

  return {
    verdict,
    checks,
    simulationResult,
  };
}

/**
 * Alias for generateInspectionReport for Phase 3 API compatibility.
 */
export const validateTransactionIntent = generateInspectionReport;
