import { hrcFetch, normalizeList } from "./api";
import type { Location, Project, Slug } from "@/types/hrc";

export async function getLocations(signal?: AbortSignal): Promise<Location[]> {
  const raw = await hrcFetch<unknown>("/locations", { signal });
  return normalizeList<Location>(raw);
}

export function getLocation(
  slug: Slug,
  signal?: AbortSignal,
): Promise<Location> {
  return hrcFetch<Location>(`/locations/${encodeURIComponent(slug)}`, {
    signal,
  });
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
