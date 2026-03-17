/**
 * Wallet Analyst Agent
 *
 * Analyzes a wallet's token holdings, portfolio history, and recent transactions.
 * Demonstrates: GoldRushToolkit with balance + transaction services.
 *
 * Run:
 *   GOLDRUSH_API_KEY=xxx ANTHROPIC_API_KEY=xxx npx tsx examples/wallet-analyst-agent.ts
 */

import { GoldRushToolkit } from "../src/index.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";

const apiKey = process.env.GOLDRUSH_API_KEY;
if (!apiKey) throw new Error("GOLDRUSH_API_KEY environment variable is required");

const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY environment variable is required");

async function main() {
  // Create toolkit with only the services we need
  const toolkit = new GoldRushToolkit({
    apiKey,
    services: ["balance", "transaction", "pricing"],
    defaultQuoteCurrency: "USD",
  });

  console.log(`Loaded ${toolkit.toolCount} GoldRush tools`);

  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: "claude-sonnet-4-6",
      apiKey: anthropicKey,
    }),
    tools: toolkit.getTools(),
  });

  const walletAddress = process.argv[2] ?? "vitalik.eth";
  const chain = process.argv[3] ?? "eth-mainnet";

  console.log(`\nAnalyzing wallet: ${walletAddress} on ${chain}\n`);
  console.log("=".repeat(60));

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        `Analyze the wallet ${walletAddress} on ${chain}.
         Please provide:
         1. All token holdings with current USD values
         2. Portfolio performance over the last 7 days
         3. The 5 most recent transactions with descriptions of what happened
         4. A brief summary of the wallet's activity`
      ),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\nAgent response:");
  console.log(lastMessage.content);
}

main().catch(console.error);
