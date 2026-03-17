import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  BtcHdWalletBalancesTool,
  BtcNonHdWalletBalancesTool,
  BtcHistoricalBalancesTool,
  BtcTransactionsTool,
} from "../src/tools/bitcoin/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const BTC_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
const XPUB = "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKp6V7ku5J7nB3QRzobJRmHNMCxKuRXpBi3gGPQrEF1TzE5AjE8Xmhba4EAthE9uCJD1fjTXzxWuq";

describe("BtcHdWalletBalancesTool", () => {
  const tool = new BtcHdWalletBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_btc_hd_wallet_balances");
  });

  it("returns success response for HD wallet", async () => {
    const raw = await tool.invoke({ walletAddress: XPUB });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_btc_hd_wallet_balances");
  });
});

describe("BtcNonHdWalletBalancesTool", () => {
  const tool = new BtcNonHdWalletBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_btc_non_hd_wallet_balances");
  });

  it("returns success response for a Bitcoin address", async () => {
    const raw = await tool.invoke({ walletAddress: BTC_ADDRESS });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_btc_non_hd_wallet_balances");
  });
});

describe("BtcHistoricalBalancesTool", () => {
  const tool = new BtcHistoricalBalancesTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_btc_historical_balances");
  });

  it("returns success response with historical data", async () => {
    const raw = await tool.invoke({ walletAddress: BTC_ADDRESS });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_btc_historical_balances");
  });
});

describe("BtcTransactionsTool", () => {
  const tool = new BtcTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_btc_transactions");
  });

  it("returns success response with transaction list", async () => {
    const raw = await tool.invoke({ address: BTC_ADDRESS });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_btc_transactions");
  });

  it("respects pagination params", async () => {
    const raw = await tool.invoke({ address: BTC_ADDRESS, pageSize: 5, pageNumber: 1 });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});
