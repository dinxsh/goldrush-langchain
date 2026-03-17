import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class BtcHdWalletBalancesTool extends StructuredTool {
  name = "goldrush_btc_hd_wallet_balances";
  description = `Fetch Bitcoin balances for all active child addresses derived from an HD wallet extended public key (xpub).
Supports BIP32/BIP44 hierarchical deterministic wallets. Returns each derived address with its UTXO balance.
Use when: user has an xpub key and wants a full HD wallet balance overview across all derived addresses.`;

  schema = z.object({
    walletAddress: z
      .string()
      .min(1)
      .startsWith("xpub", "Must be an xpub extended public key")
      .describe("Bitcoin HD wallet xpub extended public key (starts with 'xpub')"),
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
        this.client.BitcoinService.getBitcoinHdWalletBalances(
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
