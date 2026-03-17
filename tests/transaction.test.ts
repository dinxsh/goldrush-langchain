import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  TransactionTool,
  TransactionSummaryTool,
  BulkTransactionsTool,
  RecentTransactionsTool,
  PaginatedTransactionsTool,
  TimeBucketTransactionsTool,
  BlockTransactionsTool,
  BlockHashTransactionsTool,
} from "../src/tools/transaction/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const CHAIN = "eth-mainnet";
const WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const TX_HASH = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const BLOCK_HASH = "0xblockhashblockhashblockhashblockhashblockhashblockhashblockhash00";

describe("TransactionTool", () => {
  const tool = new TransactionTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_transaction");
  });

  it("returns success response for a tx hash", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, txHash: TX_HASH });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_transaction");
  });

  it("accepts optional flags", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      txHash: TX_HASH,
      noLogs: true,
      withInternal: true,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});

describe("TransactionSummaryTool", () => {
  const tool = new TransactionSummaryTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_transaction_summary");
  });

  it("returns success response with summary stats", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_transaction_summary");
  });
});

describe("BulkTransactionsTool", () => {
  const tool = new BulkTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_bulk_transactions");
  });

  it("returns success response", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_bulk_transactions");
  });
});

describe("RecentTransactionsTool", () => {
  const tool = new RecentTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_recent_transactions");
  });

  it("returns success response with recent txs", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_recent_transactions");
  });
});

describe("PaginatedTransactionsTool", () => {
  const tool = new PaginatedTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_paginated_transactions");
  });

  it("returns success response for page 0", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET, page: 0 });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_paginated_transactions");
  });
});

describe("TimeBucketTransactionsTool", () => {
  const tool = new TimeBucketTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_time_bucket_transactions");
  });

  it("returns success response for a time bucket", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      walletAddress: WALLET,
      timeBucket: 1705329000,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_time_bucket_transactions");
  });
});

describe("BlockTransactionsTool", () => {
  const tool = new BlockTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_block_transactions");
  });

  it("returns success response for a block height", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, blockHeight: 19_000_000, page: 0 });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_block_transactions");
  });
});

describe("BlockHashTransactionsTool", () => {
  const tool = new BlockHashTransactionsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_block_hash_transactions");
  });

  it("returns success response for a block hash", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, blockHash: BLOCK_HASH });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_block_hash_transactions");
  });
});
