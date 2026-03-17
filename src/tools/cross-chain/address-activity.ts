import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class AddressActivityTool extends StructuredTool {
  name = "goldrush_address_activity";
  description = `Locate all blockchain networks where a wallet address has been active with a single API call.
Returns a list of chains with activity flags and chain metadata.
Supports ENS names (e.g. 'vitalik.eth'), RNS, Lens handles, and Unstoppable Domains.
Use when: user wants to know which chains an address operates on, or before querying cross-chain data.`;

  schema = z.object({
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name (ENS, RNS, Lens, Unstoppable Domain)"),
    testnets: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include testnet chains in results (default: false)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.AllChainsService.getAddressActivity(input.walletAddress, {
          testnets: input.testnets,
        })
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
