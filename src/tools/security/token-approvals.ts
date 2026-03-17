import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class TokenApprovalsTool extends StructuredTool {
  name = "goldrush_token_approvals";
  description = `Get all ERC20 token approvals for a wallet, categorized by spender contract with risk assessment.
Identifies unlimited approvals, flagged/risky spender contracts, and total value at risk.
Critical for wallet security audits. Supports ENS, RNS, Lens, Unstoppable Domains.
Use when: user wants to audit wallet security, check dangerous approvals, review DeFi exposure, or find approvals to revoke.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    walletAddress: z
      .string()
      .min(1)
      .describe("Wallet address or domain name"),
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.SecurityService.getApprovals(
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
