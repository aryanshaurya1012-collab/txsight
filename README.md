🛡️ TxSight — Understand Before You Sign
The AI-Powered Solana Transaction Safety Copilot & Deterministic Pre-Flight Guard
📌 Executive Summary & The Problem
Web3 users lose millions each year to blind signing, wallet drainers, and misconfigured transactions. Standard wallet approval popups present cryptic hex data, base58 strings, and obscure program IDs that even experienced users struggle to decipher under pressure.

TxSight eliminates blind signing on Solana through a Dual-Layer Defense Architecture:

Semantic Copilot Layer (Google Gemini 1.5 Flash): Translates natural language requests into structured transfer parameters and generates plain-English risk assessments explaining what will happen on-chain.

Deterministic Security Layer (Solana Pre-Flight Guard): Runs 7 zero-trust validation checks directly against the connected wallet state, base58 integrity rules, and the Solana System Program. If a transaction violates safety parameters (such as insufficient balance for transfer plus fees, or invalid recipient formatting), TxSight hard-blocks the execution before the wallet popup ever triggers.

🎯 Targeted Hackathon Tracks
🏆 AI Track Top Prize: Uses Google Gemini 1.5 Flash to parse natural language intent into validated transaction instructions and provide real-time explanations of on-chain operations.

🌱 Best Beginner Hack: Implements a client-side architecture using @solana/kit, @solana/kit-plugin-wallet, and @solana/react with zero custom Rust validator dependencies, prioritizing accessible security UX.

⭐ Top 3 Overall: Delivers an end-to-end, functional transaction copilot with automated simulations, real integer lamport arithmetic, and a 3D glassmorphic dashboard interface.

⚡ Architecture & Execution Flow
User Input (Plain English Intent)
               │
               ▼
┌──────────────────────────────────────────────┐
│  Tier 1: Gemini 1.5 Flash Intent Engine      │
│  - Parses natural language into parameters   │
│  - Generates human-readable risk summary     │
└──────────────────────┬───────────────────────┘
                       │ JSON ({ amount, recipient, explanation })
                       ▼
┌──────────────────────────────────────────────┐
│  Tier 2: Deterministic Pre-Flight Guard      │
│  - Recipient Format & System Program Verify  │
│  - Self-Transfer & Spoofing Detection        │
│  - Exact Lamport Balance & Fee Sufficiency   │
│  - Pre-Sign Devnet RPC Simulation            │
└──────────────────────┬───────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  [ Checks Failed ]           [ All Checks Passed ]
         │                           │
  Hard-Block UI               Unlock Phantom Wallet
(Zero Gas Expended)        (Sign & Execute on Devnet)
🛡️ Deterministic Security Checks (7-Point Guard)
Security Check	Validation Rule	Action on Failure
Recipient Address Format	Validates base58 encoding and 32-byte public key integrity.	BLOCKED
Self-Transfer Detection	Checks if recipient address matches the connected sender wallet.	BLOCKED
Sender Wallet Authorization	Ensures the active session holds valid signing rights.	BLOCKED
Program ID Whitelist	Confirms target program is native Solana System Program (1111...1111).	BLOCKED
Transfer Amount Positivity	Validates amount is >0 and within Solana integer lamport limits.	BLOCKED
Balance & Fee Sufficiency	Computes (Amount + Network Fee) <= Current Balance in lamports.	BLOCKED
Pre-Sign Simulation	Simulates instruction against Devnet RPC before triggering wallet prompt.	BLOCKED
💻 Tech Stack
Framework: Next.js 16 (App Router, Turbopack)

Blockchain Core: @solana/kit, @solana/kit-plugin-wallet, @solana/react

AI Processing: Google Gemini 1.5 Flash via @google/generative-ai

Animation & Styling: Framer Motion, Tailwind CSS, Lucide Icons, Glassmorphism CSS

Network: Solana Devnet

🚀 Getting Started Locally
1. Clone & Install Dependencies
Bash
git clone https://github.com/<your-username>/txsight.git
cd txsight
npm install --legacy-peer-deps
2. Configure Environment Variables
Create a .env.local file in the root directory:

Code snippet
GEMINI_API_KEY=your_google_gemini_api_key_here
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
3. Run Development Server
Bash
npm run dev
Open http://localhost:3000 in your browser with Phantom set to Devnet.

🧪 Testing the Security Engine
Test Insufficient Funds Blocker:

Connect a Devnet wallet with a low balance or enter an amount exceeding your holdings (e.g., Send 50 SOL to So11111111111111111111111111111111111111112).

Click Analyze Intent.

Notice the Balance and Fee Sufficiency check flags red, and the execution button switches to Transaction Blocked.

Test Clean Execution:

Airdrop Devnet SOL to your connected wallet address.

Enter Send 0.01 SOL to <Valid_Devnet_Address>.

All 7 security checks resolve green, activating the Sign & Execute Transaction button.
