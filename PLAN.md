# GoldRush LangChain Plugin — Product & Technical Plan

**Status:** Pre-implementation
**Author:** TPM Lead
**Date:** 2026-03-17
**Source of truth for API surface:** `goldrush_docs.html` (fetched 2026-03-17) + `goldrush-mcp-server` source
**Total endpoints covered:** 37 across 8 service groups

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [API Coverage Matrix](#3-api-coverage-matrix)
4. [Architecture Design](#4-architecture-design)
5. [Package Structure](#5-package-structure)
6. [LangChain Tool Definitions](#6-langchain-tool-definitions)
7. [TypeScript Type Definitions](#7-typescript-type-definitions)
8. [Implementation Phases](#8-implementation-phases)
9. [Error Handling & Resilience](#9-error-handling--resilience)
10. [Rate Limiting & Caching](#10-rate-limiting--caching)
11. [Testing Strategy](#11-testing-strategy)
12. [CI/CD & Publishing](#12-cicd--publishing)
13. [Agent Integration Examples](#13-agent-integration-examples)
14. [Configuration Reference](#14-configuration-reference)
15. [Risks & Open Questions](#15-risks--open-questions)

---

## 1. Executive Summary

The **GoldRush LangChain Plugin** (`langchain-goldrush`) is a first-party, production-grade TypeScript/JavaScript package that wraps the entire GoldRush REST API as LangChain `StructuredTool` and `DynamicStructuredTool` instances. It enables LLM agents to query live on-chain data (balances, transactions, NFTs, prices, security, Bitcoin, and blockchain utilities) using natural language, with no custom API client code required from the consumer.

**Why LangChain?** LangChain is the dominant agentic framework in the LLM ecosystem. Exposing GoldRush data as LangChain tools means any agent built on LangChain, LangGraph, or compatible frameworks gets full GoldRush data access out of the box.

**Why now?** The MCP server (`goldrush-mcp-server`) already validated the tool-per-endpoint pattern. This package takes that pattern to LangChain and adds:
- Zod schema validation (not just JSON Schema)
- LangChain's built-in streaming, retries, and tracing
- A composable `GoldRushToolkit` for batch-registering all tools
- First-class TypeScript types mirroring the SDK
- A test harness with recorded HTTP fixtures (no live API key required in CI)

---

## 2. Goals & Non-Goals

### Goals

| # | Goal |
|---|---|
| G1 | Wrap all 37 GoldRush REST endpoints as LangChain `StructuredTool` instances |
| G2 | Ship a `GoldRushToolkit` class that returns all tools pre-configured from a single API key |
| G3 | Full Zod input validation on every tool — agents can't pass invalid params |
| G4 | TypeScript-first: full type safety on inputs, outputs, and errors |
| G5 | Work with any LangChain-compatible agent: OpenAI, Anthropic, Gemini, local models |
| G6 | Zero runtime dependencies beyond `langchain` and `@covalenthq/client-sdk` |
| G7 | Support both CommonJS (`require`) and ESM (`import`) via dual-build |
| G8 | 100% unit test coverage for Zod schemas; integration tests with recorded fixtures |
| G9 | Publish to npm as `@covalenthq/langchain-goldrush` |
| G10 | Provide example agents: wallet analyst, NFT curator, DeFi researcher, on-chain auditor |

### Non-Goals

| # | Non-Goal | Reason |
|---|---|---|
| NG1 | Wrapping the GoldRush Kit (React components) | Front-end only, not relevant to agents |
| NG2 | WebSocket/streaming endpoints | LangChain tools are request-response; streaming is a separate concern |
| NG3 | Write/mutation endpoints | GoldRush API is read-only |
| NG4 | Multi-provider routing (Alchemy, Infura fallback) | Out of scope; single GoldRush data source |
| NG5 | On-chain transaction signing/sending | Security concern; read-only use case |

---

## 3. API Coverage Matrix

All 37 endpoints are in scope. Below is the complete coverage map from the official GoldRush docs.

### 3.1 Cross-Chain Service (3 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_address_activity` | GET | `/v1/address/{walletAddress}/activity/` | Locate all chains where an address is active |
| `goldrush_multichain_balances` | GET | `/v1/allchains/address/{walletAddress}/balances/` | Spot & historical token balances on up to 10 EVM chains |
| `goldrush_multichain_transactions` | GET | `/v1/allchains/transactions/` | Transactions for up to 10 addresses across 10 EVM chains |

### 3.2 Balance Service (6 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_token_balances` | GET | `/v1/{chainName}/address/{walletAddress}/balances_v2/` | Native + ERC20 balances with spot prices |
| `goldrush_historical_token_balances` | GET | `/v1/{chainName}/address/{walletAddress}/historical_balances/` | Balances at a historical block height or date |
| `goldrush_native_token_balance` | GET | `/v1/{chainName}/address/{walletAddress}/balances_native/` | Lightweight native token balance only |
| `goldrush_erc20_token_transfers` | GET | `/v1/{chainName}/address/{walletAddress}/transfers_v2/` | ERC20 transfer-in / transfer-out with historical prices |
| `goldrush_historical_portfolio` | GET | `/v1/{chainName}/address/{walletAddress}/portfolio_v2/` | Daily portfolio value breakdown by token (default 30 days) |
| `goldrush_token_holders` | GET | `/v1/{chainName}/tokens/{tokenAddress}/token_holders_v2/` | Paginated current/historical token holders list |

### 3.3 Transaction Service (8 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_transaction` | GET | `/v1/{chainName}/transaction_v2/{txHash}/` | Single transaction with decoded logs |
| `goldrush_transaction_summary` | GET | `/v1/{chainName}/address/{walletAddress}/transactions_summary/` | Tx count, earliest/latest tx, gas stats |
| `goldrush_bulk_transactions` | GET | `/v1/{chainName}/bulk/transactions/{walletAddress}/` | Earliest transactions for a wallet |
| `goldrush_recent_transactions` | GET | `/v1/{chainName}/address/{walletAddress}/transactions_v3/` | Most recent transactions for a wallet |
| `goldrush_paginated_transactions` | GET | `/v1/{chainName}/address/{walletAddress}/transactions_v3/page/{page}/` | Paginated transactions with decoded logs |
| `goldrush_time_bucket_transactions` | GET | `/v1/{chainName}/bulk/transactions/{walletAddress}/{timeBucket}/` | Transactions in a 15-minute time bucket |
| `goldrush_block_transactions` | GET | `/v1/{chainName}/block/{blockHeight}/transactions_v3/page/{page}/` | All transactions in a block |
| `goldrush_block_hash_transactions` | GET | `/v1/{chainName}/block_hash/{blockHash}/transactions_v3/` | All transactions in a block by hash |

### 3.4 NFT Service (3 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_nft_balances` | GET | `/v1/{chainName}/address/{walletAddress}/balances_nft/` | ERC721 and ERC1155 NFTs held by address |
| `goldrush_nft_check_ownership` | GET | `/v1/{chainName}/address/{walletAddress}/collection/{collectionContract}/` | Verify ownership in an NFT collection |
| `goldrush_nft_check_token_ownership` | GET | `/v1/{chainName}/address/{walletAddress}/collection/{collectionContract}/token/{tokenId}/` | Verify ownership of a specific token ID |

### 3.5 Security Service (1 endpoint)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_token_approvals` | GET | `/v1/{chainName}/approvals/{walletAddress}/` | All ERC20 approvals with spender risk categorization |

### 3.6 Bitcoin Service (4 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_btc_hd_wallet_balances` | GET | `/v1/btc-mainnet/address/{walletAddress}/hd_wallets/` | Balances for all child addresses of an xpub HD wallet |
| `goldrush_btc_non_hd_wallet_balances` | GET | `/v1/btc-mainnet/address/{walletAddress}/balances_v2/` | Bitcoin balance for a regular address |
| `goldrush_btc_historical_balances` | GET | `/v1/btc-mainnet/address/{walletAddress}/historical_balances/` | Historical BTC balance at block height or date |
| `goldrush_btc_transactions` | GET | `/v1/cq/covalent/app/bitcoin/transactions/` | Full transaction history for a BTC address |

### 3.7 Pricing Service (3 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_historical_token_prices` | GET | `/v1/pricing/historical_by_addresses_v2/{chainName}/{quoteCurrency}/{contractAddress}/` | Historical prices for ERC20/native tokens in date range |
| `goldrush_pool_spot_prices` | GET | `/v1/pricing/spot_prices/{chainName}/pools/{contractAddress}/` | Spot token pair prices for Uniswap V2/V3 pool |
| `goldrush_gas_prices` | GET | `/v1/{chainName}/event/{eventType}/gas_prices/` | Real-time gas estimates for different tx speeds |

### 3.8 Utility Service (9 endpoints)

| Tool Name | HTTP Method | Path | Description |
|---|---|---|---|
| `goldrush_events_latest_block` | GET | `/v1/{chainName}/events/` | All event logs from latest block or block range |
| `goldrush_events_by_topic` | GET | `/v1/{chainName}/events/topics/{topicHash}/` | Event logs for a topic hash across all contracts |
| `goldrush_events_by_contract` | GET | `/v1/{chainName}/events/address/{contractAddress}/` | Event logs emitted by a specific contract |
| `goldrush_block` | GET | `/v1/{chainName}/block_v2/{blockHeight}/` | Single block details (for block explorers) |
| `goldrush_block_heights_by_date` | GET | `/v1/{chainName}/block_v2/{startDate}/{endDate}/` | Block heights within a date range |
| `goldrush_chains` | GET | `/v1/chains/` | All supported blockchain networks |
| `goldrush_chains_status` | GET | `/v1/chains/status/` | Sync status for all supported chains |
| `goldrush_resolve_address` | GET | `/v1/{chainName}/address/{walletAddress}/resolve_address/` | Resolve ENS, RNS, Unstoppable Domains to address |

---

## 4. Architecture Design

### 4.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    @covalenthq/langchain-goldrush                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   GoldRushToolkit                        │    │
│  │  - Creates all 37 tools from a single API key           │    │
│  │  - Supports per-service subsetting (e.g. BalanceTools)  │    │
│  │  - Exposes getTools() for LangChain agent initialization │    │
│  └────────────────────┬────────────────────────────────────┘    │
│                        │ creates                                  │
│           ┌────────────▼──────────────────────────────┐         │
│           │          37 StructuredTool instances       │         │
│           │  ┌──────────────┐  ┌──────────────────┐   │         │
│           │  │BalanceTools  │  │TransactionTools  │   │         │
│           │  │(6 tools)     │  │(8 tools)         │   │         │
│           │  └──────────────┘  └──────────────────┘   │         │
│           │  ┌──────────────┐  ┌──────────────────┐   │         │
│           │  │ NFTTools     │  │ PricingTools     │   │         │
│           │  │ (3 tools)    │  │ (3 tools)        │   │         │
│           │  └──────────────┘  └──────────────────┘   │         │
│           │  ┌──────────────┐  ┌──────────────────┐   │         │
│           │  │SecurityTools │  │ BitcoinTools     │   │         │
│           │  │ (1 tool)     │  │ (4 tools)        │   │         │
│           │  └──────────────┘  └──────────────────┘   │         │
│           │  ┌──────────────┐  ┌──────────────────┐   │         │
│           │  │UtilityTools  │  │ CrossChainTools  │   │         │
│           │  │ (9 tools)    │  │ (3 tools)        │   │         │
│           │  └──────────────┘  └──────────────────┘   │         │
│           └────────────┬──────────────────────────────┘         │
│                        │ calls                                    │
│           ┌────────────▼──────────────────────────────┐         │
│           │        GoldRushClient (SDK Wrapper)        │         │
│           │  - Wraps @covalenthq/client-sdk            │         │
│           │  - Handles retry logic (3 retries, exp BO) │         │
│           │  - Normalizes paginated responses          │         │
│           │  - Converts SDK errors to LangChain errors │         │
│           └────────────┬──────────────────────────────┘         │
│                        │ HTTP                                     │
└────────────────────────┼────────────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │   api.covalenthq.com/v1/    │
          │   (GoldRush REST API)        │
          └─────────────────────────────┘
```

### 4.2 Tool Execution Flow

```
LLM Agent
    │
    ├─ Agent decides to call: goldrush_token_balances
    │    with args: { chainName: "eth-mainnet", address: "vitalik.eth" }
    │
    ▼
StructuredTool._call(input)
    │
    ├─ 1. Zod schema validates input
    │       • chainName ∈ ChainNameEnum
    │       • address is non-empty string
    │
    ├─ 2. GoldRushClient.BalanceService.getTokenBalancesForWalletAddress(...)
    │
    ├─ 3. Response normalization
    │       • Flatten pagination if pageAll: true
    │       • Truncate oversized responses (>8000 tokens)
    │       • Add metadata: chainName, timestamp, truncated flag
    │
    ├─ 4. JSON.stringify(result) → returned to LLM as tool observation
    │
    └─ 5. On error: GoldRushToolError with structured error code
```

### 4.3 Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Schema validation | Zod v3 | LangChain's `StructuredTool` natively uses Zod; better DX than JSON Schema |
| API client | `@covalenthq/client-sdk` | Official SDK; maintained by GoldRush team; handles auth, base URL, and serialization |
| Pagination strategy | Auto-paginate opt-in via `pageAll: boolean` | Agents often want all results; but large datasets need guardrails |
| Response truncation | Truncate at 8,000 tokens with `truncated: true` flag | LLM context windows are finite; agent must ask for page N explicitly |
| Error format | Structured JSON error (not thrown exception) | LLM agents handle JSON errors better than exception stack traces |
| Chain validation | Zod enum of all supported chain slugs | Prevents agents hallucinating invalid chain names |
| Module format | Dual CJS + ESM via `tsup` | Support both Node.js `require` and modern `import` |

---

## 5. Package Structure

```
langchain-goldrush/
├── src/
│   ├── index.ts                    # Main entrypoint — exports toolkit and all tools
│   ├── toolkit.ts                  # GoldRushToolkit class
│   ├── client.ts                   # GoldRushClient wrapper (wraps @covalenthq/client-sdk)
│   ├── types.ts                    # Shared TypeScript types & GoldRush enums
│   ├── errors.ts                   # GoldRushToolError class
│   ├── utils/
│   │   ├── paginate.ts             # Auto-pagination helper
│   │   ├── truncate.ts             # Response truncation helper
│   │   ├── chain-names.ts          # Zod enum of all 200+ chain slugs
│   │   └── format-response.ts      # JSON response formatting for LLM consumption
│   └── tools/
│       ├── cross-chain/
│       │   ├── index.ts
│       │   ├── address-activity.ts
│       │   ├── multichain-balances.ts
│       │   └── multichain-transactions.ts
│       ├── balance/
│       │   ├── index.ts
│       │   ├── token-balances.ts
│       │   ├── historical-token-balances.ts
│       │   ├── native-token-balance.ts
│       │   ├── erc20-transfers.ts
│       │   ├── historical-portfolio.ts
│       │   └── token-holders.ts
│       ├── transaction/
│       │   ├── index.ts
│       │   ├── transaction.ts
│       │   ├── transaction-summary.ts
│       │   ├── bulk-transactions.ts
│       │   ├── recent-transactions.ts
│       │   ├── paginated-transactions.ts
│       │   ├── time-bucket-transactions.ts
│       │   ├── block-transactions.ts
│       │   └── block-hash-transactions.ts
│       ├── nft/
│       │   ├── index.ts
│       │   ├── nft-balances.ts
│       │   ├── nft-check-ownership.ts
│       │   └── nft-check-token-ownership.ts
│       ├── security/
│       │   ├── index.ts
│       │   └── token-approvals.ts
│       ├── bitcoin/
│       │   ├── index.ts
│       │   ├── btc-hd-wallet-balances.ts
│       │   ├── btc-non-hd-wallet-balances.ts
│       │   ├── btc-historical-balances.ts
│       │   └── btc-transactions.ts
│       ├── pricing/
│       │   ├── index.ts
│       │   ├── historical-token-prices.ts
│       │   ├── pool-spot-prices.ts
│       │   └── gas-prices.ts
│       └── utility/
│           ├── index.ts
│           ├── events-latest-block.ts
│           ├── events-by-topic.ts
│           ├── events-by-contract.ts
│           ├── block.ts
│           ├── block-heights-by-date.ts
│           ├── chains.ts
│           ├── chains-status.ts
│           └── resolve-address.ts
├── examples/
│   ├── wallet-analyst-agent.ts     # Agent: "Analyze my wallet"
│   ├── nft-curator-agent.ts        # Agent: "What NFTs does this address own?"
│   ├── defi-researcher-agent.ts    # Agent: "Show me pool prices and approvals"
│   ├── onchain-auditor-agent.ts    # Agent: "Audit wallet security"
│   └── btc-portfolio-agent.ts      # Agent: "Analyze my Bitcoin portfolio"
├── tests/
│   ├── unit/
│   │   ├── schemas/                # Zod schema validation tests (37 test files)
│   │   └── utils/                  # Utility function tests
│   ├── integration/
│   │   ├── fixtures/               # Recorded HTTP responses (msw or nock)
│   │   └── tools/                  # Integration tests per service group
│   └── e2e/
│       └── agent-smoke-test.ts     # End-to-end agent run (requires GOLDRUSH_API_KEY)
├── docs/
│   └── tools-reference.md          # Auto-generated from source (typedoc)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .env.example
└── README.md
```

---

## 6. LangChain Tool Definitions

Each tool follows this structure. Below is the full specification for every tool.

### 6.1 Tool Template

```typescript
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { GoldRushClient } from "../client";
import { GoldRushToolError } from "../errors";
import { formatResponse } from "../utils/format-response";

export class GoldRushTokenBalancesTool extends StructuredTool {
  name = "goldrush_token_balances";
  description = `Fetch the native and fungible (ERC20) tokens held by a wallet address on a specific blockchain.
    Returns token name, symbol, balance, decimal, and current USD value.
    Supports ENS names (e.g. 'vitalik.eth') and raw addresses.
    Use when the user asks about: wallet holdings, token portfolio, asset balances.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug (e.g. 'eth-mainnet', 'matic-mainnet')"),
    address: z.string().min(1).describe("Wallet address or ENS/RNS/Lens/Unstoppable Domain name"),
    quoteCurrency: z.string().optional().default("USD").describe("Currency for value conversion (default: USD)"),
    nft: z.boolean().optional().default(false).describe("Include NFT balances in response"),
    noNftFetch: z.boolean().optional().default(true).describe("Skip NFT metadata fetch for faster response"),
    noSpam: z.boolean().optional().default(true).describe("Filter out spam and scam tokens"),
    noNftAssetMetadata: z.boolean().optional().default(true).describe("Skip NFT asset metadata"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.BalanceService
        .getTokenBalancesForWalletAddress(input.chainName, input.address, {
          quoteCurrency: input.quoteCurrency,
          nft: input.nft,
          noNftFetch: input.noNftFetch,
          noSpam: input.noSpam,
          noNftAssetMetadata: input.noNftAssetMetadata,
        });
      return formatResponse(result, "goldrush_token_balances");
    } catch (err) {
      throw new GoldRushToolError("goldrush_token_balances", err);
    }
  }
}
```

### 6.2 All 37 Tool Specifications

#### Cross-Chain Tools

---

**`goldrush_address_activity`**
```
name: "goldrush_address_activity"
description: "Locate all blockchain networks where a wallet address has been active.
  Returns a list of chains with activity flags. Supports ENS, RNS, Lens, Unstoppable Domains.
  Use when: user wants to know which chains an address operates on."

schema:
  walletAddress: string (required) — wallet address or domain name
  testnets:      boolean (optional, default: false) — include testnet chains in results
```

---

**`goldrush_multichain_balances`**
```
name: "goldrush_multichain_balances"
description: "Fetch spot and historical native/token balances for one address across up to 10 EVM chains
  with a single API call. Returns paginated balance data per chain.
  Use when: user wants a cross-chain portfolio overview."

schema:
  walletAddress:    string   (required) — wallet address or domain name
  chains:           string[] (optional) — chain slugs to query (default: all supported EVM chains)
  quoteCurrency:    string   (optional, default: "USD")
  before:           string   (optional) — pagination cursor
  limit:            number   (optional, default: 10, max: 100)
  cutoffTimestamp:  number   (optional) — unix timestamp; only include tokens active after this time
```

---

**`goldrush_multichain_transactions`**
```
name: "goldrush_multichain_transactions"
description: "Fetch paginated transactions for up to 10 EVM addresses across up to 10 EVM chains.
  Ideal for building cross-chain activity feeds. Returns decoded log events.
  Use when: user wants activity across multiple wallets or chains simultaneously."

schema:
  addresses:          string[] (optional, max 10) — wallet addresses to query
  chains:             string[] (optional, max 10) — chain slugs to query
  limit:              number   (optional, default: 10, max: 100)
  before:             string   (optional) — pagination cursor
  after:              string   (optional) — pagination cursor
  withLogs:           boolean  (optional, default: false) — include event logs
  withDecodedLogs:    boolean  (optional, default: false) — include decoded logs (requires withLogs: true)
  quoteCurrency:      string   (optional)
```

---

#### Balance Tools

---

**`goldrush_token_balances`** *(spec shown in §6.1 template above)*

---

**`goldrush_historical_token_balances`**
```
name: "goldrush_historical_token_balances"
description: "Fetch native and ERC20 token balances for an address at a historical block height or date.
  Returns balances as they were at that point in time with daily prices.
  Use when: user asks about past holdings, time-travel portfolio, or at-date balances."

schema:
  chainName:         ChainNameEnum (required)
  address:           string        (required)
  quoteCurrency:     string        (optional, default: "USD")
  nft:               boolean       (optional, default: false)
  noNftFetch:        boolean       (optional, default: true)
  noSpam:            boolean       (optional, default: true)
  noNftAssetMetadata:boolean       (optional, default: true)
  blockHeight:       number        (optional) — block number (mutually exclusive with date)
  date:              string        (optional, format: YYYY-MM-DD) — historical date (mutually exclusive with blockHeight)
```

---

**`goldrush_native_token_balance`**
```
name: "goldrush_native_token_balance"
description: "Lightweight endpoint to get only the native token balance (ETH, MATIC, BNB, etc.)
  for a wallet address. Faster than full balances query.
  Use when: user asks about ETH balance, gas funds, or native token only."

schema:
  chainName:     ChainNameEnum  (required)
  walletAddress: string         (required) — wallet address or domain name
  quoteCurrency: string         (optional, default: "USD")
  blockHeight:   string|number  (optional) — historical block height
```

---

**`goldrush_erc20_token_transfers`**
```
name: "goldrush_erc20_token_transfers"
description: "Fetch ERC20 token transfer events (in and out) for a wallet address with historical prices.
  Can filter to a specific token contract. Returns sender, receiver, amount, value.
  Use when: user wants transfer history, token flow analysis, or specific token movements."

schema:
  chainName:       ChainNameEnum (required)
  walletAddress:   string        (required) — wallet address or domain name
  quoteCurrency:   string        (optional, default: "USD")
  contractAddress: string        (optional) — filter to a specific ERC20 token
  startingBlock:   number        (optional) — start of block range
  endingBlock:     number        (optional) — end of block range
  pageSize:        number        (optional, default: 10, max: 100)
  pageNumber:      number        (optional, default: 0)
```

---

**`goldrush_historical_portfolio`**
```
name: "goldrush_historical_portfolio"
description: "Render a daily portfolio balance for an address broken down by token over a time range.
  Returns time-series portfolio value in USD. Default 30-day lookback.
  Use when: user asks about portfolio performance, P&L, or historical net worth."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required) — wallet address or domain name
  quoteCurrency: string        (optional, default: "USD")
  days:          number        (optional, default: 7) — number of historical days to include
```

---

**`goldrush_token_holders`**
```
name: "goldrush_token_holders"
description: "Get a paginated list of current or historical holders of an ERC20 or ERC721 token.
  Returns holder addresses, balances, and percentage ownership.
  Use when: user asks about token distribution, whale holders, or governance participation."

schema:
  chainName:    ChainNameEnum  (required)
  tokenAddress: string         (required) — ERC20/ERC721 contract address or domain name
  blockHeight:  string|number  (optional) — historical block height for snapshot
  date:         string         (optional, format: YYYY-MM-DD) — historical date snapshot
  pageSize:     number         (optional, max: 100)
  pageNumber:   number         (optional, default: 0)
```

---

#### Transaction Tools

---

**`goldrush_transaction`**
```
name: "goldrush_transaction"
description: "Fetch a single transaction by hash with decoded log events.
  On Ethereum mainnet, also supports internal transactions, state changes, and method ID.
  Use when: user asks to explain a transaction, parse a tx hash, or understand what happened."

schema:
  chainName:     ChainNameEnum (required)
  txHash:        string        (required) — transaction hash (0x...)
  quoteCurrency: string        (optional, default: "USD")
  noLogs:        boolean       (optional, default: false) — exclude event logs (faster)
  withInternal:  boolean       (optional, default: false) — include internal traces (eth-mainnet only)
  withState:     boolean       (optional, default: false) — include state changes (eth-mainnet only)
  withInputData: boolean       (optional, default: false) — include raw input data (eth-mainnet only)
```

---

**`goldrush_transaction_summary`**
```
name: "goldrush_transaction_summary"
description: "Fetch a summary of wallet activity: earliest transaction, latest transaction,
  total transaction count, gas expenditure, and ERC20 transfer count.
  Use when: user wants an overview of a wallet's history or first/last activity dates."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required) — wallet address or domain name
  quoteCurrency: string        (optional, default: "USD")
  withGas:       boolean       (optional, default: false) — include gas usage statistics
```

---

**`goldrush_bulk_transactions`**
```
name: "goldrush_bulk_transactions"
description: "Fetch the earliest transactions for a wallet address. Useful for wallet history
  exploration starting from genesis activity.
  Use when: user asks about first transactions, wallet inception, or earliest on-chain activity."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required)
```

---

**`goldrush_recent_transactions`**
```
name: "goldrush_recent_transactions"
description: "Fetch the most recent transactions for a wallet address.
  Returns latest transactions with decoded logs. Paginated via page number.
  Use when: user wants latest activity, recent sends/receives, or current wallet state."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required) — wallet address or domain name
```

---

**`goldrush_paginated_transactions`**
```
name: "goldrush_paginated_transactions"
description: "Fetch a specific page of transactions for a wallet address with decoded log events.
  Page 0 = most recent. Ascending sort available via blockSignedAtAsc.
  Use when: user wants to browse transaction history page by page."

schema:
  chainName:         ChainNameEnum (required)
  walletAddress:     string        (required) — wallet address or domain name
  page:              number        (required) — page number (0-indexed; 0 = most recent)
  quoteCurrency:     string        (optional, default: "USD")
  noLogs:            boolean       (optional, default: false) — exclude event logs
  blockSignedAtAsc:  boolean       (optional, default: false) — sort oldest-first
```

---

**`goldrush_time_bucket_transactions`**
```
name: "goldrush_time_bucket_transactions"
description: "Fetch all transactions for a wallet within a specific 15-minute time bucket.
  TimeBucket is a Unix timestamp rounded to the nearest 15 minutes.
  Use when: user wants to analyze activity during a specific time window."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required)
  timeBucket:    number        (required) — Unix timestamp of the 15-minute window start
```

---

**`goldrush_block_transactions`**
```
name: "goldrush_block_transactions"
description: "Fetch all transactions in a specific block with decoded log events. Paginated.
  Use 'latest' for the most recent block.
  Use when: user wants to analyze a block, find MEV, or browse block-level activity."

schema:
  chainName:     ChainNameEnum      (required)
  blockHeight:   string|number      (required) — block number or 'latest'
  page:          number             (required) — page number (0-indexed)
  quoteCurrency: string             (optional, default: "USD")
  noLogs:        boolean            (optional) — exclude event logs
```

---

**`goldrush_block_hash_transactions`**
```
name: "goldrush_block_hash_transactions"
description: "Fetch all transactions in a block identified by its block hash.
  Use when: user has a block hash (not height) and wants its full transaction list."

schema:
  chainName:  ChainNameEnum (required)
  blockHash:  string        (required) — block hash (0x...)
```

---

#### NFT Tools

---

**`goldrush_nft_balances`**
```
name: "goldrush_nft_balances"
description: "Fetch all ERC721 and ERC1155 NFTs held by a wallet address, including metadata.
  Supports spam filtering and metadata skip for performance.
  Use when: user asks about NFT collection, digital assets, or what NFTs they own."

schema:
  chainName:          ChainNameEnum (required)
  walletAddress:      string        (required) — wallet address or domain name
  noSpam:             boolean       (optional, default: true) — filter spam NFTs
  noNftAssetMetadata: boolean       (optional, default: false) — skip asset metadata
  withUncached:       boolean       (optional, default: false) — fetch uncached metadata from source
```

---

**`goldrush_nft_check_ownership`**
```
name: "goldrush_nft_check_ownership"
description: "Verify whether a wallet address owns any NFT in a specific collection.
  Supports trait filtering. Returns owned token IDs if any.
  Use when: user wants to verify NFT ownership for gating, allowlists, or verification."

schema:
  chainName:          ChainNameEnum (required)
  walletAddress:      string        (required) — wallet address or domain name
  collectionContract: string        (required) — NFT collection contract address
  traitsFilter:       string        (optional) — comma-separated trait type names
  valuesFilter:       string        (optional) — comma-separated trait values
```

---

**`goldrush_nft_check_token_ownership`**
```
name: "goldrush_nft_check_token_ownership"
description: "Verify whether a wallet address owns a specific NFT token ID in a collection.
  Works for ERC-721 (unique) and ERC-1155 (multi-edition) tokens.
  Use when: user needs to verify ownership of a specific NFT."

schema:
  chainName:          ChainNameEnum (required)
  walletAddress:      string        (required) — wallet address or domain name
  collectionContract: string        (required) — NFT collection contract address
  tokenId:            string        (required) — specific token ID to check
```

---

#### Security Tools

---

**`goldrush_token_approvals`**
```
name: "goldrush_token_approvals"
description: "Get all ERC20 token approvals for a wallet, categorized by spender with risk assessment.
  Identifies risky unlimited approvals, flagged spender contracts, and total exposure.
  Use when: user wants to audit wallet security, check approvals, or assess DeFi risk."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required) — wallet address or domain name
```

---

#### Bitcoin Tools

---

**`goldrush_btc_hd_wallet_balances`**
```
name: "goldrush_btc_hd_wallet_balances"
description: "Fetch balances for all active child addresses derived from a Bitcoin HD wallet
  (BIP32/BIP44 xpub extended public key). Returns each derived address with its UTXO balance.
  Use when: user has an xpub key and wants a full HD wallet balance overview."

schema:
  walletAddress: string (required) — xpub extended public key (starts with 'xpub')
  quoteCurrency: string (optional, default: "USD")
```

---

**`goldrush_btc_non_hd_wallet_balances`**
```
name: "goldrush_btc_non_hd_wallet_balances"
description: "Fetch the current Bitcoin balance for a regular (non-HD) Bitcoin address
  with spot price and metadata.
  Use when: user provides a Bitcoin address (starts with 1, 3, or bc1) and wants its BTC balance."

schema:
  walletAddress: string (required) — Bitcoin address (P2PKH, P2SH, or Bech32)
  quoteCurrency: string (optional, default: "USD")
```

---

**`goldrush_btc_historical_balances`**
```
name: "goldrush_btc_historical_balances"
description: "Fetch the historical Bitcoin balance for an address at a specific block height or date.
  Includes daily prices. Useful for tax calculations and historical audits.
  Use when: user asks about past BTC holdings or balance at a specific date."

schema:
  walletAddress: string (required) — Bitcoin address
  blockHeight:   number (optional) — block height for snapshot (mutually exclusive with date)
  date:          string (optional, format: YYYY-MM-DD) — date for snapshot (mutually exclusive with blockHeight)
  quoteCurrency: string (optional, default: "USD")
```

---

**`goldrush_btc_transactions`**
```
name: "goldrush_btc_transactions"
description: "Fetch the full transaction history for a Bitcoin wallet address.
  Returns inputs, outputs, amounts, and confirmation status. Paginated.
  Use when: user wants to see Bitcoin transaction history."

schema:
  address:    string (required) — Bitcoin address
  pageSize:   number (optional, default: 10, max: 100)
  pageNumber: number (optional, default: 0)
```

---

#### Pricing Tools

---

**`goldrush_historical_token_prices`**
```
name: "goldrush_historical_token_prices"
description: "Get historical daily prices for an ERC20 token or native token between two dates.
  Supports large-cap tokens and native chain tokens (use 'native' as contractAddress).
  Use when: user wants price history, computes cost basis, or performs P&L analysis."

schema:
  chainName:       ChainNameEnum  (required)
  quoteCurrency:   string         (required) — e.g. 'USD', 'EUR', 'BTC'
  contractAddress: string         (required) — token contract address or 'native'
  from:            string         (required, format: YYYY-MM-DD) — start date
  to:              string         (required, format: YYYY-MM-DD) — end date
  pricesAtAsc:     boolean        (optional, default: false) — sort oldest-first
```

---

**`goldrush_pool_spot_prices`**
```
name: "goldrush_pool_spot_prices"
description: "Get current spot token pair prices for a liquidity pool contract.
  Supports Uniswap V2, V3, and their forks (SushiSwap, Curve, etc.).
  Use when: user wants real-time DEX price, pool ratio, or swap rate."

schema:
  chainName:       ChainNameEnum (required)
  contractAddress: string        (required) — liquidity pool contract address
  quoteCurrency:   string        (optional, default: "USD")
```

---

**`goldrush_gas_prices`**
```
name: "goldrush_gas_prices"
description: "Get real-time gas price estimates for different transaction speeds on a chain.
  Returns safe low, standard, fast, and instant speeds with estimated confirmation times.
  Use when: user wants to know current gas costs or optimize transaction fees."

schema:
  chainName:  ChainNameEnum (required)
  eventType:  string        (required) — event type (e.g. 'erc20', 'nativetokens', 'uniswapv3')
```

---

#### Utility Tools

---

**`goldrush_events_latest_block`**
```
name: "goldrush_events_latest_block"
description: "Fetch all event logs from the latest block or a range of blocks on a chain.
  Includes sender contract metadata and decoded log events.
  Use when: user wants to monitor recent blockchain events or scan block activity."

schema:
  chainName:       ChainNameEnum (required)
  startingBlock:   number        (optional) — start block for range query
  endingBlock:     number        (optional) — end block for range query
  pageSize:        number        (optional)
  pageNumber:      number        (optional, default: 0)
```

---

**`goldrush_events_by_topic`**
```
name: "goldrush_events_by_topic"
description: "Fetch all event logs sharing the same topic hash across all contracts on a chain.
  Useful for cross-sectional event analysis (e.g., all Transfer events across all ERC20s).
  Use when: user wants to find all occurrences of a specific event type."

schema:
  chainName:     ChainNameEnum (required)
  topicHash:     string        (required) — event topic hash (keccak256 of event signature)
  startingBlock: number        (optional)
  endingBlock:   number        (optional)
  contractAddress: string      (optional) — filter to events from a specific contract
  pageSize:      number        (optional)
  pageNumber:    number        (optional, default: 0)
```

---

**`goldrush_events_by_contract`**
```
name: "goldrush_events_by_contract"
description: "Fetch all event logs emitted by a specific smart contract address.
  Useful for building dashboards monitoring a particular contract's on-chain interactions.
  Use when: user wants to monitor a specific contract, track DeFi protocol events, or analyze a dApp."

schema:
  chainName:       ChainNameEnum (required)
  contractAddress: string        (required) — smart contract address
  startingBlock:   number        (optional)
  endingBlock:     number        (optional)
  pageSize:        number        (optional)
  pageNumber:      number        (optional, default: 0)
```

---

**`goldrush_block`**
```
name: "goldrush_block"
description: "Fetch details for a single block on a chain including timestamp, miner,
  gas used/limit, transaction count, and block hash.
  Use when: user asks about a specific block or wants block explorer data."

schema:
  chainName:   ChainNameEnum      (required)
  blockHeight: string|number      (required) — block number or 'latest'
```

---

**`goldrush_block_heights_by_date`**
```
name: "goldrush_block_heights_by_date"
description: "Get all block heights that were produced within a date range.
  Useful for aligning calendar dates with block numbers for historical queries.
  Use when: user has a date range and needs the corresponding block numbers."

schema:
  chainName:  ChainNameEnum (required)
  startDate:  string        (required, format: YYYY-MM-DD)
  endDate:    string        (required, format: YYYY-MM-DD)
  pageSize:   number        (optional)
  pageNumber: number        (optional, default: 0)
```

---

**`goldrush_chains`**
```
name: "goldrush_chains"
description: "Get the complete list of all blockchain networks supported by GoldRush.
  Returns chain name, chain ID, logo URL, and other metadata.
  Use when: user wants to know which chains are available, or to look up a chain ID."

schema: {} (no parameters required)
```

---

**`goldrush_chains_status`**
```
name: "goldrush_chains_status"
description: "Get the current synchronization status for all supported blockchain networks.
  Returns latest synced block, expected latest block, and sync health.
  Use when: user wants to check chain health, data freshness, or indexing lag."

schema: {} (no parameters required)
```

---

**`goldrush_resolve_address`**
```
name: "goldrush_resolve_address"
description: "Resolve a human-readable name (ENS, RNS, Unstoppable Domain) to its EVM address.
  Only resolves registered domains to addresses (forward resolution).
  Use when: user provides a name like 'vitalik.eth' and needs the raw 0x address."

schema:
  chainName:     ChainNameEnum (required)
  walletAddress: string        (required) — ENS name, RNS name, or Unstoppable Domain
```

---

## 7. TypeScript Type Definitions

```typescript
// src/types.ts

import { z } from "zod";

// ─── Chain Name Enum ──────────────────────────────────────────────────────────
// NOTE: This enum must be kept in sync with GoldRush's supported chains.
// Source: GET /v1/chains/ endpoint. As of 2026-03-17: 200+ chains.
// Key slugs listed below; full list auto-generated via build script.
export const ChainNameEnum = z.enum([
  "eth-mainnet",
  "matic-mainnet",
  "bsc-mainnet",
  "avalanche-mainnet",
  "fantom-mainnet",
  "arbitrum-mainnet",
  "optimism-mainnet",
  "base-mainnet",
  "linea-mainnet",
  "zksync-mainnet",
  "scroll-mainnet",
  "mantle-mainnet",
  "moonbeam-mainnet",
  "moonriver-mainnet",
  "gnosis-mainnet",
  "celo-mainnet",
  "aurora-mainnet",
  "cronos-mainnet",
  "metis-mainnet",
  "boba-mainnet",
  "rsk-mainnet",
  "evmos-mainnet",
  "astar-mainnet",
  "solana-mainnet",
  "btc-mainnet",
  // ... all 200+ chains generated from /v1/chains/
]);
export type ChainName = z.infer<typeof ChainNameEnum>;

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  has_more: boolean;
  page_number: number;
  page_size: number;
  total_count: number | null;
}

// ─── Standard GoldRush Response Envelope ─────────────────────────────────────
export interface GoldRushResponse<T> {
  data: T | null;
  error: boolean;
  error_message: string | null;
  error_code: number | null;
}

// ─── Formatted Tool Response ─────────────────────────────────────────────────
export interface FormattedToolResponse<T> {
  tool: string;
  chain?: string;
  timestamp: string;
  truncated: boolean;
  total_items?: number;
  data: T;
}

// ─── Toolkit Configuration ───────────────────────────────────────────────────
export interface GoldRushToolkitConfig {
  apiKey: string;
  /** Default quote currency for all tools. Default: "USD" */
  defaultQuoteCurrency?: string;
  /** Maximum response size in characters before truncation. Default: 32000 */
  maxResponseSize?: number;
  /** Services to include. Default: all services */
  services?: Array<
    | "cross-chain"
    | "balance"
    | "transaction"
    | "nft"
    | "security"
    | "bitcoin"
    | "pricing"
    | "utility"
  >;
  /** Request timeout in ms. Default: 30000 */
  timeout?: number;
  /** Number of retries on 5xx errors. Default: 3 */
  retries?: number;
}

// ─── Tool Error ───────────────────────────────────────────────────────────────
export type GoldRushErrorCode =
  | "UNAUTHORIZED"          // 401 — invalid or missing API key
  | "FORBIDDEN"             // 403 — plan does not support this endpoint
  | "NOT_FOUND"             // 404 — chain or resource not found
  | "RATE_LIMITED"          // 429 — requests per second exceeded
  | "CHAIN_NOT_SUPPORTED"   // chain slug not in supported list
  | "INVALID_PARAMS"        // Zod validation failure
  | "TIMEOUT"               // request exceeded timeout
  | "UPSTREAM_ERROR"        // 5xx from GoldRush API
  | "TRUNCATED"             // response exceeded maxResponseSize (not an error)
  | "UNKNOWN";
```

---

## 8. Implementation Phases

### Phase 1 — Foundation (Week 1–2)

**Goal:** Scaffolding, core infrastructure, and 1 fully working service.

| Task | Owner | Outcome |
|---|---|---|
| Scaffold package with `tsup`, `vitest`, `eslint`, `prettier` | Backend Engineer | Package builds cleanly |
| Implement `GoldRushClient` wrapper around `@covalenthq/client-sdk` | Backend Engineer | SDK integrated with retry logic |
| Implement `GoldRushToolError` with all error codes | Backend Engineer | Errors are structured JSON |
| Implement `ChainNameEnum` auto-generation script | Backend Engineer | Enum kept up-to-date via script |
| Implement `formatResponse` + `truncate` utilities | Backend Engineer | Responses are LLM-friendly |
| Implement `GoldRushToolkit` skeleton | Backend Engineer | `getTools()` returns empty array initially |
| Implement all 6 **Balance Service** tools with full Zod schemas | Backend Engineer | 6 tools work end-to-end |
| Unit tests: all Balance schemas (valid + invalid inputs) | QA / Engineer | 100% schema coverage |
| Integration tests: Balance tools with MSW fixtures | QA / Engineer | Tests pass without live API key |
| Example: `wallet-analyst-agent.ts` | Developer Advocate | Basic agent demo works |

**Phase 1 Milestone:** `npm install @covalenthq/langchain-goldrush` + 6 balance tools working in an agent.

---

### Phase 2 — Core Services (Week 3–4)

**Goal:** Transaction, NFT, and Security services.

| Task | Owner | Outcome |
|---|---|---|
| Implement all 8 **Transaction Service** tools | Backend Engineer | 8 tools complete |
| Implement all 3 **NFT Service** tools | Backend Engineer | 3 tools complete |
| Implement 1 **Security Service** tool | Backend Engineer | 1 tool complete |
| Add pagination helper (`pageAll` option) with guardrails | Backend Engineer | Agents can auto-paginate safely |
| Unit + integration tests for all above | QA / Engineer | Coverage maintained |
| Examples: `nft-curator-agent.ts`, `onchain-auditor-agent.ts` | Developer Advocate | 2 new example agents |
| `GoldRushToolkit.getTools(services: [...])` subsetting | Backend Engineer | Consumers can pick service subsets |

**Phase 2 Milestone:** Core EVM functionality complete. 18 of 37 tools shipped.

---

### Phase 3 — Bitcoin, Pricing, Cross-Chain (Week 5)

**Goal:** Complete all remaining services.

| Task | Owner | Outcome |
|---|---|---|
| Implement all 4 **Bitcoin Service** tools | Backend Engineer | BTC tools complete |
| Implement all 3 **Pricing Service** tools | Backend Engineer | Pricing tools complete |
| Implement all 3 **Cross-Chain Service** tools | Backend Engineer | Cross-chain tools complete |
| Unit + integration tests for all above | QA / Engineer | Coverage maintained |
| Example: `btc-portfolio-agent.ts`, `defi-researcher-agent.ts` | Developer Advocate | 2 new example agents |

**Phase 3 Milestone:** 28 of 37 tools shipped.

---

### Phase 4 — Utility Service & Hardening (Week 6)

**Goal:** All 37 tools, performance hardening, and release readiness.

| Task | Owner | Outcome |
|---|---|---|
| Implement all 9 **Utility Service** tools | Backend Engineer | All 37 tools complete |
| `ChainNameEnum` auto-generation from live `/v1/chains/` | Backend Engineer | Enum never goes stale |
| Performance: response size benchmarks per tool | Backend Engineer | No tool returns > 32KB |
| E2E smoke test against live API (gated behind env var) | QA / Engineer | Green with real `GOLDRUSH_API_KEY` |
| README with quickstart, tool reference, examples | Developer Advocate | Docs complete |
| TypeDoc generation for `docs/tools-reference.md` | Developer Advocate | Auto-generated API docs |
| Security review: API key handling, no key in logs | Security | No key leakage |

**Phase 4 Milestone:** All 37 tools. Ready for v1.0.0-beta.

---

### Phase 5 — GA Release (Week 7)

**Goal:** Publish to npm, announce, gather feedback.

| Task | Owner | Outcome |
|---|---|---|
| Changelog + versioning strategy | TPM | Semantic versioning defined |
| npm publish `@covalenthq/langchain-goldrush@1.0.0` | Backend Engineer | Package live on npm |
| Blog post / developer announcement | Marketing / DevRel | Community awareness |
| GitHub Discussions open for feedback | TPM | Feedback channel established |
| Monitor npm download stats week-over-week | TPM | Baseline established |

---

## 9. Error Handling & Resilience

### 9.1 Error Classification

```typescript
// src/errors.ts

export class GoldRushToolError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly cause: unknown,
    public readonly code: GoldRushErrorCode = "UNKNOWN"
  ) {
    super(`[${toolName}] ${GoldRushToolError.classify(cause, code).message}`);
    this.code = GoldRushToolError.classify(cause, code).code;
  }

  /**
   * Returns a JSON string so LLM agents can parse and understand the error
   * rather than receiving a stack trace.
   */
  toJSON(): string {
    return JSON.stringify({
      error: true,
      tool: this.toolName,
      code: this.code,
      message: this.message,
      suggestion: GoldRushToolError.suggestion(this.code),
    });
  }

  static classify(err: unknown, defaultCode: GoldRushErrorCode) {
    if (err instanceof Response || (err as any)?.status) {
      const status = (err as any).status;
      if (status === 401) return { code: "UNAUTHORIZED" as const, message: "Invalid or missing GoldRush API key" };
      if (status === 403) return { code: "FORBIDDEN" as const, message: "Your plan does not support this endpoint" };
      if (status === 404) return { code: "NOT_FOUND" as const, message: "Chain or resource not found" };
      if (status === 429) return { code: "RATE_LIMITED" as const, message: "Rate limit exceeded — reduce request frequency" };
      if (status >= 500) return { code: "UPSTREAM_ERROR" as const, message: "GoldRush API server error — retry shortly" };
    }
    return { code: defaultCode, message: String(err) };
  }

  static suggestion(code: GoldRushErrorCode): string {
    const suggestions: Record<GoldRushErrorCode, string> = {
      UNAUTHORIZED: "Check that GOLDRUSH_API_KEY is set and valid at https://goldrush.dev",
      FORBIDDEN: "Upgrade your GoldRush plan at https://goldrush.dev/pricing",
      NOT_FOUND: "Verify the chain name is correct using the goldrush_chains tool",
      RATE_LIMITED: "Reduce parallel tool calls or add delays between requests",
      CHAIN_NOT_SUPPORTED: "Use goldrush_chains to list all supported chain slugs",
      INVALID_PARAMS: "Review the tool's parameter schema and correct the input",
      TIMEOUT: "Retry the request; if persistent, contact GoldRush support",
      UPSTREAM_ERROR: "Retry with exponential backoff; check https://status.covalenthq.com",
      TRUNCATED: "Response was truncated — use pagination parameters to fetch specific pages",
      UNKNOWN: "An unexpected error occurred; check logs for details",
    };
    return suggestions[code];
  }
}
```

### 9.2 Retry Strategy

- **Retries:** 3 attempts for 5xx errors only (not 4xx — client errors don't benefit from retry)
- **Backoff:** Exponential with jitter — `Math.min(1000 * 2^attempt + jitter, 10000)` ms
- **Timeout:** 30s per request (configurable via `GoldRushToolkitConfig.timeout`)
- **Circuit breaker:** Not in v1.0; planned for v1.1 if adoption warrants it

### 9.3 Agent-Friendly Error Format

Every error returned from a tool is a JSON string, never a thrown exception. This is critical because LLM agents receive tool outputs as strings — a thrown exception may crash the agent loop instead of letting the LLM respond gracefully.

```json
{
  "error": true,
  "tool": "goldrush_token_balances",
  "code": "NOT_FOUND",
  "message": "[goldrush_token_balances] Chain or resource not found",
  "suggestion": "Verify the chain name is correct using the goldrush_chains tool"
}
```

---

## 10. Rate Limiting & Caching

### 10.1 GoldRush Rate Limits

| Tier | Requests/Month | Requests/Second |
|---|---|---|
| Free | 100,000 | 5 |
| Growth | Higher | Higher |
| Enterprise | Custom | Custom |

### 10.2 Caching Strategy (v1.0)

In v1.0, caching is **not built into the package**. Rationale:
- LangChain has its own caching layer (`langchain/cache`) that consumers can configure
- Caching requirements vary significantly by use case (real-time trading vs. research)
- Adding cache introduces state management complexity

**Recommended consumer-side approach:**
```typescript
import { InMemoryCache } from "@langchain/core/caches";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  cache: new InMemoryCache(), // or RedisCache, UpstashCache, etc.
});
```

### 10.3 Rate Limit Handling in Tools

Each tool respects the 429 response and:
1. Returns `GoldRushToolError` with code `RATE_LIMITED`
2. Includes `Retry-After` header value in the error message if present
3. Does **not** retry on 429 (that is the consumer's responsibility via LangChain's retry config)

### 10.4 Request Batching (v1.1 Roadmap)

The `goldrush_multichain_transactions` and `goldrush_multichain_balances` tools already batch internally. Future v1.1 work may add:
- Automatic request queuing for agents making many parallel tool calls
- Token bucket rate limiter configurable via `GoldRushToolkitConfig`

---

## 11. Testing Strategy

### 11.1 Test Layers

```
Unit Tests (Vitest)
  └── Schema validation (every Zod schema, valid and invalid inputs)
  └── Utility functions (formatResponse, truncate, paginate)
  └── Error classification logic

Integration Tests (Vitest + MSW)
  └── Each of 37 tools against recorded HTTP fixtures
  └── Pagination behavior
  └── Error handling (401, 404, 429, 500)
  └── Response truncation

E2E Tests (gated, requires GOLDRUSH_API_KEY)
  └── Smoke test: one call per service against live API
  └── Agent integration test: wallet analyst completes a full task
```

### 11.2 Test Coverage Targets

| Layer | Target |
|---|---|
| Unit (schema + utils) | 100% |
| Integration (fixtures) | 100% of tools |
| E2E (live API) | 1 call per service group |

### 11.3 MSW Fixture Strategy

All integration tests use [MSW (Mock Service Worker)](https://mswjs.io/) to intercept HTTP requests and return pre-recorded GoldRush API responses. This means:
- Tests pass in CI without a real API key
- Fixture responses are committed to the repo under `tests/integration/fixtures/`
- Fixtures are regenerated periodically (or when API shape changes) using a `scripts/record-fixtures.ts` script that requires a real API key

### 11.4 Test File Naming Convention

```
tests/unit/schemas/balance/token-balances.test.ts
tests/unit/schemas/transaction/transaction.test.ts
tests/integration/tools/balance/token-balances.test.ts
tests/e2e/agent-smoke-test.ts
```

---

## 12. CI/CD & Publishing

### 12.1 GitHub Actions Workflows

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run test          # unit + integration (no API key needed)

# .github/workflows/e2e.yml
on:
  schedule: [{ cron: '0 6 * * 1' }]  # Monday 6am UTC — weekly smoke test
  workflow_dispatch:
jobs:
  e2e:
    runs-on: ubuntu-latest
    env:
      GOLDRUSH_API_KEY: ${{ secrets.GOLDRUSH_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run test:e2e

# .github/workflows/publish.yml
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', registry-url: 'https://registry.npmjs.org' }
      - run: npm ci && npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 12.2 Versioning Strategy

| Version | Trigger |
|---|---|
| Patch (1.0.x) | Bug fixes, fixture updates, doc corrections |
| Minor (1.x.0) | New tools (API additions), new options on existing tools |
| Major (x.0.0) | Breaking changes to tool schemas or toolkit API |

**Note:** GoldRush API additions → minor version bump. GoldRush API parameter changes that break existing schemas → patch version bump with deprecation warning.

### 12.3 Build Configuration (tsup)

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@langchain/core', 'langchain', '@covalenthq/client-sdk', 'zod'],
});
```

**Bundle size target:** < 50KB gzipped (tools are thin wrappers; bulk of logic is in the SDK)

---

## 13. Agent Integration Examples

### 13.1 Wallet Analyst Agent

```typescript
// examples/wallet-analyst-agent.ts
import { GoldRushToolkit } from "@covalenthq/langchain-goldrush";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const toolkit = new GoldRushToolkit({
  apiKey: process.env.GOLDRUSH_API_KEY!,
  services: ["balance", "transaction", "pricing"],
});

const agent = createReactAgent({
  llm: new ChatAnthropic({ model: "claude-sonnet-4-6" }),
  tools: toolkit.getTools(),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "Analyze the wallet vitalik.eth on Ethereum. What tokens does it hold, what's the portfolio value, and what were the last 5 transactions?"
  }]
});
```

### 13.2 NFT Curator Agent

```typescript
// examples/nft-curator-agent.ts
const toolkit = new GoldRushToolkit({
  apiKey: process.env.GOLDRUSH_API_KEY!,
  services: ["nft"],
});

// Agent can answer: "Does 0xABC own any Bored Apes?"
// Agent can answer: "Show me all NFTs owned by lens/stani.lens"
```

### 13.3 DeFi Security Auditor Agent

```typescript
// examples/onchain-auditor-agent.ts
const toolkit = new GoldRushToolkit({
  apiKey: process.env.GOLDRUSH_API_KEY!,
  services: ["security", "balance", "utility"],
});

// Agent can answer: "Audit my wallet for dangerous token approvals"
// Agent can answer: "Which approvals should I revoke immediately?"
```

### 13.4 Cross-Chain Portfolio Agent

```typescript
// examples/cross-chain-portfolio-agent.ts
const toolkit = new GoldRushToolkit({
  apiKey: process.env.GOLDRUSH_API_KEY!,
  services: ["cross-chain", "pricing"],
});

// Agent can answer: "What chains am I active on?"
// Agent can answer: "Give me my complete portfolio across all chains"
```

### 13.5 Bitcoin Portfolio Agent

```typescript
// examples/btc-portfolio-agent.ts
const toolkit = new GoldRushToolkit({
  apiKey: process.env.GOLDRUSH_API_KEY!,
  services: ["bitcoin"],
});

// Agent can answer: "What's my Bitcoin balance?"
// Agent can answer: "Show me my last 10 BTC transactions"
// Agent can answer: "What was my BTC balance on January 1st 2024?"
```

---

## 14. Configuration Reference

### 14.1 Environment Variables

```bash
# Required
GOLDRUSH_API_KEY=your_api_key_here      # Get at https://goldrush.dev

# Optional (for examples)
ANTHROPIC_API_KEY=your_key              # For Claude-powered examples
OPENAI_API_KEY=your_key                 # For OpenAI-powered examples
```

### 14.2 GoldRushToolkitConfig Options

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **required** | GoldRush API key |
| `defaultQuoteCurrency` | `string` | `"USD"` | Default currency for all pricing |
| `maxResponseSize` | `number` | `32000` | Max response chars before truncation |
| `services` | `string[]` | all 8 | Which service groups to include |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Retry attempts on 5xx errors |

### 14.3 Per-Tool Overrides

Individual tools can be retrieved and customized:

```typescript
const toolkit = new GoldRushToolkit({ apiKey: "..." });

// Get just the balance tools
const balanceTools = toolkit.getToolsByService("balance");

// Get a specific tool and override its description
const txTool = toolkit.getTool("goldrush_transaction");
txTool.description = "Custom description for my use case";

// Get all tools as an array
const allTools = toolkit.getTools();
```

---

## 15. Risks & Open Questions

### 15.1 Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| GoldRush API schema changes break tool Zod schemas | Medium | Low | Pin `@covalenthq/client-sdk` version; monitor changelog; weekly E2E tests |
| LLM hallucinates unsupported chain names | Medium | Medium | `ChainNameEnum` Zod validation rejects invalid chains before hitting API |
| Response size causes LLM context overflow | High | Medium | Truncation at 32KB + `truncated: true` flag + pagination guidance in error |
| API key exposed in LangChain traces | High | Low | Sanitize `Authorization` header from LangSmith/LangFuse traces; document in README |
| Rate limits hit in multi-agent workflows | Medium | Medium | 429 error returns `RATE_LIMITED` with suggestion; consumer adds rate limiter |
| `@covalenthq/client-sdk` peer dep conflicts | Low | Low | Mark as peerDep with wide version range; test against latest |
| Bitcoin HD wallet endpoints differ structurally from EVM | Low | Low | Separate `bitcoin` service module avoids cross-contamination |

### 15.2 Open Questions

| # | Question | Decision Owner | Target Date |
|---|---|---|---|
| OQ1 | Should we support LangChain v0.1 (legacy) in addition to v0.2+ (new `@langchain/core`)? | TPM | Before Phase 1 kickoff |
| OQ2 | Should the `ChainNameEnum` be a static list or fetched dynamically at toolkit init? Static = fast/offline; dynamic = always up-to-date | Backend Lead | Phase 1 kickoff |
| OQ3 | Should we implement a `goldrush_bulk_query` tool that executes multiple endpoint calls in parallel given natural language? | Product | v1.1 scoping |
| OQ4 | Should response formatting be configurable (full JSON vs. summarized Markdown)? | Developer Advocate | Phase 2 kickoff |
| OQ5 | Will GoldRush DEX/OHLCV endpoints be added to the REST API surface (currently WebSocket only)? | GoldRush API Team | Ongoing |
| OQ6 | Should we publish a `langchain-goldrush` Python package for the Python LangChain ecosystem? | TPM | Post v1.0 GA |

---

## Appendix A — Supported Chain Slugs (Key Examples)

The full list is fetched from `GET /v1/chains/`. Key slugs:

| Network | Slug |
|---|---|
| Ethereum Mainnet | `eth-mainnet` |
| Polygon PoS | `matic-mainnet` |
| BNB Smart Chain | `bsc-mainnet` |
| Avalanche C-Chain | `avalanche-mainnet` |
| Fantom Opera | `fantom-mainnet` |
| Arbitrum One | `arbitrum-mainnet` |
| Optimism | `optimism-mainnet` |
| Base | `base-mainnet` |
| Linea | `linea-mainnet` |
| zkSync Era | `zksync-mainnet` |
| Scroll | `scroll-mainnet` |
| Mantle | `mantle-mainnet` |
| Moonbeam | `moonbeam-mainnet` |
| Gnosis Chain | `gnosis-mainnet` |
| Celo | `celo-mainnet` |
| Aurora | `aurora-mainnet` |
| Cronos | `cronos-mainnet` |
| Bitcoin | `btc-mainnet` |
| Solana | `solana-mainnet` |

---

## Appendix B — GoldRush SDK Service Mapping

| Tool Service | GoldRush SDK Service | SDK Import |
|---|---|---|
| `cross-chain` | `AllChainsService` | `client.AllChainsService` |
| `balance` | `BalanceService` | `client.BalanceService` |
| `transaction` | `TransactionService` | `client.TransactionService` |
| `nft` | `NftService` | `client.NftService` |
| `security` | `SecurityService` | `client.SecurityService` |
| `bitcoin` | `BitcoinService` | `client.BitcoinService` |
| `pricing` | `PricingService` | `client.PricingService` |
| `utility` | `BaseService` | `client.BaseService` |

---

## Appendix C — Dependency Matrix

| Dependency | Type | Version | Reason |
|---|---|---|---|
| `@covalenthq/client-sdk` | peer | `^3.0.0` | Official GoldRush API client |
| `@langchain/core` | peer | `^0.2.0` | LangChain core (StructuredTool, etc.) |
| `zod` | peer | `^3.0.0` | Schema validation (LangChain requirement) |
| `langchain` | dev | `^0.2.0` | For examples and e2e tests only |
| `@langchain/anthropic` | dev | `^0.2.0` | For Claude-powered examples |
| `vitest` | dev | `^2.0.0` | Unit and integration testing |
| `msw` | dev | `^2.0.0` | HTTP fixture mocking |
| `tsup` | dev | `^8.0.0` | Dual CJS/ESM build |
| `typescript` | dev | `^5.4.0` | TypeScript compiler |

---

*End of Plan — v1.0 | Last updated: 2026-03-17*
