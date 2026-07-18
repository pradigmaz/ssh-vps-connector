#!/usr/bin/env node
import { MCPServer } from './core/server.js';

const server = new MCPServer();
server.run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
