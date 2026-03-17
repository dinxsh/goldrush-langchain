import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class BtcHistoricalBalancesTool extends StructuredTool {
  name = "goldrush_btc_historical_balances";
  description = `Fetch the historical Bitcoin balance for an address at a specific block height or date.
Includes historical daily prices. Useful for tax calculations, historical audits, and portfolio tracking.
Use when: user asks about past BTC holdings, balance at a specific date, or tax basis calculations.
Note: provide either blockHeight OR date, not both.`;

  schema = z
    .object({
      walletAddress: z
        .string()
        .min(1)
        .describe("Bitcoin address"),
      blockHeight: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Bitcoin block height for snapshot (mutually exclusive with date)"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
        .optional()
        .describe("Date for snapshot in YYYY-MM-DD format (mutually exclusive with blockHeight)"),
      quoteCurrency: z
        .string()
        .optional()
        .default("USD")
        .describe("Currency for value conversion (default: USD)"),
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
        this.client.BitcoinService.getBitcoinHdWalletBalances(
          input.walletAddress,
          {
            quoteCurrency: input.quoteCurrency as "USD",
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
