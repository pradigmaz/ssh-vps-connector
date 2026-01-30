#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

console.log('[TEST] Starting MCP test server...');

const server = new Server(
  {
    name: 'test-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

console.log('[TEST] Server created');

const transport = new StdioServerTransport();
console.log('[TEST] Transport created');

try {
  await server.connect(transport);
  console.log('[TEST] Server connected successfully');
} catch (error) {
  console.error('[TEST] Connection failed:', error);
  process.exit(1);
}