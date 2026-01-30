const DESTRUCTIVE_COMMANDS = [
  'rm -rf', 'dd if=', 'mkfs', 'fdisk', 'parted', 'shutdown', 'reboot',
  'halt', 'poweroff', 'init 0', 'init 6', 'systemctl poweroff',
  'systemctl reboot', 'docker system prune -a', 'docker volume prune',
  'docker run --privileged', 'nsenter', 'chroot'
];

const DANGEROUS_CHARS = /[;|&$()]/;

export function sanitizeParameter(param: string): string {
  if (DANGEROUS_CHARS.test(param)) {
    console.error(`[${new Date().toISOString()}] BLOCKED: Dangerous characters in parameter: ${param}`);
    throw new Error(`Invalid parameter: contains dangerous characters`);
  }
  return param.replace(/['"]/g, '').trim();
}

export function validateCommand(command: string): void {
  const allowedCommands = process.env.ALLOWED_COMMANDS?.split(',').map(cmd => cmd.trim()).filter(Boolean) || [];
  const allowedDirectories = process.env.ALLOWED_DIRECTORIES?.split(',').map(dir => dir.trim()).filter(Boolean) || [];
  
  // Check for dangerous characters
  if (DANGEROUS_CHARS.test(command)) {
    console.error(`[${new Date().toISOString()}] BLOCKED: Command injection attempt: ${command}`);
    throw new Error(`Command blocked: contains dangerous characters`);
  }

  // Check whitelist - if empty, block everything
  if (allowedCommands.length === 0) {
    console.error(`[${new Date().toISOString()}] Command not in whitelist: ${command}`);
    throw new Error(`Command not in whitelist: ${command}`);
  }

  // Get base command (first token)
  const baseCommand = command.split(' ')[0].toLowerCase();
  const isAllowed = allowedCommands.some(allowed => baseCommand === allowed.toLowerCase());
  if (!isAllowed) {
    console.error(`[${new Date().toISOString()}] Command not in whitelist: ${baseCommand}. Allowed: ${allowedCommands.join(', ')}`);
    throw new Error(`Command not in whitelist: ${baseCommand}`);
  }

  // Strict validation for docker/systemctl subcommands
  if (baseCommand === 'docker' || baseCommand === 'systemctl') {
    const tokens = command.split(' ');
    if (tokens.length > 1) {
      const subCommand = tokens[1].toLowerCase();
      if (baseCommand === 'docker' && ['run', 'exec'].includes(subCommand)) {
        if (command.includes('--privileged')) {
          console.error(`[${new Date().toISOString()}] BLOCKED: Privileged docker command: ${command}`);
          throw new Error(`Privileged docker commands not allowed`);
        }
      }
    }
  }

  // Check destructive commands by tokens
  const commandTokens = command.toLowerCase().split(' ');
  for (const blocked of DESTRUCTIVE_COMMANDS) {
    const blockedTokens = blocked.toLowerCase().split(' ');
    if (blockedTokens.every(token => commandTokens.includes(token))) {
      console.error(`[${new Date().toISOString()}] BLOCKED: ${command}`);
      throw new Error(`Command blocked: ${command}`);
    }
  }

  // Check whitelist directories
  if (allowedDirectories.length > 0) {
    const pathMatch = command.match(/(?:cd|ls|cat|docker\s+.*-v|cp|mv|mkdir|touch|nano|vim)\s+([^\s;|&]+)/);
    if (pathMatch) {
      const cmdPath = pathMatch[1].replace(/['"]/g, '');
      if (cmdPath.includes('..') || !allowedDirectories.some(dir => cmdPath.startsWith(dir))) {
        console.error(`[${new Date().toISOString()}] BLOCKED PATH: ${command}`);
        throw new Error(`Path not allowed: ${cmdPath}`);
      }
    }
  }
}