import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class HistoricalPortfolioTool extends StructuredTool {
  name = "goldrush_historical_portfolio";
  description = `Render a daily portfolio balance for an address broken down by token over a time range.
Returns a time-series of portfolio value in the quote currency, one data point per day.
Default lookback is 7 days (can be extended). Supports ENS, RNS, Lens, and Unstoppable Domains.
Use when: user asks about portfolio performance over time, P&L, net worth history, or token value changes.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
    days: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional()
      .default(7)
      .describe("Number of historical days to include in portfolio data (default: 7, max: 365)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BalanceService.getHistoricalPortfolioForWalletAddress(
          input.chainName,
          input.walletAddress,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            days: input.days,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
