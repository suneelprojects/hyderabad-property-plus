import { hrcFetch, normalizeList } from "./api";
import type { Amenity, Id } from "@/types/hrc";

export async function getAmenities(
  projectId: Id,
  signal?: AbortSignal,
): Promise<Amenity[]> {
  const raw = await hrcFetch<unknown>(`/amenities/${projectId}`, { signal });
  return normalizeList<Amenity>(raw);
}
