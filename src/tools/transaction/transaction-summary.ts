import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class TransactionSummaryTool extends StructuredTool {
  name = "goldrush_transaction_summary";
  description = `Fetch a summary of on-chain activity for a wallet: earliest transaction date, latest transaction date,
total transaction count, gas expenditure statistics, and ERC20 token transfer count.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Use when: user wants an overview of a wallet's history, first/last activity dates, or total tx count.`;

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
    withGas: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include detailed gas usage statistics (default: false)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getTransactionSummary(
          input.chainName,
          input.walletAddress,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            withGas: input.withGas,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
