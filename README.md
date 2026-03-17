# @covalenthq/langchain-goldrush

[![CI](https://github.com/covalenthq/langchain-goldrush/actions/workflows/ci.yml/badge.svg)](https://github.com/covalenthq/langchain-goldrush/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@covalenthq/langchain-goldrush)](https://www.npmjs.com/package/@covalenthq/langchain-goldrush)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**36 LangChain `StructuredTool` instances** for the [GoldRush (Covalent)](https://goldrush.dev) on-chain data API — covering token balances, NFTs, transactions, Bitcoin, cross-chain queries, pricing, and more.

## Why This Package?

LangChain agents need tools with precise names, descriptions, and Zod-validated schemas so the LLM picks the right tool and fills parameters correctly. This package gives you production-ready tool definitions for every GoldRush endpoint, with:

- **Structured inputs** — every parameter has a description the LLM reads
- **Consistent output** — all tools return `{ tool, success, timestamp, data, pagination }` JSON
- **BigInt-safe serialization** — no `TypeError: Do not know how to serialize a BigInt`
- **Retry with backoff** — 5xx errors are retried up to 3× with exponential backoff
- **Tree-shakeable** — import only the tools you need, or use `GoldRushToolkit` for everything

## Installation

```bash
npm install @covalenthq/langchain-goldrush @covalenthq/client-sdk @langchain/core zod
```

Get a free API key at [goldrush.dev](https://goldrush.dev).

## Quick Start

```typescript
import { GoldRushToolkit } from "@covalenthq/langchain-goldrush";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "langchain/agents";

const toolkit = new GoldRushToolkit({ apiKey: process.env.GOLDRUSH_API_KEY! });

const agent = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: toolkit.getTools(),
});

const result = await agent.invoke({
  input: "What tokens does vitalik.eth hold on Ethereum mainnet?",
});
```

### Use Only Specific Services

```typescript
const toolkit = new GoldRushToolkit({
  apiKey: process.env.GOLDRUSH_API_KEY!,
  services: ["balance", "transaction"],  // only 14 tools instead of 36
});
```

### Use Individual Tools

```typescript
import { GoldRushClient, TokenBalancesTool } from "@covalenthq/langchain-goldrush";

const client = new GoldRushClient({ apiKey: process.env.GOLDRUSH_API_KEY! });
const tool = new TokenBalancesTool(client);

const raw = await tool.invoke({ chainName: "eth-mainnet", address: "vitalik.eth" });
const res = JSON.parse(raw);
// { tool: "goldrush_token_balances", success: true, timestamp: "...", data: {...} }
```

## Configuration

```typescript
const toolkit = new GoldRushToolkit({
  apiKey: "ckey_...",                  // required — your GoldRush API key
  defaultQuoteCurrency: "USD",         // default: "USD"
  maxResponseSize: 32_000,             // max chars before truncation; default: 32000
  timeout: 30_000,                     // per-request timeout in ms; default: 30000
  retries: 3,                          // retry count on 5xx errors; default: 3
  services: ["balance", "nft"],        // optional subset; default: all 8 groups
});
```

## Tool Reference

### Cross-Chain (3 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_address_activity` | `AddressActivityTool` | All chains where a wallet has been active |
| `goldrush_multichain_balances` | `MultichainBalancesTool` | Token balances across up to 10 chains in one call |
| `goldrush_multichain_transactions` | `MultichainTransactionsTool` | Transactions across multiple wallets and chains |

### Balance (6 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_token_balances` | `TokenBalancesTool` | All ERC20 + native tokens held by a wallet |
| `goldrush_historical_token_balances` | `HistoricalTokenBalancesTool` | Token balances at a historical block/date |
| `goldrush_native_token_balance` | `NativeTokenBalanceTool` | Native coin balance (ETH, MATIC, etc.) |
| `goldrush_erc20_token_transfers` | `Erc20TransfersTool` | ERC20 transfer history with prices |
| `goldrush_historical_portfolio` | `HistoricalPortfolioTool` | Portfolio value over time (30-day chart) |
| `goldrush_token_holders` | `TokenHoldersTool` | All holders of a specific ERC20 token |

### Transaction (8 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_recent_transactions` | `RecentTransactionsTool` | Most recent transactions for a wallet |
| `goldrush_paginated_transactions` | `PaginatedTransactionsTool` | Paginated transaction history |
| `goldrush_transaction` | `TransactionTool` | Single transaction by hash |
| `goldrush_transaction_summary` | `TransactionSummaryTool` | Aggregated stats for a wallet |
| `goldrush_bulk_transactions` | `BulkTransactionsTool` | Earliest (genesis) transactions for a wallet |
| `goldrush_block_transactions` | `BlockTransactionsTool` | All transactions in a block by block number |
| `goldrush_block_hash_transactions` | `BlockHashTransactionsTool` | All transactions in a block by block hash |
| `goldrush_time_bucket_transactions` | `TimeBucketTransactionsTool` | Transactions grouped by time bucket |

### NFT (3 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_nft_balances` | `NftBalancesTool` | All NFTs held by a wallet |
| `goldrush_nft_check_ownership` | `NftCheckOwnershipTool` | Check if a wallet owns any NFT in a collection |
| `goldrush_nft_check_token_ownership` | `NftCheckTokenOwnershipTool` | Check ownership of a specific token ID |

### Security (1 tool)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_token_approvals` | `TokenApprovalsTool` | ERC20 token approvals (allowances) for a wallet |

### Bitcoin (4 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_btc_transactions` | `BtcTransactionsTool` | Bitcoin transaction history for an address |
| `goldrush_btc_hd_wallet_balances` | `BtcHdWalletBalancesTool` | Balances for an HD (BIP32/44) Bitcoin wallet |
| `goldrush_btc_non_hd_wallet_balances` | `BtcNonHdWalletBalancesTool` | Balances for a non-HD Bitcoin address |
| `goldrush_btc_historical_balances` | `BtcHistoricalBalancesTool` | Historical Bitcoin balance chart |

### Pricing (3 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_historical_token_prices` | `HistoricalTokenPricesTool` | Daily token price history |
| `goldrush_pool_spot_prices` | `PoolSpotPricesTool` | Current spot prices from DEX liquidity pools |
| `goldrush_gas_prices` | `GasPricesTool` | Current gas prices (slow/standard/fast) |

### Utility (8 tools)

| Tool name | Class | Description |
|---|---|---|
| `goldrush_chains` | `ChainsTool` | List all supported blockchain networks |
| `goldrush_chains_status` | `ChainsStatusTool` | Health status for all chains |
| `goldrush_block` | `BlockTool` | Single block details (or 'latest') |
| `goldrush_block_heights_by_date` | `BlockHeightsByDateTool` | Block numbers for a date range |
| `goldrush_events_by_contract` | `EventsByContractTool` | Event logs from a specific contract |
| `goldrush_events_by_topic` | `EventsByTopicTool` | Event logs by topic hash across all contracts |
| `goldrush_events_latest_block` | `EventsLatestBlockTool` | Event logs from the latest block |
| `goldrush_resolve_address` | `ResolveAddressTool` | Resolve ENS/RNS/Unstoppable Domain → address |

## GoldRushToolkit API

```typescript
const toolkit = new GoldRushToolkit({ apiKey: "..." });

// Get all tools (36 by default, or filtered by services config)
toolkit.getTools(): StructuredTool[]

// Get all tools for a specific service group
toolkit.getToolsByService("balance"): StructuredTool[]

// Find a tool by exact name
toolkit.getTool("goldrush_token_balances"): StructuredTool | undefined

// Total number of registered tools
toolkit.toolCount: number
```

## Response Format

Every tool returns a JSON string with this envelope:

```json
{
  "tool": "goldrush_token_balances",
  "success": true,
  "timestamp": "2026-03-18T02:00:00.000Z",
  "truncated": false,
  "data": { ... },
  "pagination": {
    "has_more": false,
    "page_number": 0,
    "page_size": 10,
    "total_count": 42
  }
}
```

On error:

```json
{
  "tool": "goldrush_token_balances",
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "[goldrush_token_balances] Invalid API key — check GOLDRUSH_API_KEY",
  "suggestion": "Verify your API key at https://goldrush.dev"
}
```

## Error Handling

`GoldRushToolError` classifies API errors into typed codes your application can handle:

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | Invalid or missing API key |
| `FORBIDDEN` | API key doesn't have access to this endpoint |
| `NOT_FOUND` | Address, block, or resource not found |
| `RATE_LIMITED` | Too many requests — back off |
| `CHAIN_NOT_SUPPORTED` | Chain slug not supported by this endpoint |
| `INVALID_PARAMS` | Bad input parameters |
| `TIMEOUT` | Request timed out |
| `UPSTREAM_ERROR` | GoldRush API 5xx error (retried automatically) |
| `UNKNOWN` | Unclassified error |

## Supported Chains

This package supports all 60+ chains available in `@covalenthq/client-sdk`, including:

`eth-mainnet`, `matic-mainnet`, `base-mainnet`, `arbitrum-mainnet`, `optimism-mainnet`, `bsc-mainnet`, `avalanche-mainnet`, `zksync-mainnet`, `linea-mainnet`, `scroll-mainnet`, `mantle-mainnet`, `blast-mainnet`, `berachain-mainnet`, `monad-mainnet`, `solana-mainnet`, `btc-mainnet`, and many more.

For the full list, inspect `ChainNameEnum` from this package or call the `goldrush_chains` tool.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, how to add a new tool, and the PR process.

## License

[MIT](LICENSE) © Covalent Network Inc.
