import { SSHExecutor } from '../ssh/executor.js';

export class DockerCollector {
  constructor(private executor: SSHExecutor) {}

  async collectContainers(): Promise<any[]> {
    try {
      const result = await this.executor.executeCommand('docker ps -a --format "{{json .}}"');
      return result.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async collectComposeFiles(): Promise<any[]> {
    try {
      const result = await this.executor.executeCommand('find /opt /home -name "docker-compose.yml" -o -name "docker-compose.yaml" 2>/dev/null | head -10');
      const files = result.split('\n').filter(f => f.trim());
      
      const composeData = [];
      for (const file of files) {
        try {
          const content = await this.executor.executeCommand(`cat "${file}"`);
          composeData.push({ path: file, content });
        } catch {}
      }
      return composeData;
    } catch {
      return [];
    }
  }
}