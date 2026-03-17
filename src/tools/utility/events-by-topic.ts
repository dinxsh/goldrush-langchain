import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class EventsByTopicTool extends StructuredTool {
  name = "goldrush_events_by_topic";
  description = `Fetch all event logs sharing the same topic hash across all contracts on a chain.
Useful for cross-sectional analysis — e.g., find ALL Transfer events across ALL ERC20 contracts.
Common topic hashes:
  Transfer (ERC20):  0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
  Approval (ERC20):  0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925
  Transfer (ERC721): 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
Use when: user wants all occurrences of a specific event type across the chain.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    topicHash: z
      .string()
      .min(1)
      .describe("Event topic hash (keccak256 of event signature, e.g. 0xddf252...)"),
    startingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Starting block for range"),
    endingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Ending block for range"),
    senderAddress: z
      .string()
      .optional()
      .describe("Filter events from a specific contract address"),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Results per page (default: 10)"),
    pageNumber: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0)
      .describe("Page number, 0-indexed"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { pageSize, pageNumber } = clampPage(input.pageSize, input.pageNumber);
      const result = await this.client.call(this.name, () =>
        this.client.BaseService.getLogEventsByTopicHashByPage(
          input.chainName,
          input.topicHash,
          {
            startingBlock: input.startingBlock,
            endingBlock: input.endingBlock,
            pageSize,
            pageNumber,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
