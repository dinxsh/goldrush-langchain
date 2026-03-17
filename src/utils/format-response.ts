import type { FormattedToolResponse } from "../types.js";

/**
 * Converts a GoldRush SDK response into a JSON string suitable for LLM consumption.
 *
 * - Truncates oversized responses and sets truncated: true
 * - Extracts pagination metadata if present
 * - Always returns a string (tools must return strings in LangChain)
 */
export function formatResponse(
  data: unknown,
  toolName: string,
  maxSize: number = 32_000
): string {
  const timestamp = new Date().toISOString();

  // Extract pagination if present on the data object
  let pagination: FormattedToolResponse["pagination"];
  let payload = data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if ("pagination" in d && d.pagination) {
      pagination = d.pagination as FormattedToolResponse["pagination"];
    }
    // GoldRush SDK wraps in { data: {...} } — unwrap if present
    if ("data" in d && d.data !== undefined) {
      payload = d.data;
    }
  }

  const response: FormattedToolResponse = {
    tool: toolName,
    success: true,
    timestamp,
    truncated: false,
    data: payload,
    ...(pagination ? { pagination } : {}),
  };

  const bigIntReplacer = (_key: string, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value;

  let serialized = JSON.stringify(response, bigIntReplacer, 2);

  if (serialized.length > maxSize) {
    // Truncate data field and mark as truncated
    response.truncated = true;
    response.data = `[TRUNCATED — response exceeded ${maxSize} chars. Use pagination parameters to fetch a specific page.]`;
    serialized = JSON.stringify(response, bigIntReplacer, 2);
  }

  return serialized;
}

/**
 * Formats an error for LLM consumption. Always returns a JSON string.
 */
export function formatError(toolName: string, err: unknown): string {
  // GoldRushToolError already has a toJSON()
  if (err && typeof err === "object" && "toJSON" in err && typeof (err as { toJSON: unknown }).toJSON === "function") {
    return (err as { toJSON: () => string }).toJSON();
  }

  return JSON.stringify({
    error: true,
    tool: toolName,
    code: "UNKNOWN",
    message: err instanceof Error ? err.message : String(err),
    suggestion: "An unexpected error occurred; check logs for details",
  });
}
