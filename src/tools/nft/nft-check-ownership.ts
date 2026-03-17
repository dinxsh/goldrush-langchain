import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class NftCheckOwnershipTool extends StructuredTool {
  name = "goldrush_nft_check_ownership";
  description = `Verify whether a wallet address owns any NFT in a specific collection (ERC-721 or ERC-1155).
Returns owned token IDs and metadata if ownership is confirmed.
Supports trait filtering to check ownership within a trait subset.
Supports ENS, RNS, Lens, Unstoppable Domains.
Use when: user wants to verify NFT collection membership, access-gating, allowlist check, or token-gated community eligibility.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    collectionContract: z
      .string()
      .min(1)
      .describe("NFT collection contract address to check ownership in"),
    traitsFilter: z
      .string()
      .optional()
      .describe("Comma-separated trait type names to filter by (e.g. 'Background,Eyes')"),
    valuesFilter: z
      .string()
      .optional()
      .describe("Comma-separated trait values to match (e.g. 'Blue,Laser')"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.NftService.checkOwnershipInNft(
          input.chainName,
          input.walletAddress,
          input.collectionContract,
          {
            traitsFilter: input.traitsFilter,
            valuesFilter: input.valuesFilter,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
