import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";
import { clampPage } from "../../utils/paginate.js";

export class Erc20TransfersTool extends StructuredTool {
  name = "goldrush_erc20_token_transfers";
  description = `Fetch ERC20 token transfer events (in and out) for a wallet address with historical prices.
Returns sender address, receiver address, token amount, token contract, and USD value at transfer time.
Can filter to a specific token contract address. Paginated — default 10 results per page.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Use when: user asks about transfer history, token flow analysis, specific token movements, or received/sent tokens.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
    contractAddress: z
      .string()
      .optional()
      .describe("Filter transfers to a specific ERC20 token contract address"),
    startingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Start of block range for filtering transfers"),
    endingBlock: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("End of block range for filtering transfers"),
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
        this.client.BalanceService.getErc20TransfersForWalletAddressByPage(
          input.chainName,
          input.walletAddress,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            contractAddress: input.contractAddress,
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
