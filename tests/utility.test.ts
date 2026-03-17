import { describe, it, expect } from "vitest";
import { GoldRushClient } from "../src/client.js";
import {
  EventsLatestBlockTool,
  EventsByTopicTool,
  EventsByContractTool,
  BlockTool,
  BlockHeightsByDateTool,
  ChainsTool,
  ChainsStatusTool,
  ResolveAddressTool,
} from "../src/tools/utility/index.js";

const client = new GoldRushClient({ apiKey: "ckey_aabbccddeeff001122334455667" });

const CHAIN = "eth-mainnet";
const CONTRACT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

describe("EventsLatestBlockTool", () => {
  const tool = new EventsLatestBlockTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_events_latest_block");
  });

  it("returns success response for latest block events", async () => {
    const raw = await tool.invoke({ chainName: CHAIN });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_events_latest_block");
  });

  it("accepts block range params", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      startingBlock: 19_000_000,
      endingBlock: 19_000_010,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});

describe("EventsByTopicTool", () => {
  const tool = new EventsByTopicTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_events_by_topic");
  });

  it("returns success response for a topic hash", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      topicHash: TOPIC,
      startingBlock: 19_000_000,
      endingBlock: 19_000_100,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_events_by_topic");
  });
});

describe("EventsByContractTool", () => {
  const tool = new EventsByContractTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_events_by_contract");
  });

  it("returns success response for a contract address", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      contractAddress: CONTRACT,
      startingBlock: 19_000_000,
      endingBlock: 19_000_100,
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_events_by_contract");
  });
});

describe("BlockTool", () => {
  const tool = new BlockTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_block");
  });

  it("returns success response for a block height", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, blockHeight: 19_000_000 });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_block");
  });
});

describe("BlockHeightsByDateTool", () => {
  const tool = new BlockHeightsByDateTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_block_heights_by_date");
  });

  it("returns success response for a date range", async () => {
    const raw = await tool.invoke({
      chainName: CHAIN,
      startDate: "2024-01-01",
      endDate: "2024-01-02",
    });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_block_heights_by_date");
  });
});

describe("ChainsTool", () => {
  const tool = new ChainsTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_chains");
  });

  it("returns success response with chain list", async () => {
    const raw = await tool.invoke({});
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_chains");
  });
});

describe("ChainsStatusTool", () => {
  const tool = new ChainsStatusTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_chains_status");
  });

  it("returns success response with chain sync status", async () => {
    const raw = await tool.invoke({});
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_chains_status");
  });
});

describe("ResolveAddressTool", () => {
  const tool = new ResolveAddressTool(client);

  it("has correct name", () => {
    expect(tool.name).toBe("goldrush_resolve_address");
  });

  it("returns success response for an ENS name", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: "vitalik.eth" });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
    expect(res.tool).toBe("goldrush_resolve_address");
  });

  it("returns success response for a wallet address", async () => {
    const raw = await tool.invoke({ chainName: CHAIN, walletAddress: WALLET });
    const res = JSON.parse(raw);
    expect(res.success).toBe(true);
  });
});
