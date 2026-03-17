import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class NativeTokenBalanceTool extends StructuredTool {
  name = "goldrush_native_token_balance";
  description = `Lightweight endpoint to get only the native token balance (ETH, MATIC, BNB, AVAX, etc.) for a wallet address.
Much faster than the full token balances query — no ERC20 scanning.
Supports ENS names, RNS, Lens handles, and Unstoppable Domains.
Optionally fetch balance at a historical block height.
Use when: user asks specifically about ETH balance, gas funds, native token only, or needs a quick balance check.`;

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
    blockHeight: z
      .union([z.string(), z.number().int().positive()])
      .optional()
      .describe("Historical block height for snapshot (optional)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BalanceService.getNativeTokenBalance(
          input.chainName,
          input.walletAddress,
          {
            quoteCurrency: input.quoteCurrency as "USD",
            blockHeight: input.blockHeight as string | undefined,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
