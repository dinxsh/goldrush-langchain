import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import { TokenApprovalsTool } from "../src/tools/security/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const CHAIN = "eth-mainnet";
const WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

describe("TokenApprovalsTool", () => {
  const tool = new TokenApprovalsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_token_approvals");
  });

  it("returns success response with approval list", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_token_approvals");
  });

  it("response data includes token approvals", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.data).toBeDefined();
  });
});
