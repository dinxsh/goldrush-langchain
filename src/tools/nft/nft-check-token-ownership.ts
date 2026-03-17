import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class NftCheckTokenOwnershipTool extends StructuredTool {
  name = "goldrush_nft_check_token_ownership";
  description = `Verify whether a wallet address owns a specific NFT token ID within a collection.
Works for both ERC-721 (unique 1-of-1 tokens) and ERC-1155 (multi-edition) token standards.
Supports ENS, RNS, Lens, Unstoppable Domains.
Use when: user needs to verify ownership of a specific NFT by its token ID — for transfers, sales, or access control.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    collectionContract: z
      .string()
      .min(1)
      .describe("NFT collection contract address"),
    tokenId: z
      .string()
      .min(1)
      .describe("The specific token ID to verify ownership of (as a string, e.g. '1234')"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.NftService.checkOwnershipInNftForSpecificTokenId(
          input.chainName,
          input.walletAddress,
          input.collectionContract,
          input.tokenId
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
