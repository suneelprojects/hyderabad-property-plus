import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getFlats } from "@/services/flats";
import { getProject } from "@/services/projects";

export default defineTool({
  name: "get_project",
  title: "Get project details",
  description:
    "Get full public details for one residential project by slug, including available flat inventory when published.",
  inputSchema: {
    slug: z.string().describe("Project slug, e.g. 'alekhya-rise'."),
    include_flats: z
      .boolean()
      .optional()
      .describe("Include available flats/units (default true)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, include_flats = true }) => {
    let project;
    try {
      project = await getProject(slug);
    } catch (error) {
      throw new ToolError(
        `No project found for slug "${slug}": ${(error as Error).message}`,
      );
    }

    let flats: unknown[] = [];
    if (include_flats && project?.id) {
      try {
        flats = await getFlats({ project: project.id, per_page: 50 });
      } catch {
        flats = [];
      }
    }

    const payload = { project, flats };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload as Record<string, unknown>,
    };
  },
});
