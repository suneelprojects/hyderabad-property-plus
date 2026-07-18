/**
 * Formatting helpers for HRC (₹ Indian grouping, area, dates).
 */

export function formatPriceInr(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return typeof value === "string" ? value : "";

  // Convert to Cr / Lakh when meaningful (real estate convention).
  if (num >= 10_000_000) {
    const cr = num / 10_000_000;
    return `₹ ${cr.toFixed(cr < 10 ? 2 : 1).replace(/\.0+$/, "")} Cr`;
  }
  if (num >= 100_000) {
    const l = num / 100_000;
    return `₹ ${l.toFixed(l < 10 ? 2 : 1).replace(/\.0+$/, "")} L`;
  }
  return `₹ ${num.toLocaleString("en-IN")}`;
}

export function formatPriceFromInr(
  value: number | string | undefined,
): string {
  const p = formatPriceInr(value);
  return p ? `From ${p}` : "";
}

export function formatArea(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const asString = String(value).trim();
  if (/sq\s*\.?\s*ft/i.test(asString) || /sqft/i.test(asString))
    return asString;
  const num = Number(asString);
  if (Number.isFinite(num)) return `${num.toLocaleString("en-IN")} sq.ft`;
  return asString;
}

export function formatDate(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
