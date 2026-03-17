import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  HistoricalTokenPricesTool,
  PoolSpotPricesTool,
  GasPricesTool,
} from "../src/tools/pricing/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const CHAIN = "eth-mainnet";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const POOL = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";

describe("HistoricalTokenPricesTool", () => {
  const tool = new HistoricalTokenPricesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_historical_token_prices");
  });

  it("returns success response with price history", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      contractAddress: WETH,
      quoteCurrency: "USD",
      from: "2024-01-01",
      to: "2024-01-07",
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_historical_token_prices");
  });
});

describe("PoolSpotPricesTool", () => {
  const tool = new PoolSpotPricesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_pool_spot_prices");
  });

  it("returns success response with spot prices", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, contractAddress: POOL });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_pool_spot_prices");
  });
});

describe("GasPricesTool", () => {
  const tool = new GasPricesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_gas_prices");
  });

  it("returns success response for erc20 event type", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, eventType: "erc20" });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_gas_prices");
  });

  it("returns success response for nativetokens event type", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, eventType: "nativetokens" });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });

  it("returns success response for uniswapv3 event type", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, eventType: "uniswapv3" });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});
