import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class BlockTool extends StructuredTool {
  name = "goldrush_block";
  description = `Fetch details for a single block on a chain.
Returns block number, timestamp, block hash, miner address, gas used, gas limit, and transaction count.
Use 'latest' to fetch the most recent block.
Use when: user asks about a specific block, wants block explorer data, or needs block timestamp for a given height.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    blockHeight: z
      .union([z.literal("latest"), z.number().int().positive()])
      .describe("Block number or 'latest' for the most recent block"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BaseService.getBlock(
          input.chainName,
          String(input.blockHeight)
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
