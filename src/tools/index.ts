import { SSHExecuteSchema } from '../security/schemas.js';
import { runSSH, type SSHResult } from '../ssh/runner.js';

function toolResult(result: SSHResult) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    isError: result.timedOut || result.exitCode !== 0,
  };
}

export async function sshStatus() {
  const result = await runSSH('printf "ssh-ready\\n" && whoami && hostname && pwd && uname -srm', 30);
  return toolResult(result);
}

export async function sshExecute(args: unknown) {
  const { command, timeoutSeconds } = SSHExecuteSchema.parse(args);
  return toolResult(await runSSH(command, timeoutSeconds));
}
