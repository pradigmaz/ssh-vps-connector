import { z } from 'zod';

export const SSHExecuteSchema = z.object({
  command: z.string().trim().min(1).max(16_384),
  timeoutSeconds: z.number().int().min(1).max(300).default(60),
}).strict();
