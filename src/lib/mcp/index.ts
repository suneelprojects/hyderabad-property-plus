import { defineMcp } from "@lovable.dev/mcp-js";

import getProjectTool from "./tools/get-project";
import listLocationsTool from "./tools/list-locations";
import listProjectsTool from "./tools/list-projects";
import searchSiteTool from "./tools/search-site";

export default defineMcp({
  name: "realty-choices-refined",
  title: "Realty Choices Refined",
  version: "0.1.0",
  instructions:
    "Public tools for Hyderabad Realty Choices, a Hyderabad real-estate portal. Use `list_locations` to discover micro-markets, `list_projects` to browse or filter residential projects, `get_project` for full details and flat inventory of one project by slug, and `search_site` for free-text search. All data is public website content; no user or lead data is exposed.",
  tools: [listLocationsTool, listProjectsTool, getProjectTool, searchSiteTool],
});
