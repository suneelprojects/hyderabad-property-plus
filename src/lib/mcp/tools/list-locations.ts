import { defineTool } from "@lovable.dev/mcp-js";

import { getLocations } from "@/services/locations";

export default defineTool({
  name: "list_locations",
  title: "List locations",
  description:
    "List all Hyderabad micro-markets/localities covered by Hyderabad Realty Choices (e.g. Kokapet, Tellapur, Financial District), with their slugs.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const locations = await getLocations();
    const items = locations.map((l) => ({
      slug: l.slug,
      title: l.title,
      excerpt: l.excerpt,
      project_count: (l as { project_count?: number }).project_count,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { locations: items },
    };
  },
});
