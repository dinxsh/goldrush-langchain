import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class BtcTransactionsTool extends StructuredTool {
  name = "goldrush_btc_transactions";
  description = `Fetch the full transaction history for a Bitcoin wallet address.
Returns inputs, outputs, amounts (in BTC and satoshis), confirmation count, and transaction IDs.
Paginated — default 10 results per page, most recent first.
Use when: user wants Bitcoin transaction history, sent/received BTC, or to audit a Bitcoin wallet.`;

  schema = z.object({
    address: z
      .string()
      .min(1)
      .describe("Bitcoin address"),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Results per page (default: 10, max: 100)"),
    pageNumber: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0)
      .describe("Page number, 0-indexed (default: 0 = most recent)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { pageSize, pageNumber } = clampPage(input.pageSize, input.pageNumber);
      const result = await this.client.call(this.name, () =>
        this.client.BitcoinService.getTransactionsForBtcAddress(
          { address: input.address, pageSize, pageNumber }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
