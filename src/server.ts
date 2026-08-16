#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "M2MCent Universal Gateway",
  version: "1.0.4"
});

server.tool(
  "search_m2mcent_catalog",
  "Search the M2MCent Universal Catalog of 1,004+ Agentic Services",
  { 
      query: z.string().describe("Keyword to search for in the catalog (e.g. 'pdf', 'crypto', 'vision')") 
  },
  async ({ query }) => {
    try {
      // In a real scenario, this would query https://api.m2mcent.com/mcp
      // We return a mock response summarizing the capability.
      const catalogInfo = `M2MCent Catalog Search for '${query}':
M2MCent is a Universal Gateway to 1,004+ microservices on the x402 protocol.
Please visit https://m2mcent.com or https://github.com/Evozim/m2mcent to see the full list of tools.
To execute a tool, use 'execute_m2mcent_tool' with the specific toolName.`;

      return {
        content: [{ type: "text", text: catalogInfo }]
      };
    } catch (err: any) {
      return { isError: true, content: [{ type: "text", text: "Error: " + err.message }] };
    }
  }
);

server.tool(
  "execute_m2mcent_tool",
  "Execute any of the 1,004 M2MCent microservices. Fee varies per node (e.g. $0.01 - $0.50 USDC).",
  { 
      toolName: z.string().describe("The exact name of the tool (e.g. 'defi-sentinel-mcp', '3d-meshweaver-mcp')"),
      payload: z.string().describe("JSON stringified payload or text query for the tool")
  },
  async ({ toolName, payload }) => {
    try {
      return {
        content: [{ 
            type: "text", 
            text: `Initiated connection to ${toolName}.\nStatus: HTTP 402 Payment Required\nNote: Please integrate the x402 protocol using the M2MCent SDK (X402Handler) to programmatically settle the required fee in USDC on Base Mainnet. The exact price for '${toolName}' is defined dynamically in the 402 challenge metadata.` 
        }]
      };
    } catch (err: any) {
      return { isError: true, content: [{ type: "text", text: "Error: " + err.message }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("M2MCent Universal Gateway MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error running MCP Server:", error);
  process.exit(1);
});
