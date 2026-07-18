/**
 * Stable query-key factories for TanStack Query. Import the factory and call
 * it with args so keys serialize identically everywhere.
 */

import type { Id, SearchParams, Slug } from "@/types/hrc";
import type { ProjectsQuery } from "@/services/projects";
import type { FlatsQuery } from "@/services/flats";

export const queryKeys = {
  meta: () => ["hrc", "meta"] as const,
  slides: () => ["hrc", "slides"] as const,

  locations: () => ["hrc", "locations"] as const,
  location: (slug: Slug) => ["hrc", "location", slug] as const,
  locationProjects: (slug: Slug) =>
    ["hrc", "location", slug, "projects"] as const,

  projects: (query?: ProjectsQuery) =>
    query ? (["hrc", "projects", query] as const) : (["hrc", "projects"] as const),
  project: (slug: Slug) => ["hrc", "project", slug] as const,

  flats: (query?: FlatsQuery) =>
    query ? (["hrc", "flats", query] as const) : (["hrc", "flats"] as const),
  flat: (id: Id) => ["hrc", "flat", id] as const,

  amenities: (projectId: Id) => ["hrc", "amenities", projectId] as const,
  images: (postId: Id) => ["hrc", "images", postId] as const,

  reviews: () => ["hrc", "reviews"] as const,

  search: (params: SearchParams) => ["hrc", "search", params] as const,
} as const;
