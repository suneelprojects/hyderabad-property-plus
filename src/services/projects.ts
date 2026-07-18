import { hrcFetch, normalizeList, type QueryParams } from "./api";
import type { Project, Slug } from "@/types/hrc";

export interface ProjectsQuery {
  location?: string;
  type?: string;
  bhk?: string;
  budget?: string;
  status?: string;
  featured?: boolean;
  trending?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
  q?: string;
}

function toParams(q?: ProjectsQuery): QueryParams | undefined {
  if (!q) return undefined;
  const out: QueryParams = {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = typeof v === "boolean" ? (v ? 1 : 0) : (v as QueryParams[string]);
  }
  return out;
}

export async function getProjects(
  query?: ProjectsQuery,
  signal?: AbortSignal,
): Promise<Project[]> {
  const raw = await hrcFetch<unknown>("/projects", {
    params: toParams(query),
    signal,
  });
  return normalizeList<Project>(raw);
}

export function getProject(slug: Slug, signal?: AbortSignal): Promise<Project> {
  return hrcFetch<Project>(`/projects/${encodeURIComponent(slug)}`, { signal });
}
