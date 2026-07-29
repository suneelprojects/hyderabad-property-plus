/**
 * Curated premium real-estate imagery for flat cards.
 *
 * Source: Unsplash (Unsplash License — free, commercial + non-commercial,
 * no attribution required). Direct CDN URLs (images.unsplash.com).
 *
 * Design goals:
 *  - Editorial, brochure-grade luxury (My Home / Aparna / Prestige / Brigade /
 *    DLF / Godrej / Sobha aesthetic). Warm, minimalist, aspirational.
 *  - Broad variety: living rooms, kitchens, bedrooms, dining, balconies,
 *    lobbies, clubhouses, rooftop lounges, infinity pools, facades, landscape.
 *  - Context-aware pools keyed on view / size / ribbon.
 *  - Deterministic per flat.id AND anti-adjacency across a rendered list.
 *  - Always yields the CMS `featured_image` when present.
 *
 * Do NOT hard-code image assignments per project — the helper is the single
 * source of truth so every page (project detail, search, home featured,
 * locations, related) stays visually consistent.
 */

export type FlatImgCtx = {
  id: number | string;
  title?: string | null;
  facing?: string | null;
  bhk?: string | null;
  sizeSqft?: number | null;
  ribbon?: string | null;
};

export type ResolvedFlatImage = {
  url: string;
  /** true when the image was picked from the curated pool (no CMS image). */
  isCurated: boolean;
};

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

// -------------------------------------------------------------------------
// Curated pools — Unsplash License, luxury residential + amenities.
// Each URL is an image id verified to exist on images.unsplash.com.
// -------------------------------------------------------------------------

// Warm, bright, view-forward interiors + balconies (Lake / water context)
const POOL_LAKE_VIEW = [
  U("photo-1600585154340-be6161a56a0c"), // bright living, floor-to-ceiling glass
  U("photo-1615529182904-14819c35db37"), // living w/ expansive glazing
  U("photo-1600607687939-ce8a6c25118c"), // airy bedroom, warm window light
  U("photo-1618221195710-dd6b41faaea6"), // large windows, soft daylight
  U("photo-1502005229762-cf1b2da7c5d6"), // balcony, water & city view
  U("photo-1519643381401-22c77e60520e"), // premium balcony seating
  U("photo-1505692433770-36f19f51681d"), // waterfront balcony ambience
  U("photo-1560448204-603b3fc33ddc"), // luxury bedroom w/ soft palette
];

// Skyline / greenery / ORR / outer-facing
const POOL_GREEN_SKYLINE = [
  U("photo-1600566753190-17f0baa2a6c3"), // sleek living, soft daylight
  U("photo-1613977257363-707ba9348227"), // marble & wood living
  U("photo-1600210491892-03d54c0aaf87"), // contemporary open plan
  U("photo-1600607688969-a5bfcd646154"), // balcony overlooking greenery
  U("photo-1600585154526-990dced4db0d"), // clean modern living, warm neutrals
  U("photo-1523217582562-09d0def993a6"), // premium facade dusk
  U("photo-1493809842364-78817add7ffb"), // modern residential facade
  U("photo-1600566753051-6057c1d1f4a2"), // dining w/ pendant lights
];

// Premium / featured / large units — grand, penthouse, double-height
const POOL_PREMIUM_LARGE = [
  U("photo-1600210492493-0946911123ea"), // grand living w/ chandelier
  U("photo-1600607687920-4e2a09cf159d"), // stately bedroom suite
  U("photo-1512917774080-9991f1c4c750"), // penthouse living, warm wood
  U("photo-1560448204-e02f11c3d0e2"), // luxury dining
  U("photo-1540518614846-7eded433c457"), // infinity pool, resort feel
  U("photo-1571003123894-1f0594d2b5d9"), // rooftop lounge dusk
  U("photo-1582719478250-c89cae4dc85b"), // clubhouse lounge
  U("photo-1618220179428-22790b461013"), // premium marble bath / suite
  U("photo-1600566753086-00f18fe6ba68"), // marble kitchen island
];

// Standard premium — 3 BHK, general residential luxury
const POOL_STANDARD = [
  U("photo-1560185007-cde436f6a4d0"), // neutral warm interior
  U("photo-1616137466211-f939a420be84"), // wood-toned living
  U("photo-1616486338812-3dadae4b4ace"), // luxury lounge, neutral palette
  U("photo-1556909114-f6e7ad7d3136"), // modern kitchen, warm palette
  U("photo-1600585152220-90363fe7e115"), // master bedroom, minimalist
  U("photo-1631679706909-1844bbd07221"), // modern kitchen w/ island
  U("photo-1584622650111-993a426fbf0a"), // dining area, warm lighting
  U("photo-1505691938895-1758d7feb511"), // bedroom w/ styled linens
  U("photo-1600566753151-384129cf4e3e"), // living, curated warm palette
];

// Amenity-forward pool (rotated in occasionally regardless of context so
// cards don't feel like only-interiors)
const POOL_AMENITIES = [
  U("photo-1540518614846-7eded433c457"), // infinity pool
  U("photo-1571003123894-1f0594d2b5d9"), // rooftop lounge
  U("photo-1582719478250-c89cae4dc85b"), // clubhouse
  U("photo-1445019980597-93fa8acb246c"), // premium lobby
  U("photo-1502672260266-1c1ef2d93688"), // landscape gardens
  U("photo-1523217582562-09d0def993a6"), // premium facade dusk
];

/** Reliable global fallback (evergreen luxury living). */
export const FLAT_FALLBACK_IMAGE = U("photo-1600585154340-be6161a56a0c");

// -------------------------------------------------------------------------
// Selection
// -------------------------------------------------------------------------

function hash(seed: number | string): number {
  const s = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function pickPool(ctx: FlatImgCtx): string[] {
  const title = (ctx.title || "").toLowerCase();
  const ribbon = (ctx.ribbon || "").toLowerCase();
  const size = Number(ctx.sizeSqft) || 0;

  if (ribbon === "premium" || ribbon === "featured" || size >= 4500) {
    return POOL_PREMIUM_LARGE;
  }
  if (/\blake|water|panoram|view\b/.test(title)) return POOL_LAKE_VIEW;
  if (/\borr|outer|green|park|skyline|financial/.test(title)) {
    return POOL_GREEN_SKYLINE;
  }
  return POOL_STANDARD;
}

/**
 * Resolve a single flat's image. Prefers CMS `featured_image` when present,
 * otherwise deterministically picks from the appropriate curated pool.
 */
export function resolveFlatImage(
  explicit: string | false | null | undefined,
  ctx: FlatImgCtx,
): ResolvedFlatImage {
  if (explicit && typeof explicit === "string" && explicit.trim() !== "") {
    return { url: explicit, isCurated: false };
  }
  const pool = pickPool(ctx);
  const h = hash(ctx.id);
  // Sprinkle amenity shots ~ every 5th card to break up interior monotony.
  if (h % 5 === 0) {
    return { url: POOL_AMENITIES[h % POOL_AMENITIES.length], isCurated: true };
  }
  return { url: pool[h % pool.length], isCurated: true };
}

/**
 * Resolve a whole list of flats at once. Guarantees no two adjacent cards
 * share the same curated image — walks the list and, if a collision with the
 * previous card is detected, rotates forward within the same pool.
 * CMS `featured_image` entries are always kept as-is.
 */
export function resolveFlatImagesForList<T extends FlatImgCtx & { featured_image?: unknown }>(
  flats: T[],
): ResolvedFlatImage[] {
  const out: ResolvedFlatImage[] = [];
  for (let i = 0; i < flats.length; i++) {
    const f = flats[i];
    const explicit = f.featured_image as string | false | null | undefined;
    let resolved = resolveFlatImage(explicit, f);
    if (resolved.isCurated && i > 0 && out[i - 1].url === resolved.url) {
      // Rotate forward inside the same pool until different.
      const pool = pickPool(f);
      const start = pool.indexOf(resolved.url);
      for (let step = 1; step <= pool.length; step++) {
        const candidate = pool[(start + step) % pool.length];
        if (candidate !== out[i - 1].url) {
          resolved = { url: candidate, isCurated: true };
          break;
        }
      }
    }
    out.push(resolved);
  }
  return out;
}

/** @deprecated Use resolveFlatImage — kept for backward compatibility. */
export function getFlatImage(
  explicit: string | false | null | undefined,
  ctx: FlatImgCtx,
): string {
  return resolveFlatImage(explicit, ctx).url;
}
