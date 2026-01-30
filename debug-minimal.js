#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

console.error('[DEBUG] Starting minimal MCP server...');

const server = new Server({
  name: 'ssh-vps-connector',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[DEBUG] Tools list requested');
  return { tools: [] };
});

console.error('[DEBUG] Server configured');

const transport = new StdioServerTransport();
console.error('[DEBUG] Transport created');

try {
  await server.connect(transport);
  console.error('[DEBUG] Server connected successfully');
} catch (error) {
  console.error('[DEBUG] Connection failed:', error);
  process.exit(1);
}