/**
 * Pagination guard — prevents agents from fetching unbounded result sets.
 * Returns clamped pageSize and pageNumber values.
 */
export function clampPage(
  pageSize: number | undefined,
  pageNumber: number | undefined,
  maxPageSize = 100
): { pageSize: number; pageNumber: number } {
  return {
    pageSize: Math.min(pageSize ?? 10, maxPageSize),
    pageNumber: Math.max(pageNumber ?? 0, 0),
  };
}
