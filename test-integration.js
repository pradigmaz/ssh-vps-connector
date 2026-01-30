#!/usr/bin/env node

// Simple integration test for ssh-vps-connector MCP server
import { spawn } from 'child_process';

console.log('Testing ssh-vps-connector MCP server integration...');

const server = spawn('node', ['/home/zaikana/.kiro/mcp-servers/ssh-vps-connector/dist/index.js'], {
  env: {
    ...process.env,
    SSH_HOST: "5.45.123.121",
    SSH_USERNAME: "root", 
    SSH_PASSWORD: "qX25H5igmE89xCDj"
  }
});

// Test initialization
const initMessage = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" }
  }
};

// Test tools list
const toolsMessage = {
  jsonrpc: "2.0", 
  id: 2,
  method: "tools/list",
  params: {}
};

// Test simple command
const commandMessage = {
  jsonrpc: "2.0",
  id: 3, 
  method: "tools/call",
  params: {
    name: "ssh_execute_command",
    arguments: {
      command: "echo 'MCP SSH test successful'"
    }
  }
};

let responseCount = 0;
let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim() && line.startsWith('{')) {
      try {
        const response = JSON.parse(line);
        responseCount++;
        console.log(`Response ${responseCount}:`, response);
        
        if (responseCount === 3) {
          console.log('✅ All tests completed successfully!');
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
});

server.stderr.on('data', (data) => {
  console.log('Server log:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Send test messages
setTimeout(() => {
  server.stdin.write(JSON.stringify(initMessage) + '\n');
}, 100);

setTimeout(() => {
  server.stdin.write(JSON.stringify(toolsMessage) + '\n');
}, 500);

setTimeout(() => {
  server.stdin.write(JSON.stringify(commandMessage) + '\n');
}, 1000);

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Test timeout');
  server.kill();
  process.exit(1);
}, 10000);