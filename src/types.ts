import { z } from "zod";

// ─── Chain Name Enum ──────────────────────────────────────────────────────────
// Sourced from GET /v1/chains/ — key network slugs. Full list can be regenerated
// via: npm run generate:chains (requires GOLDRUSH_API_KEY)
export const ChainNameEnum = z.enum([
  "eth-mainnet",
  "eth-sepolia",
  "eth-holesky",
  "matic-mainnet",
  "matic-mumbai",
  "bsc-mainnet",
  "bsc-testnet",
  "avalanche-mainnet",
  "avalanche-testnet",
  "fantom-mainnet",
  "fantom-testnet",
  "arbitrum-mainnet",
  "arbitrum-sepolia",
  "optimism-mainnet",
  "optimism-sepolia",
  "base-mainnet",
  "base-sepolia",
  "linea-mainnet",
  "linea-sepolia",
  "zksync-mainnet",
  "zksync-sepolia",
  "scroll-mainnet",
  "scroll-sepolia",
  "mantle-mainnet",
  "mantle-sepolia",
  "moonbeam-mainnet",
  "moonriver-mainnet",
  "moonbeam-moonbase-alpha",
  "gnosis-mainnet",
  "gnosis-chiado-testnet",
  "celo-mainnet",
  "celo-alfajores-testnet",
  "aurora-mainnet",
  "aurora-testnet",
  "cronos-mainnet",
  "cronos-testnet",
  "metis-mainnet",
  "boba-mainnet",
  "rsk-mainnet",
  "rsk-testnet",
  "evmos-mainnet",
  "evmos-testnet",
  "astar-mainnet",
  "astar-shibuya-testnet",
  "palm-mainnet",
  "palm-testnet",
  "klaytn-mainnet",
  "klaytn-baobab-testnet",
  "solana-mainnet",
  "btc-mainnet",
  "defi-kingdoms-mainnet",
  "swimmer-mainnet",
  "axie-mainnet",
  "emerald-paratime-mainnet",
  "emerald-paratime-testnet",
  "arbitrum-nova-mainnet",
  "kcc-mainnet",
  "sx-mainnet",
  "milkomeda-mainnet",
  "meter-mainnet",
  "oasis-sapphire-mainnet",
  "oasis-sapphire-testnet",
  "zora-mainnet",
  "zora-sepolia-testnet",
  "polygon-zkevm-mainnet",
  "polygon-zkevm-cardona-testnet",
  "mode-mainnet",
  "mode-sepolia-testnet",
  "blast-mainnet",
  "blast-sepolia-testnet",
  "fraxtal-mainnet",
  "fraxtal-holesky-testnet",
  "taiko-mainnet",
  "taiko-hekla-testnet",
  "cyber-mainnet",
  "cyber-testnet",
  "zetachain-mainnet",
  "zetachain-testnet",
  "dymension-mainnet",
  "berachain-mainnet",
  "berachain-bepolia-testnet",
  "ink-mainnet",
  "ink-sepolia-testnet",
  "unichain-mainnet",
  "unichain-sepolia-testnet",
  "soneium-mainnet",
  "soneium-minato-testnet",
  "story-mainnet",
  "story-testnet",
  "shape-mainnet",
  "shape-sepolia-testnet",
  "worldchain-mainnet",
  "worldchain-sepolia-testnet",
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
