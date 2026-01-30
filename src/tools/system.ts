import { ServiceStatusSchema, SSHConfigSchema } from '../security/schemas.js';
import { sanitizeParameter } from '../security/validator.js';
import { SSHConnection } from '../ssh/connection.js';
import { SSHExecutor } from '../ssh/executor.js';

export async function checkServiceStatus(args: any) {
  const params = ServiceStatusSchema.parse(args);
  const serviceName = sanitizeParameter(params.serviceName);
  
  const connection = new SSHConnection();
  await connection.connect(params);
  
  const executor = new SSHExecutor(connection.getSSH());
  const result = await executor.executeCommand(`systemctl status ${serviceName}`);
  
  connection.dispose();
  return { content: [{ type: 'text', text: result }] };
}

export async function monitorResources(args: any) {
  const params = SSHConfigSchema.parse(args);
  
  const connection = new SSHConnection();
  await connection.connect(params);
  
  const executor = new SSHExecutor(connection.getSSH());
  const commands = [
    'echo "=== CPU Usage ==="',
    'top -bn1 | grep "Cpu(s)" | head -1',
    'echo "=== Memory Usage ==="',
    'free -h',
    'echo "=== Disk Usage ==="',
    'df -h',
    'echo "=== Load Average ==="',
    'uptime'
  ];
  const result = await executor.executeCommand(commands.join(' && '));
  
  connection.dispose();
  return { content: [{ type: 'text', text: result }] };
}