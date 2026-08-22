// ===============================
// File: src/utils/extractArray.js
// ===============================

/**
 * Safely pulls an array out of an API response, regardless of whether the
 * backend returns a bare array or wraps it (e.g. { data: [...] },
 * { results: [...] }, { items: [...] }). Falls back to [] rather than
 * throwing, so callers never have to null-check before .map()/.filter().
 */
export function extractArray(payload, keys = ["data", "results", "items", "permissions", "users"]) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  // last resort: first array-valued property on the object
  const firstArray = Object.values(payload).find((v) => Array.isArray(v));
  return firstArray || [];
}

export default extractArray;