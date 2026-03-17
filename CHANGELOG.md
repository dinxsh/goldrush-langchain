# Changelog

All notable changes to `@covalenthq/langchain-goldrush` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-18

### Added
- 36 LangChain `StructuredTool` implementations covering all GoldRush API service groups:
  - **Balance** (6 tools): token balances, historical balances, native balance, ERC20 transfers, portfolio, token holders
  - **Transaction** (8 tools): recent, paginated, single, bulk, block hash, block number, summary, approvals
  - **NFT** (3 tools): balances, token IDs, token metadata
  - **Security** (1 tool): ERC20 token approvals
  - **Bitcoin** (4 tools): transactions, hd wallet, non-HD wallet, holders
  - **Pricing** (3 tools): historical token prices, pool spot prices, gas prices
  - **Utility** (8 tools): chains, chains status, block, block heights by date, events by contract, events by topic, events latest block, resolve address
  - **Cross-chain** (3 tools): address activity, multichain balances, multichain transactions
- `GoldRushToolkit` class for managing tools as a collection with service-level filtering
- `GoldRushClient` wrapper with configurable retry logic and exponential backoff
- BigInt-safe JSON serialization for SDK responses
- Zod schema validation for all tool inputs
- Full TypeScript types with CJS + ESM dual build output
- MSW-based test suite with 93 tests across 9 test files
