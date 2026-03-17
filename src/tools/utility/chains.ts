import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class ChainsTool extends StructuredTool {
  name = "goldrush_chains";
  description = `Get the complete list of all blockchain networks supported by GoldRush.
Returns chain name, chain ID, chain slug, logo URL, and other metadata for all 200+ supported chains.
Use when: user wants to know which chains are available, needs to look up a chain ID or slug, or wants to discover supported networks.`;

  schema = z.object({});

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(_input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BaseService.getAllChains()
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
