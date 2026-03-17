import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class ResolveAddressTool extends StructuredTool {
  name = "goldrush_resolve_address";
  description = `Resolve a human-readable name to its EVM address. Supports forward resolution only (name → address).
Supported naming systems: ENS (e.g. 'vitalik.eth'), RNS, Unstoppable Domains.
Use when: user provides a name like 'vitalik.eth' and you need the raw 0x wallet address for other API calls.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug (use 'eth-mainnet' for ENS)"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Human-readable name to resolve (ENS name, RNS name, or Unstoppable Domain)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BaseService.getResolvedAddress(
          input.chainName,
          input.walletAddress
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
