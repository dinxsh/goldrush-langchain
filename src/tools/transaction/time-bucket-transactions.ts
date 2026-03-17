import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class TimeBucketTransactionsTool extends StructuredTool {
  name = "goldrush_time_bucket_transactions";
  description = `Fetch all transactions for a wallet within a specific 15-minute time bucket.
The timeBucket is a Unix timestamp rounded down to the nearest 15-minute interval.
Returns all transactions including decoded log events during that 15-minute window.
Use when: user wants to analyze activity during a specific time window, or investigate a burst of activity.
Example: timeBucket for 2024-01-15 14:30 UTC = 1705329000`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address"),
    timeBucket: z
      .number()
      .int()
      .positive()
      .describe(
        "Unix timestamp rounded to 15-minute interval start (e.g., 1705329000 for 2024-01-15 14:30 UTC)"
      ),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getTimeBucketTransactionsForAddress(
          input.chainName,
          input.walletAddress,
          input.timeBucket
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
