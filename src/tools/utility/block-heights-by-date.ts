import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class BlockHeightsByDateTool extends StructuredTool {
  name = "goldrush_block_heights_by_date";
  description = `Get all block heights that were produced within a specific date range on a chain.
Useful for aligning calendar dates with block numbers for historical queries.
Use when: user has a date range and needs the corresponding block numbers to use in other historical queries.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .describe("Start date in YYYY-MM-DD format"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .describe("End date in YYYY-MM-DD format"),
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
        this.client.BaseService.getBlockHeightsByPage(
          input.chainName,
          input.startDate,
          input.endDate,
          { pageSize, pageNumber }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
