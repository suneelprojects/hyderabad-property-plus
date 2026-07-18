import { hrcFetch, normalizeList, type QueryParams } from "./api";
import type { Flat, Id } from "@/types/hrc";

export interface FlatsQuery {
  project?: Id;
  bhk?: string;
  per_page?: number;
  page?: number;
}

function toParams(q?: FlatsQuery): QueryParams | undefined {
  if (!q) return undefined;
  const out: QueryParams = {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v as QueryParams[string];
  }
  return out;
}

export async function getFlats(
  query?: FlatsQuery,
  signal?: AbortSignal,
): Promise<Flat[]> {
  const raw = await hrcFetch<unknown>("/flats", {
    params: toParams(query),
    signal,
  });
  return normalizeList<Flat>(raw);
}

export function getFlat(id: Id, signal?: AbortSignal): Promise<Flat> {
  return hrcFetch<Flat>(`/flats/${id}`, { signal });
}
