import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class TokenBalancesTool extends StructuredTool {
  name = "goldrush_token_balances";
  description = `Fetch all native and ERC20 tokens held by a wallet address on a specific blockchain.
Returns token name, symbol, balance, decimals, contract address, and current USD value.
Supports ENS names (e.g. 'vitalik.eth'), RNS, Lens handles, and Unstoppable Domains.
Use when: user asks about wallet holdings, token portfolio, asset balances, or net worth on a single chain.`;

  schema = z.object({
    chainName: ChainNameEnum.describe(
      "Blockchain network slug (e.g. 'eth-mainnet', 'matic-mainnet', 'base-mainnet')"
    ),
    address: z
      .string()
      .min(1)
      .describe("Wallet address or domain name (ENS, RNS, Lens, Unstoppable Domain)"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
    nft: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include NFT balances in response (default: false)"),
    noNftFetch: z
      .boolean()
      .optional()
      .default(true)
      .describe("Skip NFT metadata fetch for faster response (default: true)"),
    noSpam: z
      .boolean()
      .optional()
      .default(true)
      .describe("Filter out spam and scam tokens (default: true)"),
    noNftAssetMetadata: z
      .boolean()
      .optional()
      .default(true)
      .describe("Skip NFT asset metadata fetch (default: true)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BalanceService.getTokenBalancesForWalletAddress(
          input.chainName,
          input.address,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            noSpam: input.noSpam,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
