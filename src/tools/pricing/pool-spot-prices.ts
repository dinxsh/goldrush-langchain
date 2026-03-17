import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class PoolSpotPricesTool extends StructuredTool {
  name = "goldrush_pool_spot_prices";
  description = `Get current spot token pair prices for a liquidity pool contract address.
Supports Uniswap V2, Uniswap V3, SushiSwap, Curve, and their forks on any EVM chain.
Returns token0/token1 spot prices, pool reserves, and fee tier.
Use when: user wants real-time DEX price, current pool ratio, swap rate, or liquidity pool data.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    contractAddress: z
      .string()
      .min(1)
      .describe("Liquidity pool contract address (Uniswap V2/V3 pool or fork)"),
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
        this.client.PricingService.getPoolSpotPrices(
          input.chainName,
          input.contractAddress,
          { quoteCurrency: input.quoteCurrency as "USD" }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
