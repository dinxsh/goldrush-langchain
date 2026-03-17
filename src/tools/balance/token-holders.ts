import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class TokenHoldersTool extends StructuredTool {
  name = "goldrush_token_holders";
  description = `Get a paginated list of current or historical holders of an ERC20 or ERC721 token.
Returns holder wallet addresses, token balances, and percentage of total supply owned.
Supports historical snapshots by block height or date.
Use when: user asks about token distribution, whale holders, governance participation, or who owns a token.`;

  schema = z
    .object({
      chainName: ChainNameEnum.describe("Blockchain network slug"),
      tokenAddress: z
        .string()
        .min(1)
        .describe("ERC20 or ERC721 token contract address (or ENS/domain name)"),
      blockHeight: z
        .union([z.string(), z.number().int().positive()])
        .optional()
        .describe("Historical block height for snapshot (mutually exclusive with date)"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
        .optional()
        .describe("Historical date for snapshot in YYYY-MM-DD format (mutually exclusive with blockHeight)"),
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
        .describe("Page number, 0-indexed (default: 0)"),
    })
    .refine(
      (d) => !(d.blockHeight !== undefined && d.date !== undefined),
      { message: "Provide either blockHeight or date, not both" }
    );

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { pageSize, pageNumber } = clampPage(input.pageSize, input.pageNumber);
      const result = await this.client.call(this.name, () =>
        this.client.BalanceService.getTokenHoldersV2ForTokenAddressByPage(
          input.chainName,
          input.tokenAddress,
          {
            blockHeight: input.blockHeight as string | undefined,
            date: input.date,
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
