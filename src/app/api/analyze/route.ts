import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIAnalysisResult } from "@/types/transaction";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A valid non-empty 'prompt' string is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback parser for local development or demo environments when GEMINI_API_KEY is not yet configured
    if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey.trim() === "") {
      const fallbackRegex =
        /(?:send|transfer|pay)\s+([0-9]*\.?[0-9]+)\s*(?:sol)?\s*(?:to\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i;
      const match = prompt.match(fallbackRegex);
      if (match) {
        const amount = parseFloat(match[1]);
        const recipient = match[2];
        const result: AIAnalysisResult = {
          amount,
          recipient,
          explanation: `[Demo AI Mode - GEMINI_API_KEY not configured] Transferring ${amount} SOL to ${recipient.slice(0, 4)}...${recipient.slice(-4)}. Native SOL transfers are final and irreversible on the Solana network.`,
        };
        return NextResponse.json(result);
      }

      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured in .env.local. Please configure your Gemini API key, or format the prompt like 'Send <amount> SOL to <address>'.",
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
    const message = error instanceof Error ? error.message : "Failed to process transaction intent with Gemini AI.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
