import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('stdio exposes only SSH-first tools and keeps stdout protocol-only', async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      SSH_TARGET: '',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const messages = new Map<number, any>();
  const waiters = new Map<number, (message: any) => void>();
  const invalidStdout: string[] = [];
  let buffer = '';

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines.filter(Boolean)) {
      try {
        const message = JSON.parse(line);
        if (typeof message.id === 'number') {
          messages.set(message.id, message);
          waiters.get(message.id)?.(message);
        }
      } catch {
        invalidStdout.push(line);
      }
    }
  });

  const request = (id: number, method: string, params: object) => {
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    return new Promise<any>((resolve, reject) => {
      if (messages.has(id)) return resolve(messages.get(id));
      const timer = setTimeout(() => reject(new Error(`MCP timeout: ${method}`)), 5_000);
      waiters.set(id, message => {
        clearTimeout(timer);
        resolve(message);
      });
    });
  };

  try {
    const initialized = await request(1, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'smoke', version: '1.0.0' },
    });
    assert.equal(initialized.result.serverInfo.name, 'ssh-vps-connector');

    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
    const listed = await request(2, 'tools/list', {});
    assert.deepEqual(
      listed.result.tools.map((tool: { name: string }) => tool.name),
      ['ssh_status', 'ssh_execute'],
    );
    assert.deepEqual(
      Object.keys(listed.result.tools[1].inputSchema.properties),
      ['command', 'timeoutSeconds'],
    );

    const missingTarget = await request(3, 'tools/call', {
      name: 'ssh_status',
      arguments: {},
    });
    assert.equal(missingTarget.result.isError, true);
    assert.match(missingTarget.result.content[0].text, /SSH_TARGET is required/);
    assert.deepEqual(invalidStdout, []);
  } finally {
    child.kill();
  }
});
