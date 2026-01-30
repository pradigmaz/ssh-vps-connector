import { NodeSSH } from 'node-ssh';

export class SSHExecutor {
  constructor(private ssh: NodeSSH) {}

  async executeCommand(command: string): Promise<string> {
    const result = await Promise.race([
      this.ssh.execCommand(command),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Command timeout after 5 seconds')), 5000)
      )
    ]);
    return result.stdout || result.stderr || '';
  }
}