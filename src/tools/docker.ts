import { DockerLogsSchema, SSHConfigSchema } from '../security/schemas.js';
import { sanitizeParameter } from '../security/validator.js';
import { SSHConnection } from '../ssh/connection.js';
import { SSHExecutor } from '../ssh/executor.js';

export async function readDockerLogs(args: any) {
  const params = DockerLogsSchema.parse(args);
  const containerName = sanitizeParameter(params.containerName);
  
  const connection = new SSHConnection();
  await connection.connect(params);
  
  const executor = new SSHExecutor(connection.getSSH());
  const result = await executor.executeCommand(`docker logs --tail ${params.lines} ${containerName}`);
  
  connection.dispose();
  return { content: [{ type: 'text', text: result }] };
}

export async function listContainers(args: any) {
  const params = SSHConfigSchema.parse(args);
  
  const connection = new SSHConnection();
  await connection.connect(params);
  
  const executor = new SSHExecutor(connection.getSSH());
  const result = await executor.executeCommand('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
  
  connection.dispose();
  return { content: [{ type: 'text', text: result }] };
}