#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const GATEWAY_URL = (process.env.M2MCENT_GATEWAY_URL || "https://api.m2mcent.com").replace(/\/+$/, "");

const server = new McpServer({
  name: "M2MCent Universal Gateway",
  version: "1.0.7"
});

server.tool(
  "search_m2mcent_catalog",
  "Search the M2MCent Universal Catalog of 1,062 Agentic Services",
  { 
      query: z.string().describe("Keyword to search for in the catalog (e.g. 'adsb', 'crypto', 'kyt')") 
  },
  async ({ query }) => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/search?q=${encodeURIComponent(query)}`);
      const data: any = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
      };
    } catch (err: any) {
      return { isError: true, content: [{ type: "text", text: "Error querying M2MCent catalog: " + err.message }] };
    }
  }
);

server.tool(
  "execute_m2mcent_tool",
  "Execute or dry-run preview any of the 1,062 M2MCent microservices ($0.005 - $0.250 USDC via x402 V2 on Base Mainnet).",
  { 
      toolName: z.string().describe("The exact tool slug (e.g. 'adsb-flight-tracker-mcp', 'gas-pulse-mcp')"),
      payload: z.string().describe("JSON stringified payload for the tool"),
      paymentSignature: z.string().optional().describe("Optional Base64 x402 Payment-Signature header")
  },
  async ({ toolName, payload, paymentSignature }) => {
    try {
      const slug = encodeURIComponent(toolName.trim());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (paymentSignature) headers["Payment-Signature"] = paymentSignature;
      const endpoint = paymentSignature ? `${GATEWAY_URL}/${slug}/api/process` : `${GATEWAY_URL}/${slug}/preview`;
      const res = await fetch(endpoint, { method: "POST", headers, body: payload || "{}" });
      const text = await res.text();
      return {
        isError: res.status >= 400 && res.status !== 402,
        content: [{ type: "text", text: JSON.stringify({ status: res.status, endpoint, body: text, paymentRequiredHeader: res.headers.get("payment-required") || null }, null, 2) }]
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
