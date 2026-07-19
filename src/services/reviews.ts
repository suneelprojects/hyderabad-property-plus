import { hrcFetch, normalizeList } from "./api";
import type { Review } from "@/types/hrc";

interface RawReview {
  id: number;
  title?: string;
  author?: string;
  text?: string;
  content?: string;
  rating?: number;
  photo_url?: string | false | null;
  avatar?: string;
  date?: string;
  source?: string;
  project?: { id: number; title: string; slug?: string } | null;
}

function mapReview(raw: RawReview): Review {
  const author = raw.author ?? raw.title ?? "";
  const content = raw.content ?? raw.text ?? "";
  const avatar =
    typeof raw.avatar === "string" && raw.avatar
      ? raw.avatar
      : typeof raw.photo_url === "string" && raw.photo_url
        ? raw.photo_url
        : undefined;

  const mapped: Review = {
    id: raw.id,
    author,
    content,
    rating: typeof raw.rating === "number" ? raw.rating : 5,
    avatar,
    date: raw.date,
    source: raw.source,
    project: raw.project
      ? {
          id: raw.project.id,
          title: raw.project.title,
          slug: raw.project.slug ?? "",
        }
      : undefined,
  };

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[reviews] mapped review", mapped);
    if (!author) console.warn("[reviews] missing author/title for id", raw.id);
    if (!content) console.warn("[reviews] missing content/text for id", raw.id);
    if (mapped.rating === undefined)
      console.warn("[reviews] missing rating for id", raw.id);
  }

  return mapped;
}

export async function getReviews(signal?: AbortSignal): Promise<Review[]> {
  const raw = await hrcFetch<unknown>("/reviews", { signal });
  return normalizeList<RawReview>(raw).map(mapReview);
}
