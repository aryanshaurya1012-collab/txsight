import {
  address,
  isAddress,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  createNoopSigner,
  type Blockhash,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { client as defaultClient } from "../../solana/client";
import {
  solToLamports,
  generateInspectionReport,
  DEFAULT_FEE_LAMPORTS,
} from "../security/validator";
import {
  TransferIntent,
  SimulationResult,
  InspectionReport,
  ValidationContext,
} from "../../types/transaction";

export interface LatestBlockhashResult {
  blockhash: Blockhash;
  lastValidBlockHeight: bigint;
}

export interface BuildTransferParams {
  sender: string;
  recipient: string;
  amountLamports: bigint;
  latestBlockhash: LatestBlockhashResult;
}

export interface SimulatingRpcClient {
  rpc: {
    getLatestBlockhash: () => { send: () => Promise<{ value: LatestBlockhashResult }> };
    simulateTransaction: (
      wireTransaction: string,
      config: { encoding: "base64"; sigVerify: boolean }
    ) => {
      send: () => Promise<{
        value: {
          err?: unknown;
          logs?: string[] | null;
          unitsConsumed?: bigint | number | null;
          fee?: bigint | number | null;
        };
      }>;
    };
  };
}

/**
 * Builds a compiled transaction for native SOL transfer using @solana-program/system and @solana/kit.
 */
export function buildTransferTransactionMessage({
  sender,
  recipient,
  amountLamports,
  latestBlockhash,
}: BuildTransferParams) {
  if (!isAddress(sender)) {
    throw new Error(`Invalid sender address: "${sender}". Must be a valid Solana base58 address.`);
  }

  if (!isAddress(recipient)) {
    throw new Error(`Invalid recipient address: "${recipient}". Must be a valid Solana base58 address.`);
  }

  if (amountLamports <= 0n) {
    throw new Error("Transfer amount must be strictly greater than 0 lamports.");
  }

  const senderAddress = address(sender);
  const recipientAddress = address(recipient);
  const signer = createNoopSigner(senderAddress);

  const transferInstruction = getTransferSolInstruction({
    source: signer,
    destination: recipientAddress,
    amount: amountLamports,
  });

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayer(senderAddress, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstruction(transferInstruction, m)
  );

  return message;
}

/**
 * Builds and compiles the transaction message to base64 wire format for pre-sign simulation or RPC submission.
 */
export function buildTransferWireTransaction(params: BuildTransferParams): string {
  const message = buildTransferTransactionMessage(params);
  const compiledTransaction = compileTransaction(message);
  return getBase64EncodedWireTransaction(compiledTransaction);
}

/**
 * Simulates the transaction pre-sign against Solana Devnet using @solana/kit-plugin-rpc.
 */
export async function simulateTransferTransaction({
  sender,
  recipient,
  amountLamports,
  rpcClient = defaultClient as unknown as SimulatingRpcClient,
}: {
  sender: string;
  recipient: string;
  amountLamports: bigint;
  rpcClient?: SimulatingRpcClient;
}): Promise<SimulationResult> {
  try {
    const blockhashResponse = await rpcClient.rpc.getLatestBlockhash().send();
    const latestBlockhash: LatestBlockhashResult = blockhashResponse.value;

    const wireTransaction = buildTransferWireTransaction({
      sender,
      recipient,
      amountLamports,
      latestBlockhash,
    });

    const simulationResponse = await rpcClient.rpc
      .simulateTransaction(wireTransaction, {
        encoding: "base64",
        sigVerify: false,
      })
      .send();

    const simValue = simulationResponse.value;
    const isError = Boolean(simValue.err);

    return {
      status: isError ? "failed" : "success",
      logs: simValue.logs ?? [],
      fee: simValue.fee ?? DEFAULT_FEE_LAMPORTS,
      unitsConsumed: simValue.unitsConsumed ?? 0n,
      error: isError
        ? typeof simValue.err === "string"
          ? simValue.err
          : JSON.stringify(simValue.err)
        : null,
    };
  } catch (err) {
    return {
      status: "failed",
      logs: [],
      fee: DEFAULT_FEE_LAMPORTS,
      unitsConsumed: 0n,
      error: err instanceof Error ? err.message : "RPC simulation encountered an unexpected error.",
    };
  }
}

/**
 * Full end-to-end transaction inspection pipeline:
 * 1. Executes deterministic security checks.
 * 2. If pre-checks are not BLOCKED, simulates the constructed transaction on Devnet.
 * 3. Compiles final InspectionReport with verdict (READY, WARNING, or BLOCKED).
 */
export async function inspectAndSimulateTransfer(
  intent: TransferIntent,
  context: ValidationContext,
  rpcClient = defaultClient as unknown as SimulatingRpcClient
): Promise<InspectionReport> {
  // Step 1: Pre-simulation deterministic checks
  const preReport = generateInspectionReport(intent, context);

  // If statically blocked (e.g., bad address, insufficient balance, unauthorized program), skip RPC simulation
  if (preReport.verdict === "BLOCKED") {
    return generateInspectionReport(intent, context, {
      status: "skipped",
      logs: [],
      fee: DEFAULT_FEE_LAMPORTS,
      unitsConsumed: 0n,
      error: null,
    });
  }

  // Step 2: Execute Devnet simulation
  const amountLamports = solToLamports(intent.amount);
  const simulationResult = await simulateTransferTransaction({
    sender: context.senderAddress,
    recipient: intent.recipient,
    amountLamports,
    rpcClient,
  });

  // Step 3: Produce full InspectionReport incorporating simulation outcome
  return generateInspectionReport(intent, context, simulationResult);
}
