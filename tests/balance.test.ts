import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  TokenBalancesTool,
  HistoricalTokenBalancesTool,
  NativeTokenBalanceTool,
  Erc20TransfersTool,
  HistoricalPortfolioTool,
  TokenHoldersTool,
} from "../src/tools/balance/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const CHAIN = "eth-mainnet";
const WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("TokenBalancesTool", () => {
  const tool = new TokenBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_token_balances");
  });

  it("returns success response with token list", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, address: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_token_balances");
  });

  it("accepts optional flags", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      address: WALLET,
      nft: true,
      noSpam: false,
      quoteCurrency: "EUR",
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});

describe("HistoricalTokenBalancesTool", () => {
  const tool = new HistoricalTokenBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_historical_token_balances");
  });

  it("returns success response", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, address: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_historical_token_balances");
  });
});

describe("NativeTokenBalanceTool", () => {
  const tool = new NativeTokenBalanceTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_native_token_balance");
  });

  it("returns success response with native balance", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_native_token_balance");
  });
});

describe("Erc20TransfersTool", () => {
  const tool = new Erc20TransfersTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_erc20_token_transfers");
  });

  it("returns success response with transfers", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_erc20_token_transfers");
  });

  it("accepts contract address filter", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      walletAddress: WALLET,
      contractAddress: TOKEN,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});

describe("HistoricalPortfolioTool", () => {
  const tool = new HistoricalPortfolioTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_historical_portfolio");
  });

  it("returns success response with portfolio history", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_historical_portfolio");
  });
});

describe("TokenHoldersTool", () => {
  const tool = new TokenHoldersTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_token_holders");
  });

  it("returns success response with holder list", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, tokenAddress: TOKEN });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_token_holders");
  });
});
