import { hrcFetch, normalizeList } from "./api";
import type { Review } from "@/types/hrc";

export async function getReviews(signal?: AbortSignal): Promise<Review[]> {
  const raw = await hrcFetch<unknown>("/reviews", { signal });
  return normalizeList<Review>(raw);
}
