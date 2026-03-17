/**
 * @covalenthq/langchain-goldrush
 *
 * LangChain tools for the GoldRush (Covalent) on-chain data API.
 * Wraps 36 REST endpoints across 8 service groups as StructuredTool instances.
 *
 * @example
 * ```typescript
 * import { GoldRushToolkit } from "@covalenthq/langchain-goldrush";
 *
 * const toolkit = new GoldRushToolkit({ apiKey: process.env.GOLDRUSH_API_KEY! });
 * const tools = toolkit.getTools(); // all 36 tools
 * ```
 */

// Toolkit (main entrypoint)
export { GoldRushToolkit } from "./toolkit.js";

// Client
export { GoldRushClient } from "./client.js";

// Errors
export { GoldRushToolError } from "./errors.js";

// Types
export type {
  ChainName,
  ServiceGroup,
  GoldRushToolkitConfig,
  GoldRushErrorCode,
  FormattedToolResponse,
  PaginationMeta,
} from "./types.js";
export { ChainNameEnum } from "./types.js";

// Individual tools — cross-chain
export {
  AddressActivityTool,
  MultichainBalancesTool,
  MultichainTransactionsTool,
} from "./tools/cross-chain/index.js";

// Individual tools — balance
export {
  TokenBalancesTool,
  HistoricalTokenBalancesTool,
  NativeTokenBalanceTool,
  Erc20TransfersTool,
  HistoricalPortfolioTool,
  TokenHoldersTool,
} from "./tools/balance/index.js";

// Individual tools — transaction
export {
  TransactionTool,
  TransactionSummaryTool,
  BulkTransactionsTool,
  RecentTransactionsTool,
  PaginatedTransactionsTool,
  TimeBucketTransactionsTool,
  BlockTransactionsTool,
  BlockHashTransactionsTool,
} from "./tools/transaction/index.js";

// Individual tools — nft
export {
  NftBalancesTool,
  NftCheckOwnershipTool,
  NftCheckTokenOwnershipTool,
} from "./tools/nft/index.js";

// Individual tools — security
export { TokenApprovalsTool } from "./tools/security/index.js";

// Individual tools — bitcoin
export {
  BtcHdWalletBalancesTool,
  BtcNonHdWalletBalancesTool,
  BtcHistoricalBalancesTool,
  BtcTransactionsTool,
} from "./tools/bitcoin/index.js";

// Individual tools — pricing
export {
  HistoricalTokenPricesTool,
  PoolSpotPricesTool,
  GasPricesTool,
} from "./tools/pricing/index.js";

// Individual tools — utility
export {
  EventsLatestBlockTool,
  EventsByTopicTool,
  EventsByContractTool,
  BlockTool,
  BlockHeightsByDateTool,
  ChainsTool,
  ChainsStatusTool,
  ResolveAddressTool,
} from "./tools/utility/index.js";
