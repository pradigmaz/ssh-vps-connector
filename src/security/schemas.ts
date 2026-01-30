import { z } from 'zod';

export const SSHConfigSchema = z.object({
  host: z.string().optional(),
  username: z.string().optional(),
  privateKeyPath: z.string().optional(),
  password: z.string().optional(),
  port: z.number().default(22),
});

export const ExecuteCommandSchema = SSHConfigSchema.extend({
  command: z.string(),
});

export const DockerLogsSchema = SSHConfigSchema.extend({
  containerName: z.string(),
  lines: z.number().default(100),
});

export const ServiceStatusSchema = SSHConfigSchema.extend({
  serviceName: z.string(),
});

export interface VPSConfig {
  docker_containers: any[];
  services: Record<string, any>;
  docker_compose_files: any[];
  network_config: any;
  last_updated: string;
}