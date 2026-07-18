import { hrcFetch } from "./api";
import type { Meta } from "@/types/hrc";

export function getMeta(signal?: AbortSignal): Promise<Meta> {
  return hrcFetch<Meta>("/meta", { signal });
}
