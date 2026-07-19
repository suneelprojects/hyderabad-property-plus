import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy singular /location/:slug URLs (from the WordPress site) redirect
 * to the canonical plural /locations/:slug route.
 */
export const Route = createFileRoute("/location/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/locations/$slug",
      params: { slug: params.slug.toLowerCase() },
      replace: true,
    });
  },
});
