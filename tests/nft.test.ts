import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  NftBalancesTool,
  NftCheckOwnershipTool,
  NftCheckTokenOwnershipTool,
} from "../src/tools/nft/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const CHAIN = "eth-mainnet";
const WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const COLLECTION = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const TOKEN_ID = "1234";

describe("NftBalancesTool", () => {
  const tool = new NftBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_nft_balances");
  });

  it("returns success response with NFT list", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_nft_balances");
  });

  it("accepts metadata flags", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      walletAddress: WALLET,
      noSpam: false,
      noNftAssetMetadata: true,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});

describe("NftCheckOwnershipTool", () => {
  const tool = new NftCheckOwnershipTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_nft_check_ownership");
  });

  it("returns success response with ownership status", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      walletAddress: WALLET,
      collectionContract: COLLECTION,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_nft_check_ownership");
  });
});

describe("NftCheckTokenOwnershipTool", () => {
  const tool = new NftCheckTokenOwnershipTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_nft_check_token_ownership");
  });

  it("returns success response for a specific token", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      walletAddress: WALLET,
      collectionContract: COLLECTION,
      tokenId: TOKEN_ID,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_nft_check_token_ownership");
  });
});
