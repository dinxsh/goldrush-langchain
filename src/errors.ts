import type { GoldRushErrorCode } from "./types.js";

const SUGGESTIONS: Record<GoldRushErrorCode, string> = {
  UNAUTHORIZED:
    "Check that GOLDRUSH_API_KEY is set and valid at https://goldrush.dev",
  FORBIDDEN:
    "Upgrade your GoldRush plan at https://goldrush.dev/pricing to access this endpoint",
  NOT_FOUND:
    "Verify the chain name using the goldrush_chains tool, or confirm the address/hash exists",
  RATE_LIMITED:
    "Reduce parallel tool calls or add delays between requests; retry after the suggested interval",
  CHAIN_NOT_SUPPORTED:
    "Use the goldrush_chains tool to list all supported chain slugs",
  INVALID_PARAMS:
    "Review the tool parameter schema and correct the input values",
  TIMEOUT:
    "The request timed out; retry the call or contact GoldRush support if persistent",
  UPSTREAM_ERROR:
    "GoldRush API returned a server error; retry with exponential backoff",
  UNKNOWN: "An unexpected error occurred; check logs for details",
};

function classify(err: unknown): { code: GoldRushErrorCode; message: string } {
  const status =
    (err as { status?: number })?.status ??
    (err as { statusCode?: number })?.statusCode;

  if (typeof status === "number") {
    if (status === 401) return { code: "UNAUTHORIZED", message: "Invalid or missing GoldRush API key" };
    if (status === 403) return { code: "FORBIDDEN", message: "Your plan does not support this endpoint" };
    if (status === 404) return { code: "NOT_FOUND", message: "Chain or resource not found" };
    if (status === 429) return { code: "RATE_LIMITED", message: "Rate limit exceeded — reduce request frequency" };
    if (status >= 500) return { code: "UPSTREAM_ERROR", message: `GoldRush API server error (HTTP ${status})` };
  }

  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes("timeout")) {
    return { code: "TIMEOUT", message: "Request timed out" };
  }

  return { code: "UNKNOWN", message: msg };
}

export class GoldRushToolError extends Error {
  readonly toolName: string;
  readonly code: GoldRushErrorCode;
  readonly suggestion: string;

  constructor(toolName: string, cause: unknown) {
    const { code, message } = classify(cause);
    super(`[${toolName}] ${message}`);
    this.toolName = toolName;
    this.code = code;
    this.suggestion = SUGGESTIONS[code];
    this.cause = cause;
  }

  /**
   * Returns structured JSON string suitable for LLM consumption.
   * Agents receive this as the tool observation and can respond gracefully.
   */
  toJSON(): string {
    return JSON.stringify({
      error: true,
      tool: this.toolName,
      code: this.code,
      message: this.message,
      suggestion: this.suggestion,
    });
  }
}
