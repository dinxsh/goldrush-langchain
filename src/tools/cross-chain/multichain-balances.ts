import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class MultichainBalancesTool extends StructuredTool {
  name = "goldrush_multichain_balances";
  description = `Fetch spot and historical native/token balances for one address across up to 10 EVM chains with a single API call.
Returns paginated balance data per chain including token name, symbol, balance, and USD value.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Use when: user wants a cross-chain portfolio overview, total holdings across chains.`;

  schema = z.object({
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    chains: z
      .array(z.string())
      .max(10)
      .optional()
      .describe("Chain slugs to query (e.g. ['eth-mainnet', 'matic-mainnet']). Default: all supported EVM chains"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
    before: z
      .string()
      .optional()
      .describe("Pagination cursor — value from previous response to get next page"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Max balances to return per page (default: 10, max: 100)"),
    cutoffTimestamp: z
      .number()
      .int()
      .optional()
      .describe("Unix timestamp — only include tokens with activity after this time"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.AllChainsService.getMultiChainBalances(input.walletAddress, {
          quoteCurrency: input.quoteCurrency as "USD",
          chains: input.chains as unknown as import("@covalenthq/client-sdk").ChainName[] | undefined,
          before: input.before,
          limit: input.limit,
          cutoffTimestamp: input.cutoffTimestamp,
        })
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
