import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class ChainsStatusTool extends StructuredTool {
  name = "goldrush_chains_status";
  description = `Get the current synchronization status for all supported blockchain networks.
Returns the latest synced block, expected latest block, and sync health/lag for each chain.
Use when: user wants to check chain data freshness, indexing lag, or which chains are currently syncing.`;

  schema = z.object({});

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(_input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.BaseService.getAllChainStatus()
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
