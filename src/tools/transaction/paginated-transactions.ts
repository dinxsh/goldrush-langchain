import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class PaginatedTransactionsTool extends StructuredTool {
  name = "goldrush_paginated_transactions";
  description = `Fetch a specific page of transactions for a wallet address with decoded log events.
Page 0 is the most recent. Set blockSignedAtAsc: true to sort oldest-first.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Use when: user wants to browse transaction history page by page, or after goldrush_recent_transactions has_more: true.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    page: z
      .number()
      .int()
      .min(0)
      .describe("Page number, 0-indexed (page 0 = most recent transactions)"),
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
    blockSignedAtAsc: z
      .boolean()
      .optional()
      .default(false)
      .describe("Sort oldest-first (ascending by block timestamp). Default: newest-first"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.TransactionService.getPaginatedTransactionsForAddress(
          input.chainName,
          input.walletAddress,
          input.page,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            noLogs: input.noLogs,
            blockSignedAtAsc: input.blockSignedAtAsc,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
