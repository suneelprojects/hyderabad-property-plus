import { createFileRoute } from "@tanstack/react-router";

/**
 * Thin proxy to the live WordPress `admin-ajax.php` endpoint.
 *
 * The browser cannot POST there directly because WordPress does not send
 * CORS headers. This route:
 *   1. Scrapes the current `window.HRC` bootstrap from the WP homepage to
 *      obtain a fresh `nonce` and the `ajaxUrl`.
 *   2. Forwards the submitted form fields as FormData with `action` +
 *      `nonce` set, exactly like the WordPress frontend does.
 *   3. Relays the JSON response back to the client unchanged.
 *
 * No new storage or business logic — WordPress remains the source of truth.
 */

const WP_HOME = "https://cms.hyderabadrealtychoices.com/";

type HrcBootstrap = { ajaxUrl: string; nonce: string };

let cached: { data: HrcBootstrap; at: number } | null = null;
const CACHE_MS = 5 * 60_000;

async function getBootstrap(): Promise<HrcBootstrap> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const res = await fetch(WP_HOME, {
    headers: { "User-Agent": "Mozilla/5.0 HRC-Headless" },
  });
  if (!res.ok) throw new Error(`WP home fetch failed: ${res.status}`);
  const html = await res.text();

  const match = html.match(/HRC\s*=\s*(\{[\s\S]*?\});/);
  if (!match) throw new Error("window.HRC bootstrap not found on WP home");

  const parsed = JSON.parse(match[1]) as Partial<HrcBootstrap>;
  if (!parsed.ajaxUrl || !parsed.nonce) {
    throw new Error("window.HRC missing ajaxUrl/nonce");
  }
  const data: HrcBootstrap = {
    ajaxUrl: parsed.ajaxUrl,
    nonce: parsed.nonce,
  };
  cached = { data, at: Date.now() };
  return data;
}

export const Route = createFileRoute("/api/public/enquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, string>;
        try {
          payload = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ success: false, data: { message: "Invalid JSON" } }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        let bootstrap: HrcBootstrap;
        try {
          bootstrap = await getBootstrap();
        } catch (err) {
          return new Response(
            JSON.stringify({
              success: false,
              data: {
                message:
                  "Could not reach the enquiry service. Please try again in a moment.",
              },
              debug: (err as Error).message,
            }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }

        const form = new URLSearchParams();
        form.set("action", "hrc_submit_lead");
        form.set("nonce", bootstrap.nonce);
        for (const key of [
          "name",
          "mobile",
          "email",
          "project",
          "visit_date",
          "message",
          "source",
          "project_id",
          "lead_source",
          "status",
          "lead_status",
          "page_url",
          "referrer",
          "submitted_at",
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content",
        ] as const) {
          if (payload[key] != null) form.set(key, String(payload[key]));
        }
        if (!form.get("source")) form.set("source", "headless-web");


        const wpRes = await fetch(bootstrap.ajaxUrl, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept: "application/json, */*",
            "user-agent": "Mozilla/5.0 HRC-Headless",
            referer: WP_HOME,
            origin: WP_HOME.replace(/\/$/, ""),
          },
          body: form.toString(),
        });

        const text = await wpRes.text();

        // If nonce expired, refresh once and retry.
        if (wpRes.status === 403 || text.trim() === "-1") {
          cached = null;
          try {
            bootstrap = await getBootstrap();
            form.set("nonce", bootstrap.nonce);
            const retry = await fetch(bootstrap.ajaxUrl, {
              method: "POST",
              headers: {
                "content-type": "application/x-www-form-urlencoded",
                accept: "application/json, */*",
                "user-agent": "Mozilla/5.0 HRC-Headless",
                referer: WP_HOME,
                origin: WP_HOME.replace(/\/$/, ""),
              },
              body: form.toString(),
            });
            const retryText = await retry.text();
            return new Response(retryText, {
              status: retry.status,
              headers: {
                "content-type":
                  retry.headers.get("content-type") ?? "application/json",
              },
            });
          } catch {
            /* fall through to original response */
          }
        }

        return new Response(text, {
          status: wpRes.status,
          headers: {
            "content-type":
              wpRes.headers.get("content-type") ?? "application/json",
          },
        });
      },
    },
  },
});
