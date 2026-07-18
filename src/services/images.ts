import { hrcFetch, normalizeList } from "./api";
import type { Id, ImageItem } from "@/types/hrc";

export async function getImages(
  postId: Id,
  signal?: AbortSignal,
): Promise<ImageItem[]> {
  const raw = await hrcFetch<unknown>(`/images/${postId}`, { signal });
  return normalizeList<ImageItem>(raw);
}
