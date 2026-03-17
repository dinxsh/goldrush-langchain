/**
 * DeFi Researcher Agent
 *
 * Researches DEX pool prices, token price history, gas costs, and on-chain events.
 * Demonstrates: GoldRushToolkit with pricing + utility services.
 *
 * Run:
 *   GOLDRUSH_API_KEY=xxx ANTHROPIC_API_KEY=xxx npx tsx examples/defi-researcher-agent.ts
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
    services: ["pricing", "utility"],
  });

  console.log(`Loaded ${toolkit.toolCount} GoldRush tools`);

  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: "claude-sonnet-4-6",
      apiKey: anthropicKey,
    }),
    tools: toolkit.getTools(),
  });

  // WETH/USDC Uniswap V3 pool on Ethereum
  const poolAddress = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640";
  // WETH contract
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  console.log(`\nDeFi research on Ethereum mainnet\n`);
  console.log("=".repeat(60));

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        `Research current DeFi conditions on Ethereum mainnet:
         1. Get current spot prices for the WETH/USDC Uniswap V3 pool at ${poolAddress}
         2. Get WETH (${wethAddress}) price history for the last 7 days (from 2026-03-10 to 2026-03-17)
         3. Get current gas prices for ERC20 token transfers
         4. Summarize: What is the current ETH price? What has the 7-day price trend been? What would a typical ERC20 transfer cost right now?`
      ),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\nAgent response:");
  console.log(lastMessage.content);
}

main().catch(console.error);
