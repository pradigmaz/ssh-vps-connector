import { ExecuteCommandSchema } from '../security/schemas.js';
import { validateCommand } from '../security/validator.js';
import { SSHConnection } from '../ssh/connection.js';
import { SSHExecutor } from '../ssh/executor.js';

export async function executeCommand(args: any) {
  const params = ExecuteCommandSchema.parse(args);
  validateCommand(params.command);
  
  const connection = new SSHConnection();
  await connection.connect(params);
  
  const executor = new SSHExecutor(connection.getSSH());
  const result = await executor.executeCommand(params.command);
  
  connection.dispose();
  return { content: [{ type: 'text', text: result }] };
}