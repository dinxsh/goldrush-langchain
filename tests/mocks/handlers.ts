import { http, HttpResponse } from "msw";

const BASE = "https://api.covalenthq.com/v1";

/** Minimal valid GoldRush response envelope */
const ok = (data: unknown) => ({
  data,
  error: false,
  error_message: null,
  error_code: null,
});

const paginatedOk = (items: unknown[]) =>
  ok({
    items,
    pagination: {
      has_more: false,
      page_number: 0,
      page_size: 10,
      total_count: items.length,
    },
  });

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Cross-chain: address activity
  http.get(`${BASE}/address/:walletAddress/activity/`, () =>
    HttpResponse.json(ok({ items: [{ name: "eth-mainnet", is_testnet: false }] }))
  ),

  // Cross-chain: multichain balances
  http.get(`${BASE}/allchains/address/:walletAddress/balances/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            chain_name: "eth-mainnet",
            items: [{ contract_name: "Ether", balance: "1000000000000000000", quote: 3000.0 }],
          },
        ],
        pagination: { has_more: false, page_number: 0, page_size: 10, total_count: 1 },
      })
    )
  ),

  // Cross-chain: multichain transactions
  http.get(`${BASE}/allchains/transactions/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xabc", chain_name: "eth-mainnet" }]))
  ),

  // Balance: token balances
  http.get(`${BASE}/:chainName/address/:address/balances_v2/`, () =>
    HttpResponse.json(
      ok({
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        chain_id: 1,
        chain_name: "eth-mainnet",
        items: [
          {
            contract_decimals: 18,
            contract_name: "Ether",
            contract_ticker_symbol: "ETH",
            contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            balance: "1000000000000000000",
            quote: 3000.0,
            quote_rate: 3000.0,
          },
        ],
      })
    )
  ),

  // Balance: historical token balances
  http.get(`${BASE}/:chainName/address/:address/historical_balances/`, () =>
    HttpResponse.json(ok({ items: [{ contract_name: "Ether", balance: "2000000000000000000" }] }))
  ),

  // Balance: native token balance
  http.get(`${BASE}/:chainName/address/:walletAddress/balances_native/`, () =>
    HttpResponse.json(ok({ items: [{ contract_name: "Ether", balance: "1000000000000000000", quote: 3000.0 }] }))
  ),

  // Balance: ERC20 transfers
  http.get(`${BASE}/:chainName/address/:walletAddress/transfers_v2/`, () =>
    HttpResponse.json(
      ok({
        items: [
          { tx_hash: "0x123", from_address: "0xaaa", to_address: "0xbbb", delta: "1000000000000000000" },
        ],
        pagination: { has_more: false, page_number: 0, page_size: 10, total_count: 1 },
      })
    )
  ),

  // Balance: historical portfolio
  http.get(`${BASE}/:chainName/address/:walletAddress/portfolio_v2/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            contract_name: "Ether",
            holdings: [{ timestamp: "2026-03-17T00:00:00Z", close: { quote: 3000.0 } }],
          },
        ],
      })
    )
  ),

  // Balance: token holders
  http.get(`${BASE}/:chainName/tokens/:tokenAddress/token_holders_v2/`, () =>
    HttpResponse.json(
      paginatedOk([{ address: "0xabc", balance: "1000000000000000000", total_supply_pct: 0.001 }])
    )
  ),

  // Transaction: single transaction
  http.get(`${BASE}/:chainName/transaction_v2/:txHash/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            tx_hash: "0xdeadbeef",
            from_address: "0xaaa",
            to_address: "0xbbb",
            value: "1000000000000000000",
            successful: true,
            block_height: 19_000_000,
            block_signed_at: "2024-01-15T12:00:00Z",
          },
        ],
      })
    )
  ),

  // Transaction: summary
  http.get(`${BASE}/:chainName/address/:walletAddress/transactions_summary/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            total_count: 1234,
            earliest_transaction: { block_signed_at: "2015-08-07T00:00:00Z" },
            latest_transaction: { block_signed_at: "2026-03-17T00:00:00Z" },
          },
        ],
      })
    )
  ),

  // Transaction: bulk (earliest)
  http.get(`${BASE}/:chainName/bulk/transactions/:walletAddress/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xfirst", block_height: 1 }]))
  ),

  // Transaction: recent (v3)
  http.get(`${BASE}/:chainName/address/:walletAddress/transactions_v3/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xrecent", block_height: 19_000_000 }]))
  ),

  // Transaction: paginated
  http.get(`${BASE}/:chainName/address/:walletAddress/transactions_v3/page/:page/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xpage1", block_height: 19_000_000 }]))
  ),

  // Transaction: time bucket
  http.get(`${BASE}/:chainName/bulk/transactions/:walletAddress/:timeBucket/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xtimebucket" }]))
  ),

  // Transaction: block transactions
  http.get(`${BASE}/:chainName/block/:blockHeight/transactions_v3/page/:page/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xblock_tx" }]))
  ),

  // Transaction: block hash transactions
  http.get(`${BASE}/:chainName/block_hash/:blockHash/transactions_v3/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xhash_tx" }]))
  ),

  // NFT: balances
  http.get(`${BASE}/:chainName/address/:walletAddress/balances_nft/`, () =>
    HttpResponse.json(
      ok({
        items: [
          { contract_name: "Bored Ape Yacht Club", contract_address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", token_id: "1234" },
        ],
      })
    )
  ),

  // NFT: check ownership
  http.get(`${BASE}/:chainName/address/:walletAddress/collection/:collectionContract/`, () =>
    HttpResponse.json(ok({ is_owner: true, items: [{ token_id: "1234" }] }))
  ),

  // NFT: check token ownership
  http.get(`${BASE}/:chainName/address/:walletAddress/collection/:collectionContract/token/:tokenId/`, () =>
    HttpResponse.json(ok({ is_owner: true, token_id: "1234" }))
  ),

  // Security: approvals
  http.get(`${BASE}/:chainName/approvals/:walletAddress/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            ticker_symbol: "USDC",
            spenders: [{ spender_address: "0xUNISWAP", allowance: "115792089237316195423570985008687907853269984665640564039457584007913129639935" }],
          },
        ],
      })
    )
  ),

  // Bitcoin: HD wallet balances
  http.get(`${BASE}/btc-mainnet/address/:walletAddress/hd_wallets/`, () =>
    HttpResponse.json(ok({ items: [{ address: "1abc", balance: 100_000_000 }] }))
  ),

  // Bitcoin: non-HD wallet balances
  http.get(`${BASE}/btc-mainnet/address/:walletAddress/balances_v2/`, () =>
    HttpResponse.json(ok({ items: [{ address: "1abc", balance: 50_000_000, quote: 30_000.0 }] }))
  ),

  // Bitcoin: historical balances
  http.get(`${BASE}/btc-mainnet/address/:walletAddress/historical_balances/`, () =>
    HttpResponse.json(ok({ items: [{ balance: 50_000_000, quote_rate: 30_000.0 }] }))
  ),

  // Bitcoin: transactions
  http.get(`${BASE}/cq/covalent/app/bitcoin/transactions/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "btcabc123", value: 100_000_000 }]))
  ),

  // Pricing: historical token prices
  http.get(`${BASE}/pricing/historical_by_addresses_v2/:chainName/:quoteCurrency/:contractAddress/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            contract_name: "Wrapped Ether",
            prices: [{ date: "2026-03-17", price: 3000.0 }],
          },
        ],
      })
    )
  ),

  // Pricing: pool spot prices
  http.get(`${BASE}/pricing/spot_prices/:chainName/pools/:contractAddress/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            token0_contract_address: "0xWETH",
            token1_contract_address: "0xUSDC",
            token0_price_usd: 3000.0,
            token1_price_usd: 1.0,
          },
        ],
      })
    )
  ),

  // Pricing: gas prices
  http.get(`${BASE}/:chainName/event/:eventType/gas_prices/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            safe_gas: { wei_fee: "20000000000", gas_price: 20 },
            base_gas: { wei_fee: "25000000000", gas_price: 25 },
            fast_gas: { wei_fee: "30000000000", gas_price: 30 },
          },
        ],
      })
    )
  ),

  // Utility: events by address (latest block + by contract)
  http.get(`${BASE}/:chainName/events/address/:contractAddress/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xevent", decoded: { name: "Transfer" } }]))
  ),

  // Utility: events by topic
  http.get(`${BASE}/:chainName/events/topics/:topicHash/`, () =>
    HttpResponse.json(paginatedOk([{ tx_hash: "0xtopic_event", decoded: { name: "Transfer" } }]))
  ),

  // Utility: single block
  http.get(`${BASE}/:chainName/block_v2/:blockHeight/`, () =>
    HttpResponse.json(
      ok({
        items: [
          {
            signed_at: "2026-03-17T12:00:00Z",
            height: 19_000_000,
            block_hash: "0xblockhash",
            gas_used: 15_000_000,
            gas_limit: 30_000_000,
          },
        ],
      })
    )
  ),

  // Utility: block heights by date
  http.get(`${BASE}/:chainName/block_v2/:startDate/:endDate/`, () =>
    HttpResponse.json(paginatedOk([{ height: 19_000_000, signed_at: "2026-03-17T00:00:00Z" }]))
  ),

  // Utility: all chains
  http.get(`${BASE}/chains/`, () =>
    HttpResponse.json(ok({ items: [{ name: "eth-mainnet", chain_id: "1", is_testnet: false }] }))
  ),

  // Utility: chain status
  http.get(`${BASE}/chains/status/`, () =>
    HttpResponse.json(ok({ items: [{ name: "eth-mainnet", synced_block_height: 19_000_000 }] }))
  ),

  // Utility: resolve address (using address activity as proxy)
  http.get(`${BASE}/:chainName/address/:walletAddress/resolve_address/`, () =>
    HttpResponse.json(ok({ items: [{ name: "vitalik.eth", address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" }] }))
  ),
];
