
# HRC Foundation — Design System, API Layer, Hooks

Extracted directly from the live site's stylesheet (`main.css?ver=1.15.0`) and API responses. No pages will be built in this phase.

## 1. Design Tokens (from live CSS `:root`)

Wired into `src/styles.css` under `:root` + `@theme inline` (Tailwind v4 pattern already used by the template):

**Colors**
```text
--navy       #0A1F44   (primary / header bg on scroll / hero overlay)
--navy-2     #132A5C   (hover, gradient stop)
--gold       #C9A961   (accent / CTA / eyebrow)
--gold-2     #B08B3E   (gold hover)
--ivory      #F8F5EE   (section bg)
--white      #FFFFFF
--ink        #101828   (body text)
--muted      #5B6478   (secondary text)
--mist       #E9EEF7   (subtle bg / chips)
--border     #E5E7EB
```

Mapped to shadcn semantics (`--background`, `--foreground`, `--primary` = navy, `--accent` = gold, `--muted`, `--border`) so every component uses semantic tokens — never hardcoded hex.

**Radius**: `--radius: 14px`, `--radius-sm: 10px` (+ derived `xs/md/lg/xl` scale for Tailwind).
**Shadows**: `--shadow-soft: 0 10px 40px rgba(10,31,68,0.08)`, `--shadow-lift: 0 20px 50px rgba(10,31,68,0.18)`.
**Typography**: heading = `Playfair Display` (serif), body = `Manrope` (sans). Loaded via `<link>` in `__root.tsx` head (preconnect + Google Fonts stylesheet). Weights: 400/500/600/700.
**Breakpoints** (matches live): `sm 420`, `md 620`, `lg 900`, `xl 1100`, `2xl 1200`.
**Container**: `.hrc-container` — max-width 1200px, padded 16/24px responsive.

Hero overlay gradient token: `linear-gradient(180deg, rgba(10,31,68,0.45) 0%, rgba(10,31,68,0.82) 100%)` exposed as `--gradient-hero`.

## 2. Global Styles (`src/styles.css`)

- Tailwind v4 `@import "tailwindcss"` (already present) + `@theme inline` mapping the tokens above.
- Google Fonts loaded via `<link>` in `__root.tsx` (never `@import` a URL in styles.css).
- Base layer: body font = Manrope, headings = Playfair Display, `body { background: var(--ivory)` on inner pages, hero pages transparent header.
- Utility classes preserved from live: `.eyebrow`, `.eyebrow.gold`, `.hrc-container`, `.section`, `.section-title`.
- Reduced-motion media query respected.

## 3. Reusable UI Components (`src/components/ui/`)

Shadcn-based, restyled to match the live site — not redesigned:

- `Button` — variants: `primary` (navy fill, white text, radius-sm), `gold` (gold fill, navy text, CTA), `outline` (white border on hero), `ghost`, `link`. Sizes: `sm`, `md`, `lg` (matches `.btn.btn-lg`).
- `Card` — white bg, `--radius`, `--shadow-soft`, hover lifts to `--shadow-lift`, thin `--border`.
- `Badge` / `Chip` — gold outline & mist filled variants (status, BHK, etc.).
- `Input`, `Select`, `Textarea` — border `--border`, radius `--radius-sm`, focus ring gold.
- `Skeleton` — mist shimmer.
- `Rating` — 5-star gold, half-star support.
- `Breadcrumbs` — navy links, chevron separator.
- `Pagination` — square buttons, gold active.
- `Eyebrow` — small caps, gold or navy variants.
- `SectionHeading` — eyebrow + Playfair title + optional muted subtitle.
- `EmptyState`, `ErrorState`.
- `Tabs` (segmented, for Buy/Rent search tabs).
- `Dialog`, `Drawer` (for mobile nav + gallery), `Tooltip`, `Toast` — shadcn defaults with token restyle.

All components read semantic tokens; no color literals.

## 4. Layout Components (`src/components/layout/`)

- `Header` — sticky. Transparent over hero (`hrc-hero-visible` body class equivalent, tracked via `useHydrated` + scroll listener), navy-white background + `--shadow-soft` after 40px scroll. Logo (icon + wordmark + tagline "LUXURY HOMES · TRUSTED CHOICES"), primary nav (Home, Locations, Projects, About, Contact), "Call Now" pill (from `/meta.phone`) and gold "Book Site Visit" CTA.
- `MegaMenu` — desktop hover panel scaffold for Locations & Projects (populated later by hooks; foundation ships the shell + animation).
- `MobileNav` — off-canvas drawer, hamburger trigger, accordion sections, same links.
- `Footer` — 4 columns (brand + tagline, quick links, locations, contact from `/meta`), social icons (lucide), bottom bar with copyright.
- `Container`, `Section` — wrappers enforcing max-width & vertical rhythm.
- `PageShell` — optional page wrapper (breadcrumbs + title slot) for later routes.

Animations via Framer Motion: header bg cross-fade, mobile drawer slide, subtle fade-up on section mount. Nothing flashy.

## 5. TypeScript Models (`src/types/hrc.ts`)

Derived from live API responses (`/meta`, `/slides`, `/projects`, `/locations`, `/flats`, `/amenities`, `/images`, `/reviews`, `/search`):

```text
Meta, BudgetRange, FilterOptions
Slide
Location (id, slug, title, excerpt, content_html, link, featured_image, ...)
Project (id, slug, title, excerpt, link, featured_image, gallery, location, builder, price_from, unit_types, sizes, status, possession, ...)
Flat (id, project_id, bhk, size, price, floor_plan, ...)
Amenity (id, name, icon, category)
ImageItem (id, url, alt, sizes)
Review (id, author, rating, content, avatar, date, source)
Paginated<T> = { items: T[]; total?: number; page?: number; per_page?: number }
SearchParams = { location?, type?, bhk?, budget?, q?, page?, per_page? }
```

All response envelopes are `{ items: T[] }` — a `normalizeList` helper handles both shapes just in case.

## 6. API Layer (`src/services/`)

Env-configurable base URL:
```text
VITE_HRC_API_BASE=https://hyderabadrealtychoices.com/wp-json/hrc/v1
```

Files:
- `api.ts` — `hrcFetch<T>(path, { params, signal })`: URL builder, query-string serializer, `Accept: application/json`, throws `HrcApiError` with status + body, JSON parse guard, AbortController-aware. Default `Cache-Control` friendly.
- `meta.ts` — `getMeta()`.
- `slides.ts` — `getSlides()`.
- `locations.ts` — `getLocations()`, `getLocation(slug)`, `getLocationProjects(slug)`.
- `projects.ts` — `getProjects(params)`, `getProject(slug)`.
- `flats.ts` — `getFlats(params)`, `getFlat(id)`.
- `amenities.ts` — `getAmenities(projectId)`.
- `images.ts` — `getImages(postId)`.
- `reviews.ts` — `getReviews()`.
- `search.ts` — `search(params: SearchParams)`.

Every function returns typed DTOs. Zero component-level `fetch`. AI-ready: a future `services/ai.ts` (Gemini) consumes the same DTOs.

## 7. React Query Hooks (`src/hooks/queries/`)

Each endpoint gets a `queryOptions` factory (for loader `ensureQueryData`) + a `useX` hook (`useSuspenseQuery` where appropriate). Stable keys:

```text
meta:        ["meta"]                              staleTime 30m
slides:      ["slides"]                            staleTime 10m
locations:   ["locations"], ["location", slug],
             ["location", slug, "projects"]        staleTime 5m
projects:    ["projects", params], ["project", slug] staleTime 60s
flats:       ["flats", params], ["flat", id]
amenities:   ["amenities", projectId]
images:      ["images", postId]
reviews:     ["reviews"]                           staleTime 5m
search:      ["search", params]                    staleTime 30s, keepPreviousData
```

Hooks exported from `src/hooks/queries/index.ts`. No page files import services directly — always via a hook.

## 8. File Layout Delivered This Phase

```text
src/
  styles.css                    (tokens + @theme + base)
  routes/__root.tsx             (add font <link>s + Header/Footer chrome around <Outlet />; leave placeholder index untouched)
  components/
    ui/                         (Button, Card, Badge, Input, Select, Skeleton, Rating, Breadcrumbs, Pagination, Eyebrow, SectionHeading, Tabs, Dialog, Drawer, Tooltip, Toast, EmptyState, ErrorState)
    layout/                     (Header, MegaMenu, MobileNav, Footer, Container, Section, PageShell)
  services/                     (api, meta, slides, locations, projects, flats, amenities, images, reviews, search)
  types/hrc.ts
  hooks/queries/                (per-endpoint hooks + queryOptions)
  lib/                          (cn, format-currency ₹ Indian grouping, format-area, image-src helper)
.env.example                    (VITE_HRC_API_BASE)
```

## 9. Guardrails

- No page routes created or modified (existing placeholder `/` stays until Phase 2).
- No static property data anywhere.
- No color/font literals in components — semantic tokens only.
- Fonts loaded via root-route `<link>` (never `@import` URL in styles.css).
- Every service function typed end-to-end; strict TS.
- All hooks memoized via stable query keys; `queryOptions` factories keep loader + component in sync.

## 10. Out of Scope (Phase 2)

Home, Search, Projects listing, Project detail, Locations pages, Reviews page, SEO `head()` per route, JSON-LD, sitemap, image lazy `srcset` tuning. These will consume the foundation without modification.

Stop point: after this foundation lands and the header/footer chrome renders around the current placeholder index, awaiting your approval to begin page development.
