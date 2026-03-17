import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class EventsByContractTool extends StructuredTool {
  name = "goldrush_events_by_contract";
  description = `Fetch all event logs emitted by a specific smart contract address on a chain.
Returns decoded log events with event names, parameters, and block metadata.
Useful for monitoring a particular contract's on-chain interactions and activity.
Use when: user wants to monitor a specific contract, track DeFi protocol events, or analyze a dApp's activity.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    contractAddress: z
      .string()
      .min(1)
      .describe("Smart contract address to fetch events from"),
    startingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Starting block number"),
    endingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Ending block number"),
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
        this.client.BaseService.getLogEventsByAddressByPage(
          input.chainName,
          input.contractAddress,
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
