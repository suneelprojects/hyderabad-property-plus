/**
 * Curated premium real-estate imagery for flat cards.
 *
 * Source: Unsplash (Unsplash License — free to use, no attribution required,
 * commercial & non-commercial). Direct CDN URLs (images.unsplash.com) with
 * sizing params for fast delivery.
 *
 * Mapping strategy (deterministic — same flat always gets same image):
 *   1. If flat has an explicit featured_image, use it.
 *   2. Otherwise pick a pool by context (view / size tier / ribbon).
 *   3. Within the pool, rotate by flat.id to avoid repetition across a project.
 */

type ImgCtx = {
  id: number | string;
  title?: string | null;
  facing?: string | null;
  bhk?: string | null;
  sizeSqft?: number | null;
  ribbon?: string | null;
};

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

// ---- Curated pools (all Unsplash License, luxury residential interiors) ----

// Lake / water / bright open-view interiors
const POOL_LAKE_VIEW = [
  U("photo-1600585154340-be6161a56a0c"), // bright modern living, floor-to-ceiling windows
  U("photo-1615529182904-14819c35db37"), // living room with expansive glazing
  U("photo-1600607687939-ce8a6c25118c"), // airy luxury bedroom w/ window
  U("photo-1618221195710-dd6b41faaea6"), // large windows, warm light
];

// Greenery / skyline / ORR outward-facing
const POOL_GREEN_SKYLINE = [
  U("photo-1600566753190-17f0baa2a6c3"), // sleek living w/ soft daylight
  U("photo-1616486338812-3dadae4b4ace"), // luxury lounge, neutral palette
  U("photo-1613977257363-707ba9348227"), // marble & wood living
  U("photo-1600210491892-03d54c0aaf87"), // contemporary open plan
];

// Larger / premium units (4 BHK+, staff quarters, home theatre)
const POOL_PREMIUM_LARGE = [
  U("photo-1600210492493-0946911123ea"), // grand living w/ chandelier
  U("photo-1600607687920-4e2a09cf159d"), // stately bedroom suite
  U("photo-1512917774080-9991f1c4c750"), // penthouse living, warm wood
  U("photo-1560448204-e02f11c3d0e2"), // luxury dining
];

// General 3 BHK / standard premium
const POOL_STANDARD = [
  U("photo-1600585154526-990dced4db0d"), // clean modern living
  U("photo-1560185007-cde436f6a4d0"), // neutral warm interior
  U("photo-1600566753086-00f18fe6ba68"), // marble kitchen island
  U("photo-1616137466211-f939a420be84"), // wood-toned living
];

// Reliable global fallback (a well-known evergreen luxury interior)
export const FLAT_FALLBACK_IMAGE = U("photo-1600585154340-be6161a56a0c");

// ---- Helpers ----

function hashPick<T>(pool: T[], seed: number | string): T {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

function pickPool(ctx: ImgCtx): string[] {
  const title = (ctx.title || "").toLowerCase();
  const ribbon = (ctx.ribbon || "").toLowerCase();
  const size = Number(ctx.sizeSqft) || 0;

  // Premium ribbon or very large units → premium pool
  if (ribbon === "premium" || ribbon === "featured" || size >= 4500) {
    return POOL_PREMIUM_LARGE;
  }
  // Lake / water / view keywords
  if (/\blake|water|view|panoram/.test(title)) {
    return POOL_LAKE_VIEW;
  }
  // ORR / outer / green / skyline / park
  if (/\borr|outer|green|park|skyline|financial/.test(title)) {
    return POOL_GREEN_SKYLINE;
  }
  return POOL_STANDARD;
}

/**
 * Returns the best premium interior image for a flat card, given optional
 * explicit imagery from the CMS and a context object.
 */
export function getFlatImage(
  explicit: string | false | null | undefined,
  ctx: ImgCtx,
): string {
  if (explicit && typeof explicit === "string" && explicit.trim() !== "") {
    return explicit;
  }
  const pool = pickPool(ctx);
  return hashPick(pool, ctx.id);
}
