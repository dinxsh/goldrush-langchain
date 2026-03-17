import { GoldRushClient as SdkClient } from "@covalenthq/client-sdk";
import type { GoldRushToolkitConfig } from "./types.js";
import { GoldRushToolError } from "./errors.js";

/**
 * Thin wrapper around @covalenthq/client-sdk that adds:
 * - Configurable timeout
 * - Exponential-backoff retry on 5xx errors
 * - Unified error normalization
 */
export class GoldRushClient {
  readonly sdk: SdkClient;
  readonly config: Required<
    Pick<
      GoldRushToolkitConfig,
      "defaultQuoteCurrency" | "maxResponseSize" | "timeout" | "retries"
    >
  >;

  constructor(cfg: GoldRushToolkitConfig) {
    this.sdk = new SdkClient(cfg.apiKey);
    this.config = {
      defaultQuoteCurrency: cfg.defaultQuoteCurrency ?? "USD",
      maxResponseSize: cfg.maxResponseSize ?? 32_000,
      timeout: cfg.timeout ?? 30_000,
      retries: cfg.retries ?? 3,
    };
  }

  /**
   * Wraps an SDK call with retry logic. Only retries on 5xx (transient) errors.
   * 4xx errors (client mistakes) are surfaced immediately as GoldRushToolError.
   */
  async call<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const status =
          (err as { status?: number })?.status ??
          (err as { statusCode?: number })?.statusCode;

        // Don't retry client errors
        if (typeof status === "number" && status < 500) break;

        if (attempt < this.config.retries) {
          const delay = Math.min(1_000 * Math.pow(2, attempt) + Math.random() * 200, 10_000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw new GoldRushToolError(toolName, lastErr);
  }

  get BalanceService() { return this.sdk.BalanceService; }
  get TransactionService() { return this.sdk.TransactionService; }
  get NftService() { return this.sdk.NftService; }
  get SecurityService() { return this.sdk.SecurityService; }
  get BitcoinService() { return this.sdk.BitcoinService; }
  get PricingService() { return this.sdk.PricingService; }
  get BaseService() { return this.sdk.BaseService; }
  get AllChainsService() { return this.sdk.AllChainsService; }
}
