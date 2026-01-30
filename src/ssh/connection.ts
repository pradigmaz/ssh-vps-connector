import { NodeSSH } from 'node-ssh';
import { defaultConfig } from '../core/config.js';

export class SSHConnection {
  private ssh: NodeSSH;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect(config: any): Promise<void> {
    const finalConfig = {
      host: config.host || defaultConfig.host,
      username: config.username || defaultConfig.username,
      password: config.password || defaultConfig.password,
      privateKeyPath: config.privateKeyPath || defaultConfig.privateKeyPath,
      port: config.port || defaultConfig.port,
    };

    if (!finalConfig.host || !finalConfig.username) {
      throw new Error('Host and username are required');
    }

    const sshConfig: any = {
      host: finalConfig.host,
      username: finalConfig.username,
      port: finalConfig.port,
    };

    if (finalConfig.password) {
      sshConfig.password = finalConfig.password;
    } else if (finalConfig.privateKeyPath) {
      sshConfig.privateKeyPath = finalConfig.privateKeyPath;
    } else {
      throw new Error('Either password or privateKeyPath must be provided');
    }

    await this.ssh.connect(sshConfig);
  }

  dispose(): void {
    this.ssh.dispose();
  }

  getSSH(): NodeSSH {
    return this.ssh;
  }
}