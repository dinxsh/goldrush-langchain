import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class EventsLatestBlockTool extends StructuredTool {
  name = "goldrush_events_latest_block";
  description = `Fetch all event logs from the latest block or a range of blocks on a chain.
Includes sender contract metadata and decoded log events.
Use when: user wants to monitor recent blockchain events, scan block activity, or observe real-time on-chain events.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    startingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Starting block number for range query (optional — defaults to latest block)"),
    endingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Ending block number for range query (optional)"),
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
        this.client.BaseService.getLogEventsByAddress(
          input.chainName,
          "",
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
