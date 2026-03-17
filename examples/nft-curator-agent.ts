/**
 * NFT Curator Agent
 *
 * Discovers NFT holdings, verifies collection ownership, and provides NFT portfolio summaries.
 * Demonstrates: GoldRushToolkit with nft service.
 *
 * Run:
 *   GOLDRUSH_API_KEY=xxx ANTHROPIC_API_KEY=xxx npx tsx examples/nft-curator-agent.ts [address] [chain]
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
    services: ["nft"],
  });

  console.log(`Loaded ${toolkit.toolCount} GoldRush NFT tools`);

  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: "claude-sonnet-4-6",
      apiKey: anthropicKey,
    }),
    tools: toolkit.getTools(),
  });

  const walletAddress = process.argv[2] ?? "vitalik.eth";
  const chain = process.argv[3] ?? "eth-mainnet";
  // Well-known collection: BAYC
  const collection = process.argv[4] ?? "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

  console.log(`\nNFT analysis for: ${walletAddress} on ${chain}\n`);
  console.log("=".repeat(60));

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        `Analyze the NFT holdings of wallet ${walletAddress} on ${chain}.
         Please:
         1. List all NFT collections they own (filter out spam)
         2. Check if they own any NFT in the Bored Ape Yacht Club collection (${collection})
         3. Summarize their NFT portfolio — how many unique collections, notable pieces
         Keep responses concise.`
      ),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\nAgent response:");
  console.log(lastMessage.content);
}

main().catch(console.error);
