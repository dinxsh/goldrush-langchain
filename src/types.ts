import { z } from "zod";

// ─── Chain Name Enum ──────────────────────────────────────────────────────────
// Sourced from GET /v1/chains/ — key network slugs. Full list can be regenerated
// via: npm run generate:chains (requires GOLDRUSH_API_KEY)
export const ChainNameEnum = z.enum([
  // Ethereum
  "eth-mainnet",
  "eth-sepolia",
  "eth-holesky",
  // Polygon
  "matic-mainnet",
  "polygon-amoy-testnet",
  // BNB Chain
  "bsc-mainnet",
  "bsc-testnet",
  "bnb-opbnb-mainnet",
  // Avalanche
  "avalanche-mainnet",
  "avalanche-testnet",
  // Fantom
  "fantom-mainnet",
  "fantom-testnet",
  // Arbitrum
  "arbitrum-mainnet",
  "arbitrum-nova-mainnet",
  "arbitrum-sepolia",
  // Optimism
  "optimism-mainnet",
  "optimism-sepolia",
  // Base
  "base-mainnet",
  "base-sepolia-testnet",
  // Linea
  "linea-mainnet",
  "linea-sepolia-testnet",
  // zkSync
  "zksync-mainnet",
  // Scroll
  "scroll-mainnet",
  // Mantle
  "mantle-mainnet",
  // Moonbeam
  "moonbeam-mainnet",
  "moonbeam-moonriver",
  // Gnosis
  "gnosis-mainnet",
  "gnosis-testnet",
  // Celo
  "celo-mainnet",
  // Cronos zkEVM
  "cronos-zkevm-mainnet",
  // Oasis
  "oasis-sapphire-mainnet",
  "emerald-paratime-mainnet",
  // Solana & Bitcoin
  "solana-mainnet",
  "btc-mainnet",
  // Sky Mavis
  "axie-mainnet",
  // Layer 2 / Alt-L1
  "blast-mainnet",
  "taiko-mainnet",
  "ink-mainnet",
  "ink-sepolia-testnet",
  "unichain-mainnet",
  "unichain-sepolia-testnet",
  "zetachain-mainnet",
  "viction-mainnet",
  // New chains
  "monad-testnet",
  "monad-mainnet",
  "megaeth-mainnet",
  "berachain-mainnet",
  "berachain-testnet",
  "hypercore-mainnet",
  "plasma-mainnet",
  "plasma-testnet",
  "arc-testnet",
  "adi-testnet",
  "adi-mainnet",
  "canto-mainnet",
  "hyperevm-mainnet",
  "redstone-mainnet",
  "sei-mainnet",
  "apechain-mainnet",
  "sonic-mainnet",
  "world-mainnet",
  "world-sepolia-testnet",
  "manta-sepolia-testnet",
]);

export type ChainName = z.infer<typeof ChainNameEnum>;

// ─── Quote Currency ───────────────────────────────────────────────────────────
export const QuoteCurrencyEnum = z.enum([
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR", "BTC", "ETH",
]).default("USD");

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  has_more: boolean;
  page_number: number;
  page_size: number;
  total_count: number | null;
}

// ─── GoldRush API Response Envelope ──────────────────────────────────────────
export interface GoldRushApiResponse<T = unknown> {
  data: T | null;
  error: boolean;
  error_message: string | null;
  error_code: number | null;
}

// ─── Formatted Tool Response (returned to LLM) ───────────────────────────────
export interface FormattedToolResponse {
  tool: string;
  success: boolean;
  timestamp: string;
  truncated: boolean;
  data: unknown;
  pagination?: PaginationMeta;
  metadata?: Record<string, unknown>;
}

// ─── Toolkit Configuration ────────────────────────────────────────────────────
export type ServiceGroup =
  | "cross-chain"
  | "balance"
  | "transaction"
  | "nft"
  | "security"
  | "bitcoin"
  | "pricing"
  | "utility";

export interface GoldRushToolkitConfig {
  /** GoldRush API key — get one at https://goldrush.dev */
  apiKey: string;
  /** Default quote currency for all pricing fields. Default: "USD" */
  defaultQuoteCurrency?: string;
  /** Max response characters before truncation. Default: 32000 */
  maxResponseSize?: number;
  /** Which service groups to include. Default: all 8 */
  services?: ServiceGroup[];
  /** Per-request timeout in ms. Default: 30000 */
  timeout?: number;
  /** Retry count on 5xx errors. Default: 3 */
  retries?: number;
}

// ─── Error Codes ─────────────────────────────────────────────────────────────
export type GoldRushErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CHAIN_NOT_SUPPORTED"
  | "INVALID_PARAMS"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "UNKNOWN";
