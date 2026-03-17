import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class BlockHashTransactionsTool extends StructuredTool {
  name = "goldrush_block_hash_transactions";
  description = `Fetch all transactions in a block identified by its block hash (not block number).
Returns all transactions with decoded log events for that block.
Use when: user has a block hash (0x...) rather than a block number and wants its transactions.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    blockHash: z
      .string()
      .min(1)
      .describe("Block hash (0x...) — the unique hash identifier of the block"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getTransactionsForBlockHashByPage(
          input.chainName,
          input.blockHash,
          0
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
