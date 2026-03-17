import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class HistoricalTokenPricesTool extends StructuredTool {
  name = "goldrush_historical_token_prices";
  description = `Get historical daily prices for an ERC20 token or native chain token between two dates.
Returns a price series with open, high, low, close values in the specified quote currency.
Use 'native' as contractAddress for the chain's native token (ETH on eth-mainnet, MATIC on matic-mainnet, etc.).
Supports large-cap ERC20 tokens.
Use when: user asks about price history, cost basis, P&L analysis, or token price at a specific date.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    quoteCurrency: z
      .string()
      .describe("Quote currency for prices (e.g. 'USD', 'EUR', 'BTC', 'ETH')"),
    contractAddress: z
      .string()
      .min(1)
      .describe("ERC20 token contract address, or 'native' for the chain's native token"),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .describe("Start date in YYYY-MM-DD format"),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .describe("End date in YYYY-MM-DD format"),
    pricesAtAsc: z
      .boolean()
      .optional()
      .default(false)
      .describe("Sort oldest-first (default: newest-first)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.PricingService.getTokenPrices(
          input.chainName,
          input.quoteCurrency as "USD",
          input.contractAddress,
          {
            from: input.from,
            to: input.to,
            pricesAtAsc: input.pricesAtAsc,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
