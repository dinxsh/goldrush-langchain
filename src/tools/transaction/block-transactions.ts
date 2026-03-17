import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class BlockTransactionsTool extends StructuredTool {
  name = "goldrush_block_transactions";
  description = `Fetch all transactions in a specific block with decoded log events. Paginated.
Use 'latest' as blockHeight to get the most recent block's transactions.
Returns all transactions from that block with full event log decoding.
Use when: user wants to analyze a block, find MEV activity, or browse block-level on-chain activity.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    blockHeight: z
      .union([z.literal("latest"), z.number().int().positive()])
      .describe("Block number or 'latest' for the most recent block"),
    page: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Page number, 0-indexed (default: 0)"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
    noLogs: z
      .boolean()
      .optional()
      .default(false)
      .describe("Exclude event logs for faster response (default: false)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getTransactionsForBlockByPage(
          input.chainName,
          input.blockHeight,
          input.page,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            noLogs: input.noLogs,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
