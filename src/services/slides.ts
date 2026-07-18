import { hrcFetch, normalizeList } from "./api";
import type { Slide } from "@/types/hrc";

export async function getSlides(signal?: AbortSignal): Promise<Slide[]> {
  const raw = await hrcFetch<unknown>("/slides", { signal });
  return normalizeList<Slide>(raw);
}
