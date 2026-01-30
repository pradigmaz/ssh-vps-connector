#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { NodeSSH } from 'node-ssh';
import { z } from 'zod';

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('[SSH-VPS ERROR] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SSH-VPS ERROR] Unhandled rejection:', reason);
  process.exit(1);
});

console.error('[SSH-VPS] Starting server initialization...');

const ExecuteCommandSchema = z.object({
  host: z.string().optional(),
  username: z.string().optional(),
  privateKeyPath: z.string().optional(),
  command: z.string(),
  port: z.number().default(22),
});

class SSHVPSConnector {
  constructor() {
    console.error('[SSH-VPS] Creating server instance...');
    
    this.server = new Server({
      name: 'ssh-vps-connector',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });
    
    this.ssh = new NodeSSH();
    
    this.defaultConfig = {
      host: process.env.SSH_HOST,
      username: process.env.SSH_USERNAME,
      privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
      port: parseInt(process.env.SSH_PORT || '22'),
    };
    
    console.error('[SSH-VPS] Setting up handlers...');
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[SSH-VPS] Tools list requested');
      return {
        tools: [
          {
            name: 'ssh_execute_command',
            description: 'Execute command on VPS via SSH',
            inputSchema: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'Command to execute' },
              },
              required: ['command'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        console.error(`[SSH-VPS] Tool called: ${name}`);
        
        if (name === 'ssh_execute_command') {
          const params = ExecuteCommandSchema.parse(args);
          return {
            content: [{ type: 'text', text: `Would execute: ${params.command}` }],
          };
        }
        
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        console.error('[SSH-VPS] Tool execution error:', error);
        return {
          content: [{ type: 'text', text: `Error: ${error}` }],
          isError: true,
        };
      }
    });
  }

  async run() {
    try {
      console.error('[SSH-VPS] Creating transport...');
      const transport = new StdioServerTransport();
      
      console.error('[SSH-VPS] Connecting to transport...');
      await this.server.connect(transport);
      
      console.error('[SSH-VPS] Server running successfully');
    } catch (error) {
      console.error('[SSH-VPS] Failed to start:', error);
      process.exit(1);
    }
  }
}

const server = new SSHVPSConnector();

process.on('SIGINT', () => {
  console.error('[SSH-VPS] SIGINT received, exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[SSH-VPS] SIGTERM received, exiting...');
  process.exit(0);
});

server.run().catch((error) => {
  console.error('[SSH-VPS] Server failed:', error);
  process.exit(1);
});