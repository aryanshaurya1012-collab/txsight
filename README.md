# TxSight — Solana AI Transaction Safety Copilot

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Engine-Turbopack-blueviolet?style=flat)](https://turbo.build/pack)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat&logo=solana)](https://solana.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **TxSight** is a decentralized transaction safety copilot for the Solana blockchain. It bridges natural human language and raw byte-level on-chain operations using a decoupled **Dual-Layer Defense Architecture**: pairing **Google Gemini 1.5 Flash** for cognitive intent parsing with a **Deterministic Pre-Flight Guard** that mathematically validates transactions and simulates execution on Devnet before a wallet is ever prompted to sign.

---

## 📖 About TxSight

### 1. The Genesis & Problem Statement
In Web3, signing transactions remains the single highest-risk action for users:
* **The Blind-Signing Dilemma**: Standard wallet approval modals present raw base58 public keys, cryptic instruction data, and opaque program IDs. Users are forced to guess what an interaction will do before hitting "Confirm".
* **Drainers & Spoofing Vectors**: Malicious actors exploit UX blind spots with unverified contracts, simulated balance drains, and address spoofing, siphoning millions in assets annually.
* **Network Waste & Frustration**: Transactions often fail mid-flight due to simple miscalculations (like neglecting the 5,000-lamport network fee against full balances), costing users unnecessary time and gas while cluttering block history.

### 2. The Solution: Dual-Layer Defense Architecture
TxSight eliminates blind signing on Solana through a decoupled, two-tier evaluation model that strictly separates **cognitive synthesis** from **authoritative security validation**:

```
 ┌──────────────────────────────────────────────────────────────┐
 │               User Prompt (Natural Language)                 │
 │       "Send 0.05 SOL to 4Nd1mBQ... and verify safety"        │
 └──────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │         TIER 1: SEMANTIC COPILOT (Gemini 1.5 Flash)          │
 │  • Cognitive intent extraction                               │
 │  • Structured schema: { amount, recipient, explanation }     │
 │  • Real-time human-readable risk summary                     │
 └──────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │    TIER 2: DETERMINISTIC PRE-FLIGHT GUARD (Solana System)    │
 │  • Base58 Address & Format Validation                        │
 │  • Self-Transfer & Spoofing Guard                            │
 │  • Strict Program ID Whitelist (11111111... System Program)  │
 │  • Exact Integer Lamport Arithmetic (Amount + Fee <= Bal)    │
 │  • Live Solana Devnet RPC Pre-Sign Simulation                │
 └──────────────────────────────┬───────────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      [ Checks Passed ]                  [ Check Failed ]
               │                                 │
               ▼                                 ▼
   [ Sign & Execute Button ]            [ HARD-BLOCK ENGINE ]
  (Dispatches to Wallet Adapter)      (Zero Private Key Exposure)
```

#### Tier 1 — Semantic Copilot (Google Gemini 1.5 Flash)
* Accepts natural-language user prompts (e.g., *"Send 0.05 SOL to 4Nd1... and verify safety"*).
* Extracts clean, structured JSON transaction parameters (`amount`, `recipient`, `explanation`) using Gemini's native JSON Schema validation (`responseSchema`).
* Generates real-time, human-readable risk summaries and plain-English operational breakdowns, explaining exactly what value is moving and highlighting irreversibility.

#### Tier 2 — Deterministic Pre-Flight Guard (Solana System Inspector)
The AI is strictly an **advisor**; the deterministic engine retains **absolute veto authority**. It enforces zero-trust mathematical and on-chain verification before the wallet adapter ever prompts the user:
* **Base58 Integrity**: Validates recipient public key encoding and length (32–44 base58 characters).
* **Self-Transfer & Spoofing Guard**: Flags and stops circular transfers back to the sender's own address.
* **Program Whitelisting**: Guarantees instructions exclusively target genuine Solana System Program IDs (`11111111111111111111111111111111`).
* **Exact Integer Lamport Arithmetic**: Validates balance sufficiency down to the single lamport (`Amount + 5,000 lamports fee <= Current Balance`), eliminating IEEE 754 floating-point rounding errors and preventing overdraft transaction aborts.
* **Pre-Sign RPC Simulation**: Constructs the wire transaction and simulates instructions directly against Solana Devnet RPC to inspect compute unit (CU) consumption and log outputs.
* **Hard-Block Execution Engine**: If any safety check fails, execution is hard-blocked on the client. The user is protected before their private keys or wallet extensions are engaged.

### 3. Why Solana?
Solana's sub-second finality, 400ms slot times, and predictable ~5,000-lamport fees enable security copilots to perform pre-flight simulations, balance verifications, and real-time execution in parallel without degrading the user experience. What requires 15–30 seconds of high-latency waiting on other chains takes less than a second on Solana.

### 4. Hackathon Track Alignment
* **AI Track Top Prize**: Integrates Google Gemini 1.5 Flash directly with Solana on-chain primitives to translate human language into secure on-chain operations with structured JSON schema outputs and plain-English risk explanations.
* **Best Beginner Hack**: Zero complex custom Rust validator overhead; built entirely client-side using `@solana/kit`, `@solana/react`, `@solana/kit-plugin-wallet`, and modern Next.js 16 App Router patterns.
* **Top 3 Overall**: Delivers a complete, resilient security product with a high-fidelity glassmorphic UI, real Devnet execution, on-chain signature forensics, and deterministic fail-safes.

---

## 🚀 Key Features

### 1. Conversational Transaction Input
Type your transfer intent naturally:
- *"Send 0.05 SOL to 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4x5bPPxEdZZ"*
- *"Pay 1.2 SOL for lunch to 7NX289KqPz6QWp58Q6V9xUj5R7B5eGZ9wK3bV9pZ2x1y"*
- Quick-chip sample buttons allow one-click testing of successful transfers and intentional failure modes (e.g., insufficient balance).

### 2. Live On-Chain Signature Inspector (`/inspector`)
A dedicated forensic interface to inspect any confirmed Solana Devnet transaction:
- Fetches full `jsonParsed` RPC transaction metadata from Solana Devnet.
- Analyzes program invocations, compute units, network fees, and execution status.
- Leverages Gemini AI to generate a plain-English explanation of the historical transaction actions.
- Features one-click JSON copy and deep links to Solana Explorer.

### 3. Zero-Wallet Sandbox Simulation Mode
Evaluators and users can test the full AI parsing pipeline and deterministic security checks immediately upon opening the app—even without a Phantom extension installed. When an active wallet is detected, the UI dynamically switches to live signing and Devnet broadcast.

### 4. Premium Web3 Visuals & 3D Glassmorphism
- Animated Solana mesh gradient background (`#0f0c29` space backdrop with `#9945FF` and `#14F195` floating ambient orbs).
- Physics-based fluid card transitions and 3D hover elevations powered by Framer Motion.
- Pulsating glow borders during AI synthesis and live transaction status badges (`READY`, `WARNING`, `BLOCKED`).

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16.4.5](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Blockchain** | [@solana/kit](https://github.com/solana-labs/solana-web3.js), [@solana/react](https://github.com/solana-labs/solana-web3.js), [@solana-program/system](https://www.npmjs.com/package/@solana-program/system) |
| **Wallet Standard** | [@solana/kit-plugin-wallet](https://github.com/solana-labs/solana-web3.js) (Auto-detects Phantom, Solflare, etc.) |
| **Artificial Intelligence** | [Google Generative AI](https://ai.google.dev/) (Gemini 1.5 Flash via `@google/generative-ai`) |
| **Styling & Effects** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Notifications & Icons** | [Sonner](https://sonner.emilkowal.ski/), [Lucide React](https://lucide.dev/) |

---

## 📦 Project Structure

```
txsight/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts          # Multi-mode Gemini AI endpoint (Intent & Historical)
│   │   ├── inspector/
│   │   │   └── page.tsx              # On-chain Transaction Signature Forensic Inspector
│   │   ├── globals.css               # Solana mesh gradient & glassmorphic styling
│   │   ├── layout.tsx                # Root layout with Solana Client & Wallet Provider
│   │   └── page.tsx                  # Interactive Copilot Dashboard
│   ├── components/
│   │   ├── BalancePanel.tsx          # Real-time Devnet SOL balance card
│   │   ├── Navbar.tsx                # Global navigation bar with active route glow
│   │   └── WalletPanel.tsx           # Solana Wallet Standard connect/disconnect controls
│   ├── lib/
│   │   ├── security/
│   │   │   └── validator.ts          # Deterministic pre-flight security validation engine
│   │   └── solana/
│   │       ├── client.ts             # Devnet RPC client initialization
│   │       └── transfer.ts           # System transfer builder, compiler & simulation
│   └── types/
│       └── transaction.ts            # Type definitions & security schema specifications
├── next.config.ts                    # Next.js Turbopack configuration
├── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or higher
- *(Optional)* [Phantom Wallet](https://phantom.app/) browser extension with Devnet mode enabled.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/txsight.git
cd txsight
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
# Google Gemini API Key for TxSight AI Transaction Parsing & Risk Explanation
# Get your free key at: https://aistudio.google.com/
GEMINI_API_KEY="your-gemini-api-key-here"
```

> **Note**: If `GEMINI_API_KEY` is not provided, TxSight automatically activates **Demo AI Mode** with local pattern-matching extraction, ensuring the application remains 100% testable out of the box!

### 4. Running the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Production Build & Static Check
```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Production build
npm run build

# Start production server
npm run start
```

---

## 🧪 Verification & Security Scenarios

You can verify the dual-layer defense directly in the UI using the following prompts:

1. **Standard Safe Transfer**:
   ```
   Send 0.01 SOL to 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4x5bPPxEdZZ
   ```
   *Verdict*: `READY` — Passes base58 format, program whitelist, and balance sufficiency checks.

2. **Insufficient Balance Guard**:
   ```
   Send 50 SOL to 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4x5bPPxEdZZ
   ```
   *Verdict*: `BLOCKED` — Flagged by integer lamport balance validator: `Insufficient SOL balance for transfer + fees`. "Sign & Execute" button is disabled.

3. **Circular Transfer Guard**:
   ```
   Send 0.01 SOL to <YourOwnConnectedAddress>
   ```
   *Verdict*: `BLOCKED` — Flagged by self-transfer validator: `Sender and recipient addresses cannot be identical`.

4. **Signature Inspector**:
   Navigate to the **Inspector** tab (`/inspector`) and test with confirmed Devnet signature:
   ```
   5WwqmWbcsXqEzcYvHKVRoR1tPPpJXQ1JgPKB2sRbfZ88W1VoVuaKHzK3fEYkhpbnc6vUuVydcs1hnhYGNWp7FRTQ
   ```
   *Outcome*: Live RPC fetch + Gemini AI instruction breakdown displaying invoked programs, slot confirmation, and fee consumption.

---

## 🛡️ Security Rationale

* **Decoupled Architecture**: AI is treated as untrusted input. The LLM parses natural language into intent, but cannot execute or approve transactions. Only the deterministic engine controls transaction emission.
* **Integer Arithmetic**: Avoids JavaScript `Number` precision loss when converting between SOL and lamports (`1 SOL = 1,000,000,000 lamports`) using `BigInt` operations.
* **Pre-Sign RPC Simulation**: Catches program errors, simulation reverts, and anomalous compute unit spikes before user signature prompts.

---

## 📜 License

TxSight is open-source software licensed under the [MIT License](LICENSE). Built for the **MLH Solana Hackathon**.
