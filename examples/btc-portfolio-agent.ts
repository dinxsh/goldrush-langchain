/**
 * Bitcoin Portfolio Agent
 *
 * Analyzes Bitcoin wallet balances and transaction history.
 * Demonstrates: GoldRushToolkit with bitcoin service.
 *
 * Run:
 *   GOLDRUSH_API_KEY=xxx ANTHROPIC_API_KEY=xxx npx tsx examples/btc-portfolio-agent.ts [btc-address]
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
  const toolkit = new GoldRushToolkit({
    apiKey,
    services: ["bitcoin"],
  });

  console.log(`Loaded ${toolkit.toolCount} GoldRush Bitcoin tools`);

  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: "claude-sonnet-4-6",
      apiKey: anthropicKey,
    }),
    tools: toolkit.getTools(),
  });

  // Example: Satoshi's genesis block address
  const btcAddress = process.argv[2] ?? "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna";

  console.log(`\nBitcoin portfolio analysis for: ${btcAddress}\n`);
  console.log("=".repeat(60));

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        `Analyze the Bitcoin wallet at address ${btcAddress}:
         1. What is the current BTC balance and its USD value?
         2. Show the last 5 transactions (amounts sent/received)
         3. Is this address active recently or dormant?
         4. Provide a brief summary of this wallet's history`
      ),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\nAgent response:");
  console.log(lastMessage.content);
}

main().catch(console.error);
