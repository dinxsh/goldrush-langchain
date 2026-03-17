import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class NftBalancesTool extends StructuredTool {
  name = "goldrush_nft_balances";
  description = `Fetch all ERC721 and ERC1155 NFTs held by a wallet address, including metadata.
Returns collection name, token ID, token name, image URL, and traits/attributes.
Spam filtering enabled by default. Supports ENS, RNS, Lens, Unstoppable Domains.
Use when: user asks about NFT collection, digital assets, what NFTs they own, or NFT portfolio.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
    noSpam: z
      .boolean()
      .optional()
      .default(true)
      .describe("Filter out spam/scam NFTs (default: true)"),
    noNftAssetMetadata: z
      .boolean()
      .optional()
      .default(false)
      .describe("Skip fetching NFT asset metadata for faster response (default: false)"),
    withUncached: z
      .boolean()
      .optional()
      .default(false)
      .describe("Fetch metadata directly from source even if not cached (default: false, slower)"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.NftService.getNftsForAddress(
          input.chainName,
          input.walletAddress,
          {
            noSpam: input.noSpam,
            noNftAssetMetadata: input.noNftAssetMetadata,
          }
        )
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
