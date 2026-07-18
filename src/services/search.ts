import { hrcFetch, type QueryParams } from "./api";
import type { SearchParams, SearchResult } from "@/types/hrc";

function toParams(params: SearchParams): QueryParams {
  const out: QueryParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v as QueryParams[string];
  }
  return out;
}

export function search(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<SearchResult> {
  return hrcFetch<SearchResult>("/search", {
    params: toParams(params),
    signal,
  });
}
