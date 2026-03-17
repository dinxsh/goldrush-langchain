import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class TransactionTool extends StructuredTool {
  name = "goldrush_transaction";
  description = `Fetch a single transaction by hash with full decoded log events.
Returns from/to addresses, value, gas, status, block number, timestamp, and decoded event logs.
On Ethereum mainnet, also optionally returns internal transactions, state changes, and method ID.
Use when: user wants to understand what a transaction did, parse a tx hash, lookup a transfer, or debug a contract interaction.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    txHash: z
      .string()
      .min(1)
      .describe("Transaction hash (0x...)"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
    noLogs: z
      .boolean()
      .optional()
      .default(false)
      .describe("Exclude event logs for a faster response (default: false)"),
    withInternal: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include internal traces — Ethereum mainnet only (default: false)"),
    withState: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include state changes — Ethereum mainnet only (default: false)"),
    withInputData: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include raw input data — Ethereum mainnet only (default: false)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getTransaction(
          input.chainName,
          input.txHash,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            noLogs: input.noLogs,
            withInternal: input.withInternal,
            withState: input.withState,
            withInputData: input.withInputData,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
