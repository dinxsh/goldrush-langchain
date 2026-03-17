import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class RecentTransactionsTool extends StructuredTool {
  name = "goldrush_recent_transactions";
  description = `Fetch the most recent transactions for a wallet address.
Returns latest transactions with decoded log events. For paginated access, use goldrush_paginated_transactions.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Use when: user wants latest activity, recent sends/receives, or what a wallet did recently.`;

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
    noLogs: z
      .boolean()
      .optional()
      .default(false)
      .describe("Exclude event logs for faster response (default: false)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getAllTransactionsForAddressByPage(
          input.chainName,
          input.walletAddress,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            noLogs: input.noLogs,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
