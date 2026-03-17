---
name: langchain_goldrush_plugin
description: Context for the GoldRush LangChain plugin project in /toolings/langchain
type: project
---

Building `@covalenthq/langchain-goldrush` — a LangChain plugin wrapping all GoldRush REST API endpoints as StructuredTool instances.

**Why:** Enable LLM agents to query live on-chain data using natural language via LangChain.

**Plan file:** `/toolings/langchain/PLAN.md` — comprehensive TPM plan with all 37 endpoints, architecture, phases, and tooling.

**How to apply:** PLAN.md is the source of truth. Implementation follows 5 phases across 7 weeks. Reference the plan before suggesting implementation approaches.

**API surface (as of 2026-03-17, from actual goldrush_docs.html):**
- 37 endpoints across 8 service groups
- Cross-Chain (3), Balance (6), Transaction (8), NFT (3), Security (1), Bitcoin (4), Pricing (3), Utility (9)
- Base SDK: `@covalenthq/client-sdk`
- All tools use Zod v3 for schema validation
- Auth: Bearer token via `GOLDRUSH_API_KEY` env var

**Key files in sibling project (assignment/next-shadcn-dashboard-starter):**
- `/src/lib/adapters/goldrush.ts` — existing GoldRush adapter for benchmark dashboard
- `/src/app/api/goldrush/[...path]/route.ts` — GoldRush proxy endpoint
