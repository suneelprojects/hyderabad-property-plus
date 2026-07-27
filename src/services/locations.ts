import { hrcFetch, normalizeList } from "./api";
import { decodeEntities } from "@/lib/html";
import type { Location, Project, Slug } from "@/types/hrc";

function decodeLocation<T extends { title?: string; excerpt?: string }>(l: T): T {
  return {
    ...l,
    title: typeof l.title === "string" ? decodeEntities(l.title) : l.title,
    excerpt:
      typeof l.excerpt === "string" ? decodeEntities(l.excerpt) : l.excerpt,
  };
}

export async function getLocations(signal?: AbortSignal): Promise<Location[]> {
  const raw = await hrcFetch<unknown>("/locations", { signal });
  return normalizeList<Location>(raw).map(decodeLocation);
}

export async function getLocation(
  slug: Slug,
  signal?: AbortSignal,
): Promise<Location> {
  const raw = await hrcFetch<Location>(
    `/locations/${encodeURIComponent(slug)}`,
    { signal },
  );
  return decodeLocation(raw);
}

export async function getLocationProjects(
  slug: Slug,
  signal?: AbortSignal,
): Promise<Project[]> {
  const raw = await hrcFetch<unknown>(
    `/locations/${encodeURIComponent(slug)}/projects`,
    { signal },
  );
  return normalizeList<Project>(raw);
}
