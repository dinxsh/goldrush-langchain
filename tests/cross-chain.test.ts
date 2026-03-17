import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  AddressActivityTool,
  MultichainBalancesTool,
  MultichainTransactionsTool,
} from "../src/tools/cross-chain/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

describe("AddressActivityTool", () => {
  const tool = new AddressActivityTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_address_activity");
  });

  it("returns success response with chain list", async () => {
    const raw = await tool.invoke({ walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_address_activity");
    expect(res.data).toBeDefined();
  });

  it("works with ENS name", async () => {
    const raw = await tool.invoke({ walletAddress: "vitalik.eth" });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });

  it("includes testnets when requested", async () => {
    const raw = await tool.invoke({ walletAddress: WALLET, testnets: true });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});

describe("MultichainBalancesTool", () => {
  const tool = new MultichainBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_multichain_balances");
  });

  it("returns success response with chain balances", async () => {
    const raw = await tool.invoke({ walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_multichain_balances");
  });
});

describe("MultichainTransactionsTool", () => {
  const tool = new MultichainTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_multichain_transactions");
  });

  it("returns paginated transactions", async () => {
    const raw = await tool.invoke({ walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_multichain_transactions");
  });
});
