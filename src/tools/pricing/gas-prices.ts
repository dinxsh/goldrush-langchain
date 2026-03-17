import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class GasPricesTool extends StructuredTool {
  name = "goldrush_gas_prices";
  description = `Get real-time gas price estimates for different transaction speeds on a specific chain.
Returns safe low, standard, fast, and instant speeds with estimated confirmation times and Gwei amounts.
Use when: user asks about current gas costs, gas fees, how much a transaction will cost, or wants to optimize tx fees.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    eventType: z
      .enum(["erc20", "nativetokens", "uniswapv3"])
      .describe("Transaction event type for gas estimation: 'erc20', 'nativetokens', or 'uniswapv3'"),
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
        this.client.BaseService.getGasPrices(
          input.chainName,
          input.eventType,
          { quoteCurrency: input.quoteCurrency as "USD" }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
