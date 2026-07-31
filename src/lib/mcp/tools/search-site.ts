import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { search } from "@/services/search";

export default defineTool({
  name: "search_site",
  title: "Search the site",
  description:
    "Search Hyderabad Realty Choices content by keyword, location, property type or budget. Returns matching projects and locations.",
  inputSchema: {
    q: z.string().optional().describe("Keyword, e.g. 'lake view 3 bhk'."),
    location: z.string().optional().describe("Location slug."),
    type: z.string().optional().describe("Property type, e.g. 'apartment', 'villa'."),
    budget: z.string().optional().describe("Budget bucket, e.g. '1-2cr'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const result = await search(input);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  },
});
