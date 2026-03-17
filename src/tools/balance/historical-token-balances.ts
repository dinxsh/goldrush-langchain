import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class HistoricalTokenBalancesTool extends StructuredTool {
  name = "goldrush_historical_token_balances";
  description = `Fetch native and ERC20 token balances for an address at a specific historical block height or date.
Returns balances as they were at that exact point in time, with daily prices.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Use when: user asks about past holdings, time-travel portfolio, tax calculations, or balance at a specific date/block.
Note: provide either blockHeight OR date, not both.`;

  schema = z
    .object({
      chainName: ChainNameEnum.describe("Blockchain network slug"),
      address: z
        .string()
        .min(1)
        .describe("Wallet address or domain name"),
      quoteCurrency: z
        .string()
        .optional()
        .default("USD")
        .describe("Currency for value conversion (default: USD)"),
      nft: z.boolean().optional().default(false).describe("Include NFT balances"),
      noNftFetch: z.boolean().optional().default(true).describe("Skip NFT metadata fetch"),
      noSpam: z.boolean().optional().default(true).describe("Filter spam tokens"),
      noNftAssetMetadata: z.boolean().optional().default(true).describe("Skip NFT asset metadata"),
      blockHeight: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Historical block number for snapshot (mutually exclusive with date)"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
        .optional()
        .describe("Historical date for snapshot in YYYY-MM-DD format (mutually exclusive with blockHeight)"),
    })
    .refine(
      (d) => !(d.blockHeight !== undefined && d.date !== undefined),
      { message: "Provide either blockHeight or date, not both" }
    );

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BalanceService.getHistoricalTokenBalancesForWalletAddress(
          input.chainName,
          input.address,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            nft: input.nft,
            noNftFetch: input.noNftFetch,
            noSpam: input.noSpam,
            noNftAssetMetadata: input.noNftAssetMetadata,
            blockHeight: input.blockHeight,
            date: input.date,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
