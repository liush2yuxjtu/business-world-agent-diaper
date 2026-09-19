import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

const notionConnector = process.env.NOTION_CONNECTOR ?? "mcp.notion.com/business-world";

const APPROVAL_REQUIRED_TOOLS = [
  "notion-create-pages",
  "notion-update-page",
  "notion-create-database",
  "notion-update-database",
];

export default defineMcpClientConnection({
  approval: ({ toolName }) =>
    APPROVAL_REQUIRED_TOOLS.some((tool) => toolName.includes(tool))
      ? "user-approval"
      : "not-applicable",
  auth: connect(notionConnector),
  description:
    "Optional Business World knowledge connection. Search and read Notion freely; page or database writes require human approval.",
  url: "https://mcp.notion.com/mcp",
});
