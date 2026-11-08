import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIAnalysisResult } from "@/types/transaction";

export interface HistoricalInspectionResult {
  explanation: string;
  status: "success" | "failed";
  feeSol: number;
  programs: string[];
  slot?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body?.mode;
    const apiKey = process.env.GEMINI_API_KEY;

    // --- MODE: HISTORICAL ON-CHAIN TRANSACTION INSPECTION ---
    if (mode === "historical") {
      const txData = body?.txData;
      const signature = body?.signature || "unknown";

      if (!txData) {
        return NextResponse.json(
          { error: "Transaction data ('txData') is required for historical inspection." },
          { status: 400 }
        );
      }

      // Extract basic on-chain metrics
      const slot = txData.slot;
      const err = txData.meta?.err;
      const status: "success" | "failed" = err ? "failed" : "success";
      const feeLamports = txData.meta?.fee ?? 0;
      const feeSol = Number(feeLamports) / 1e9;

      const instructions = txData.transaction?.message?.instructions || [];
      const programIds: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instructions.forEach((ix: any) => {
        if (ix.programId) programIds.push(String(ix.programId));
        if (ix.program) programIds.push(String(ix.program));
      });
      const uniquePrograms = Array.from(new Set(programIds));

      // If no Gemini API key or placeholder, provide crisp deterministic AI summary
      if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey.trim() === "") {
        const programList = uniquePrograms.length > 0 ? uniquePrograms.join(", ") : "System Program";
        const explanation = `[Demo AI Mode] Transaction ${signature.slice(0, 8)}... confirmed on Solana Devnet at slot ${slot || "N/A"}. It executed with status "${status.toUpperCase()}" invoking [${programList}], consuming a network fee of ${feeSol.toFixed(6)} SOL.${err ? ` Failed with error: ${JSON.stringify(err)}` : " All instructions settled successfully without errors."}`;

        return NextResponse.json({
          explanation,
          status,
          feeSol,
          programs: uniquePrograms,
          slot,
        });
      }

      // Call Gemini 1.5 Flash for deep historical transaction analysis
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              explanation: {
                type: SchemaType.STRING,
                description: "2-3 concise sentences summarizing what this transaction executed on-chain, programs involved, success status, and potential safety takeaways.",
              },
            },
            required: ["explanation"],
          },
        },
        systemInstruction: `You are TxSight's Solana Transaction Inspector AI.
Analyze the provided on-chain transaction data and explain in 2-3 clear, human-readable sentences exactly what occurred:
1. Which programs were invoked (e.g., System Program, Token Program, Vote Program, Compute Budget).
2. What actions or value transfers occurred.
3. Whether it succeeded or failed, and any security observations for developers or users.`,
      });

      const promptText = `Analyze this confirmed Solana transaction:\nSignature: ${signature}\nSlot: ${slot}\nFee: ${feeSol} SOL\nError: ${JSON.stringify(err)}\nPrograms: ${uniquePrograms.join(", ")}\nLog Messages: ${JSON.stringify(txData.meta?.logMessages?.slice(0, 10) || [])}`;
      const result = await model.generateContent(promptText);
      const responseText = result.response.text();
      const cleaned = responseText.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        explanation: parsed.explanation || "Transaction inspected by TxSight AI.",
        status,
        feeSol,
        programs: uniquePrograms,
        slot,
      });
    }

    // --- MODE: NATURAL LANGUAGE INTENT PARSING (DEFAULT) ---
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A valid non-empty 'prompt' string is required." },
        { status: 400 }
      );
    }

    // Fallback parser for local development or demo environments when GEMINI_API_KEY is not yet configured
    if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey.trim() === "") {
      const addressMatch = prompt.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
      const amountMatch = prompt.match(/([0-9]*\.?[0-9]+)\s*(?:sol)?/i);

      if (addressMatch) {
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        const recipient = addressMatch[1];
        const result: AIAnalysisResult = {
          amount,
          recipient,
          explanation: `[Demo AI Mode] Transferring ${amount} SOL to ${recipient.slice(0, 4)}...${recipient.slice(-4)}. Native SOL transfers are final and irreversible on the Solana network.`,
        };
        return NextResponse.json(result);
      }

      return NextResponse.json(
        {
          error:
            "Could not detect a valid Solana recipient address in your prompt. Please format as: 'Send <amount> SOL to <SolanaBase58Address>', or configure GEMINI_API_KEY in .env.local for full conversational AI parsing.",
        },
        { status: 400 }
      );
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            amount: {
              type: SchemaType.NUMBER,
              description: "The numeric amount of SOL to send (e.g. 0.05, 1, 2.5). Must be a positive number.",
            },
            recipient: {
              type: SchemaType.STRING,
              description: "The Solana base58 recipient public key address (32-44 characters).",
            },
            explanation: {
              type: SchemaType.STRING,
              description: "1-2 sentence human-readable summary of what the user is trying to do and potential risks.",
            },
          },
          required: ["amount", "recipient", "explanation"],
        },
      },
      systemInstruction: `You are TxSight's AI transaction safety assistant for the Solana blockchain.
Your task is to analyze user natural language prompts for cryptocurrency transfers and extract intent parameters.

STRICT SCHEMA REQUIREMENTS:
You must return strictly a JSON object conforming to:
{
  "amount": number,
  "recipient": "string",
  "explanation": "string"
}

Rules:
1. "amount": The numeric quantity of SOL to transfer.
2. "recipient": The recipient's Solana base58 public key address.
3. "explanation": A 1-2 sentence human-readable explanation of what the user is doing and any safety risks like irreversibility, address verification, or abnormal amounts.

If the user does not specify an amount, return 0. If the user does not provide a recipient address, return an empty string "".`,
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedText = responseText.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleanedText) as AIAnalysisResult;

    if (typeof parsed.amount !== "number" || typeof parsed.recipient !== "string") {
      return NextResponse.json(
        { error: "AI response failed to match the expected transaction structure." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      amount: parsed.amount,
      recipient: parsed.recipient.trim(),
      explanation:
        parsed.explanation?.trim() ||
        `Transferring ${parsed.amount} SOL to ${parsed.recipient}. Please verify the destination address carefully.`,
    });
  } catch (error: unknown) {
    console.error("TxSight Gemini API Route Error:", error);
    const message = error instanceof Error ? error.message : "Failed to process request with Gemini AI.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
