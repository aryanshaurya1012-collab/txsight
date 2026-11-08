export type TransferAction = 'transfer_sol';

export type SecurityVerdict = 'READY' | 'WARNING' | 'BLOCKED';

export type SecurityCheckSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface TransferIntent {
  action: TransferAction;
  recipient: string;
  amount: string | number;
  memo?: string;
}

export interface SecurityCheckResult {
  name: string;
  description: string;
  passed: boolean;
  severity: SecurityCheckSeverity;
  reason?: string;
}

export interface SimulationResult {
  status: 'success' | 'failed' | 'skipped';
  logs: string[];
  fee: bigint | number;
  unitsConsumed?: bigint | number;
  error?: string | null;
}

export interface InspectionReport {
  verdict: SecurityVerdict;
  checks: SecurityCheckResult[];
  simulationResult?: SimulationResult;
}

export interface ValidationContext {
  senderAddress: string;
  senderBalanceLamports: bigint;
  programId?: string;
  estimatedFeeLamports?: bigint;
  rentExemptBufferLamports?: bigint;
}

export interface AIAnalysisResult {
  amount: number;
  recipient: string;
  explanation: string;
}


