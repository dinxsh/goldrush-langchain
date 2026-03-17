import type { StructuredTool } from "@langchain/core/tools";
import { GoldRushClient } from "./client.js";
import type { GoldRushToolkitConfig, ServiceGroup } from "./types.js";

// Cross-chain
import {
  AddressActivityTool,
  MultichainBalancesTool,
  MultichainTransactionsTool,
} from "./tools/cross-chain/index.js";

// Balance
import {
  TokenBalancesTool,
  HistoricalTokenBalancesTool,
  NativeTokenBalanceTool,
  Erc20TransfersTool,
  HistoricalPortfolioTool,
  TokenHoldersTool,
} from "./tools/balance/index.js";

// Transaction
import {
  TransactionTool,
  TransactionSummaryTool,
  BulkTransactionsTool,
  RecentTransactionsTool,
  PaginatedTransactionsTool,
  TimeBucketTransactionsTool,
  BlockTransactionsTool,
  BlockHashTransactionsTool,
} from "./tools/transaction/index.js";

// NFT
import {
  NftBalancesTool,
  NftCheckOwnershipTool,
  NftCheckTokenOwnershipTool,
} from "./tools/nft/index.js";

// Security
import { TokenApprovalsTool } from "./tools/security/index.js";

// Bitcoin
import {
  BtcHdWalletBalancesTool,
  BtcNonHdWalletBalancesTool,
  BtcHistoricalBalancesTool,
  BtcTransactionsTool,
} from "./tools/bitcoin/index.js";

// Pricing
import {
  HistoricalTokenPricesTool,
  PoolSpotPricesTool,
  GasPricesTool,
} from "./tools/pricing/index.js";

// Utility
import {
  EventsLatestBlockTool,
  EventsByTopicTool,
  EventsByContractTool,
  BlockTool,
  BlockHeightsByDateTool,
  ChainsTool,
  ChainsStatusTool,
  ResolveAddressTool,
} from "./tools/utility/index.js";

const ALL_SERVICES: ServiceGroup[] = [
  "cross-chain",
  "balance",
  "transaction",
  "nft",
  "security",
  "bitcoin",
  "pricing",
  "utility",
];

/**
 * GoldRushToolkit — register all 37 GoldRush API endpoints as LangChain tools
 * from a single API key.
 *
 * @example
 * ```typescript
 * import { GoldRushToolkit } from "@covalenthq/langchain-goldrush";
 * import { ChatAnthropic } from "@langchain/anthropic";
 * import { createReactAgent } from "@langchain/langgraph/prebuilt";
 *
 * const toolkit = new GoldRushToolkit({ apiKey: process.env.GOLDRUSH_API_KEY! });
 * const agent = createReactAgent({
 *   llm: new ChatAnthropic({ model: "claude-sonnet-4-6" }),
 *   tools: toolkit.getTools(),
 * });
 * ```
 */
export class GoldRushToolkit {
  private readonly client: GoldRushClient;
  private readonly services: ServiceGroup[];
  private _tools: StructuredTool[] | null = null;

  constructor(private readonly config: GoldRushToolkitConfig) {
    this.client = new GoldRushClient(config);
    this.services = config.services ?? ALL_SERVICES;
  }

  /**
   * Returns all tools for the configured service groups.
   * Result is memoized — safe to call multiple times.
   */
  getTools(): StructuredTool[] {
    if (this._tools) return this._tools;
    this._tools = this.buildTools();
    return this._tools;
  }

  /**
   * Returns tools for a specific service group only.
   */
  getToolsByService(service: ServiceGroup): StructuredTool[] {
    return this.buildToolsForService(service);
  }

  /**
   * Returns a single tool by its registered name.
   * Returns undefined if not found or service not included.
   */
  getTool(name: string): StructuredTool | undefined {
    return this.getTools().find((t) => t.name === name);
  }

  /** Total number of tools in this toolkit instance */
  get toolCount(): number {
    return this.getTools().length;
  }

  private buildTools(): StructuredTool[] {
    return this.services.flatMap((s) => this.buildToolsForService(s));
  }

  private buildToolsForService(service: ServiceGroup): StructuredTool[] {
    switch (service) {
      case "cross-chain":
        return [
          new AddressActivityTool(this.client),
          new MultichainBalancesTool(this.client),
          new MultichainTransactionsTool(this.client),
        ];

      case "balance":
        return [
          new TokenBalancesTool(this.client),
          new HistoricalTokenBalancesTool(this.client),
          new NativeTokenBalanceTool(this.client),
          new Erc20TransfersTool(this.client),
          new HistoricalPortfolioTool(this.client),
          new TokenHoldersTool(this.client),
        ];

      case "transaction":
        return [
          new TransactionTool(this.client),
          new TransactionSummaryTool(this.client),
          new BulkTransactionsTool(this.client),
          new RecentTransactionsTool(this.client),
          new PaginatedTransactionsTool(this.client),
          new TimeBucketTransactionsTool(this.client),
          new BlockTransactionsTool(this.client),
          new BlockHashTransactionsTool(this.client),
        ];

      case "nft":
        return [
          new NftBalancesTool(this.client),
          new NftCheckOwnershipTool(this.client),
          new NftCheckTokenOwnershipTool(this.client),
        ];

      case "security":
        return [new TokenApprovalsTool(this.client)];

      case "bitcoin":
        return [
          new BtcHdWalletBalancesTool(this.client),
          new BtcNonHdWalletBalancesTool(this.client),
          new BtcHistoricalBalancesTool(this.client),
          new BtcTransactionsTool(this.client),
        ];

      case "pricing":
        return [
          new HistoricalTokenPricesTool(this.client),
          new PoolSpotPricesTool(this.client),
          new GasPricesTool(this.client),
        ];

      case "utility":
        return [
          new EventsLatestBlockTool(this.client),
          new EventsByTopicTool(this.client),
          new EventsByContractTool(this.client),
          new BlockTool(this.client),
          new BlockHeightsByDateTool(this.client),
          new ChainsTool(this.client),
          new ChainsStatusTool(this.client),
          new ResolveAddressTool(this.client),
        ];

      default:
        return [];
    }
  }
}
