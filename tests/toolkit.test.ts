import { describe, it, expect } from "vitest";
import { GoldRushToolkit } from "../src/toolkit.js";
import { GoldRushClient } from "../src/client.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

describe("GoldRushToolkit", () => {
  it("returns all 37 tools by default", () => {
    const toolkit = new GoldRushToolkit({ apiKey: "ckey_aabbccddeeff001122334455667" });
    expect(toolkit.toolCount).toBe(36);
  });

  it("memoizes getTools()", () => {
    const toolkit = new GoldRushToolkit({ apiKey: "ckey_aabbccddeeff001122334455667" });
    expect(toolkit.getTools()).toBe(toolkit.getTools());
  });

  it("getToolsByService returns only tools for that service", () => {
    const toolkit = new GoldRushToolkit({ apiKey: "ckey_aabbccddeeff001122334455667" });
    const tools = toolkit.getToolsByService("cross-chain");
    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toEqual([
      "goldrush_address_activity",
      "goldrush_multichain_balances",
      "goldrush_multichain_transactions",
    ]);
  });

  it("getTool finds a tool by name", () => {
    const toolkit = new GoldRushToolkit({ apiKey: "ckey_aabbccddeeff001122334455667" });
    const tool = toolkit.getTool("goldrush_token_balances");
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("goldrush_token_balances");
  });

  it("getTool returns undefined for unknown name", () => {
    const toolkit = new GoldRushToolkit({ apiKey: "ckey_aabbccddeeff001122334455667" });
    expect(toolkit.getTool("nonexistent_tool")).toBeUndefined();
  });

  it("respects services filter", () => {
    const toolkit = new GoldRushToolkit({
      apiKey: "ckey_aabbccddeeff001122334455667",
      services: ["balance", "nft"],
    });
    const names = toolkit.getTools().map((t) => t.name);
    expect(names.some((n) => n.startsWith("goldrush_token_balances"))).toBe(true);
    expect(names.some((n) => n.startsWith("goldrush_nft"))).toBe(true);
    expect(names.some((n) => n.startsWith("goldrush_transaction"))).toBe(false);
  });

  it("all tool names are unique", () => {
    const toolkit = new GoldRushToolkit({ apiKey: "ckey_aabbccddeeff001122334455667" });
    const names = toolkit.getTools().map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("GoldRushClient", () => {
  it("applies default config values", () => {
    expect(client.config.defaultQuoteCurrency).toBe("USD");
    expect(client.config.maxResponseSize).toBe(32_000);
    expect(client.config.timeout).toBe(30_000);
    expect(client.config.retries).toBe(3);
  });

  it("respects custom config overrides", () => {
    const custom = new GoldRushClient({
      apiKey: "ckey_aabbccddeeff001122334455667",
      defaultQuoteCurrency: "EUR",
      maxResponseSize: 8_000,
      timeout: 5_000,
      retries: 1,
    });
    expect(custom.config.defaultQuoteCurrency).toBe("EUR");
    expect(custom.config.maxResponseSize).toBe(8_000);
    expect(custom.config.retries).toBe(1);
  });
});
