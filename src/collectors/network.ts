import { SSHExecutor } from '../ssh/executor.js';

export class NetworkCollector {
  constructor(private executor: SSHExecutor) {}

  async collectNetworkConfig(): Promise<any> {
    try {
      const networks = await this.executor.executeCommand('docker network ls --format "{{json .}}"');
      const ports = await this.executor.executeCommand('netstat -tlnp 2>/dev/null | grep LISTEN || ss -tlnp | grep LISTEN');
      
      return {
        docker_networks: networks.split('\n').filter(line => line.trim()).map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean),
        listening_ports: ports.split('\n').filter(line => line.trim())
      };
    } catch {
      return {};
    }
  }
}