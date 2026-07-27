/**
 * Core HRC API fetch wrapper.
 *
 * All service modules go through hrcFetch — never call fetch() directly from
 * a component or hook.
 */

import { decodeEntities } from "@/lib/html";

const WORDPRESS_BASE_URL = "https://cms.hyderabadrealtychoices.com";
const DEFAULT_BASE = `${WORDPRESS_BASE_URL}/wp-json/hrc/v1`;


export const HRC_API_BASE: string =
  (import.meta.env.VITE_HRC_API_BASE as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? DEFAULT_BASE;

export const HRC_SITE_URL: string =
  (import.meta.env.VITE_HRC_SITE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? WORDPRESS_BASE_URL;

export class HrcApiError extends Error {
  status: number;
  path: string;
  body?: unknown;

  constructor(message: string, status: number, path: string, body?: unknown) {
    super(message);
    this.name = "HrcApiError";
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface HrcFetchOptions {
  params?: QueryParams;
  signal?: AbortSignal;
  init?: Omit<RequestInit, "signal">;
}

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export async function hrcFetch<T>(
  path: string,
  options: HrcFetchOptions = {},
): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${HRC_API_BASE}${cleanPath}${buildQueryString(options.params)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options.init,
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.init?.headers ?? {}),
      },
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new HrcApiError(
      `Network error fetching ${cleanPath}: ${(err as Error).message}`,
      0,
      cleanPath,
    );
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      /* ignore */
    }
    throw new HrcApiError(
      `HRC API ${response.status} on ${cleanPath}`,
      response.status,
      cleanPath,
      body,
    );
  }

  try {
    const data = (await response.json()) as T;
    return decodeApiEntities(data) as T;
  } catch (err) {
    throw new HrcApiError(
      `Malformed JSON from ${cleanPath}: ${(err as Error).message}`,
      response.status,
      cleanPath,
    );
  }
}

/**
 * Recursively decode HTML entities in every string value returned by the
 * WordPress API. Fields whose keys look like raw HTML (e.g. `content_html`,
 * `description_html`, or anything ending in `_html`/`html`) are skipped so
 * their markup stays intact for `dangerouslySetInnerHTML`.
 *
 * URL-ish keys (`url`, `link`, `*_url`, `*_image`, `href`, `src`) are also
 * left untouched to avoid altering query strings.
 */
function isHtmlKey(key: string): boolean {
  const k = key.toLowerCase();
  return k === "html" || k.endsWith("_html") || k.endsWith("html");
}

function isUrlKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k === "url" ||
    k === "link" ||
    k === "href" ||
    k === "src" ||
    k.endsWith("_url") ||
    k.endsWith("_image") ||
    k.endsWith("_link") ||
    k.endsWith("_href")
  );
}

export function decodeApiEntities<T>(value: T, key?: string): T {
  if (typeof value === "string") {
    if (key && (isHtmlKey(key) || isUrlKey(key))) return value;
    return decodeEntities(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => decodeApiEntities(v, key)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = decodeApiEntities(v, k);
    }
    return out as unknown as T;
  }
  return value;
}


/**
 * Some endpoints wrap payloads as `{ items: T[] }`, others return a bare
 * array. Normalize so callers always see an array.
 */
export function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "items" in value) {
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}
