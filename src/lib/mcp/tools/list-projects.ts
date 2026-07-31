import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getProjects } from "@/services/projects";

export default defineTool({
  name: "list_projects",
  title: "List projects",
  description:
    "List residential projects with optional filters. Use location slugs from list_locations. Returns a compact summary for each project including its slug for get_project.",
  inputSchema: {
    location: z.string().optional().describe("Location slug, e.g. 'kokapet'."),
    bhk: z.string().optional().describe("Configuration filter, e.g. '3' or '3 BHK'."),
    status: z
      .string()
      .optional()
      .describe("Construction status, e.g. 'ongoing', 'ready-to-move'."),
    featured: z.boolean().optional().describe("Only featured projects."),
    q: z.string().optional().describe("Free-text keyword."),
    per_page: z.number().optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const projects = await getProjects({ per_page: 20, ...input });
    const items = projects.map((p) => ({
      slug: p.slug,
      title: p.title,
      location: p.location,
      builder: (p as { builder?: string }).builder,
      configuration: (p as { configuration?: string }).configuration,
      price: (p as { price?: string }).price,
      status: (p as { status?: string }).status,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { projects: items },
    };
  },
});
