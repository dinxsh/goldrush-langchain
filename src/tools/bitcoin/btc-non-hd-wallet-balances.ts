import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class BtcNonHdWalletBalancesTool extends StructuredTool {
  name = "goldrush_btc_non_hd_wallet_balances";
  description = `Fetch the current Bitcoin balance for a regular (non-HD) Bitcoin address with spot price and metadata.
Supports P2PKH addresses (start with '1'), P2SH addresses (start with '3'), and Bech32/SegWit (start with 'bc1').
Returns confirmed balance, unconfirmed balance, and USD value.
Use when: user provides a Bitcoin address and wants to know its BTC balance.`;

  schema = z.object({
    walletAddress: z
      .string()
      .min(1)
      .describe("Bitcoin address (P2PKH starting with '1', P2SH starting with '3', or Bech32 starting with 'bc1')"),
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
        this.client.BitcoinService.getBitcoinNonHdWalletBalances(
          input.walletAddress,
          { quoteCurrency: input.quoteCurrency as "USD" }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
