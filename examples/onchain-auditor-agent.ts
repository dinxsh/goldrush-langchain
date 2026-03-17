/**
 * On-Chain Security Auditor Agent
 *
 * Audits a wallet for dangerous token approvals, risky spender contracts,
 * and summarizes total value at risk across ERC20 approvals.
 * Demonstrates: GoldRushToolkit with security + balance services.
 *
 * Run:
 *   GOLDRUSH_API_KEY=xxx ANTHROPIC_API_KEY=xxx npx tsx examples/onchain-auditor-agent.ts [address] [chain]
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
    services: ["security", "balance"],
  });

  console.log(`Loaded ${toolkit.toolCount} GoldRush tools`);

  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: "claude-sonnet-4-6",
      apiKey: anthropicKey,
    }),
    tools: toolkit.getTools(),
  });

  const walletAddress = process.argv[2] ?? "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const chain = process.argv[3] ?? "eth-mainnet";

  console.log(`\nSecurity audit for: ${walletAddress} on ${chain}\n`);
  console.log("=".repeat(60));

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        `Perform a security audit of wallet ${walletAddress} on ${chain}.
         Please:
         1. Fetch all ERC20 token approvals for this wallet
         2. Identify unlimited approvals (high risk — unlimited allowances)
         3. Flag any approvals to known risky or flagged spender contracts
         4. Calculate total value at risk from dangerous approvals
         5. Provide a risk rating (Low/Medium/High/Critical) with reasoning
         6. Recommend which approvals should be revoked immediately
         Format the output clearly for a non-technical user.`
      ),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\nAgent response:");
  console.log(lastMessage.content);
}

main().catch(console.error);
