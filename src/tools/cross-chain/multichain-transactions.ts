import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class MultichainTransactionsTool extends StructuredTool {
  name = "goldrush_multichain_transactions";
  description = `Fetch paginated transactions for up to 10 EVM addresses across up to 10 EVM chains with one API call.
Ideal for building cross-chain activity feeds. Returns decoded log events optionally.
Use when: user wants activity across multiple wallets or chains simultaneously, or needs a unified transaction feed.`;

  schema = z.object({
    addresses: z
      .array(z.string().min(1))
      .max(10)
      .optional()
      .describe("Wallet addresses to query (up to 10)"),
    chains: z
      .array(z.string())
      .max(10)
      .optional()
      .describe("Chain slugs to query (up to 10, e.g. ['eth-mainnet', 'base-mainnet'])"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Max transactions per page (default: 10, max: 100)"),
    before: z
      .string()
      .optional()
      .describe("Pagination cursor (before) from a previous response"),
    after: z
      .string()
      .optional()
      .describe("Pagination cursor (after) from a previous response"),
    withLogs: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include raw event logs in response (default: false)"),
    withDecodedLogs: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include decoded event logs (requires withLogs: true)"),
    quoteCurrency: z
      .string()
      .optional()
      .default("USD")
      .describe("Currency for value conversion (default: USD)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.AllChainsService.getMultiChainMultiAddressTransactions({
          addresses: input.addresses,
          chains: input.chains as unknown as import("@covalenthq/client-sdk").ChainName[] | undefined,
          limit: input.limit,
          before: input.before,
          after: input.after,
          withLogs: input.withLogs,
          withDecodedLogs: input.withDecodedLogs,
          quoteCurrency: input.quoteCurrency as "USD",
        })
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
