import assert from 'node:assert/strict';
import { spawn, type SpawnOptionsWithoutStdio } from 'node:child_process';
import test from 'node:test';
import { runSSH } from '../src/ssh/runner.js';

type SpawnProcess = (
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
) => ReturnType<typeof spawn>;

const realTarget = process.env.SSH_TARGET;

test.beforeEach(() => {
  process.env.SSH_TARGET = 'unit-vps';
});

test.after(() => {
  if (realTarget === undefined) delete process.env.SSH_TARGET;
  else process.env.SSH_TARGET = realTarget;
});

function child(script: string, inspect?: (args: readonly string[]) => void): SpawnProcess {
  return (_command, args, options) => {
    inspect?.(args);
    return spawn(process.execPath, ['-e', script], options);
  };
}

test('returns structured output and fixed OpenSSH arguments', async () => {
  let sshArgs: readonly string[] = [];
  const result = await runSSH(
    'printf ok',
    5,
    child(
      "process.stdout.write('ok'); process.stderr.write('note')",
      args => {
        sshArgs = args;
      },
    ),
  );

  assert.deepEqual(result, {
    exitCode: 0,
    stdout: 'ok',
    stderr: 'note',
    timedOut: false,
    truncated: false,
  });
  assert.deepEqual(sshArgs, [
    '-o',
    'BatchMode=yes',
    '-o',
    'ConnectTimeout=10',
    'unit-vps',
    'printf ok',
  ]);
});

test('preserves nonzero exit status', async () => {
  const result = await runSSH(
    'false',
    5,
    child("process.stderr.write('denied'); process.exit(7)"),
  );

  assert.equal(result.exitCode, 7);
  assert.equal(result.stderr, 'denied');
  assert.equal(result.timedOut, false);
});

test('kills a command after timeout', async () => {
  const result = await runSSH(
    'sleep 10',
    0.05,
    child('setTimeout(() => {}, 10_000)'),
  );

  assert.equal(result.timedOut, true);
  assert.equal(result.exitCode, null);
});

test('caps each output stream at 64 KiB', async () => {
  const result = await runSSH(
    'large-output',
    5,
    child("process.stdout.write('x'.repeat(70_000))"),
  );

  assert.equal(Buffer.byteLength(result.stdout), 65_536);
  assert.equal(result.truncated, true);
});

test('requires configured SSH target', async () => {
  delete process.env.SSH_TARGET;

  await assert.rejects(() => runSSH('true', 5, child('')), /SSH_TARGET is required/);
});

test('accepts a configured user and IPv4 target', async () => {
  process.env.SSH_TARGET = 'deploy@192.0.2.10';
  let sshArgs: readonly string[] = [];

  await runSSH('true', 5, child('', args => {
    sshArgs = args;
  }));

  assert.equal(sshArgs[4], 'deploy@192.0.2.10');
});
