#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

console.error('[DEBUG] Starting SSH VPS Connector with detailed logging...');

const server = new Server(
  {
    name: 'ssh-vps-connector-debug',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

console.error('[DEBUG] Server created');

// Add error handlers
server.onerror = (error) => {
  console.error('[DEBUG] Server error:', error);
};

process.on('uncaughtException', (error) => {
  console.error('[DEBUG] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[DEBUG] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const transport = new StdioServerTransport();
console.error('[DEBUG] Transport created');

try {
  console.error('[DEBUG] Attempting to connect...');
  await server.connect(transport);
  console.error('[DEBUG] Server connected successfully');
  
  // Keep alive
  setInterval(() => {
    console.error('[DEBUG] Server still running...');
  }, 5000);
  
} catch (error) {
  console.error('[DEBUG] Connection failed:', error);
  process.exit(1);
}