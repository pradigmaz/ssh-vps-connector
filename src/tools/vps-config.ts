import * as fs from 'fs/promises';
import * as path from 'path';
import { SSHConfigSchema, VPSConfig } from '../security/schemas.js';
import { SSHConnection } from '../ssh/connection.js';
import { SSHExecutor } from '../ssh/executor.js';
import { DockerCollector } from '../collectors/docker.js';
import { ServicesCollector } from '../collectors/services.js';
import { NetworkCollector } from '../collectors/network.js';

const vpsConfigPath = path.join(process.cwd(), '.ai', 'vps-config.json');

async function ensureConfigDir(): Promise<void> {
  const configDir = path.dirname(vpsConfigPath);
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function loadVPSConfig(): Promise<VPSConfig | null> {
  try {
    const data = await fs.readFile(vpsConfigPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveVPSConfig(config: VPSConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(vpsConfigPath, JSON.stringify(config, null, 2));
}

async function collectVPSData(executor: SSHExecutor): Promise<VPSConfig> {
  const dockerCollector = new DockerCollector(executor);
  const servicesCollector = new ServicesCollector(executor);
  const networkCollector = new NetworkCollector(executor);

  const containers = await dockerCollector.collectContainers();
  const services = await servicesCollector.extractCredentials(containers);
  const dockerComposeFiles = await dockerCollector.collectComposeFiles();
  const networkConfig = await networkCollector.collectNetworkConfig();

  return {
    docker_containers: containers,
    services,
    docker_compose_files: dockerComposeFiles,
    network_config: networkConfig,
    last_updated: new Date().toISOString()
  };
}

export async function refreshVPSData(args: any) {
  const params = SSHConfigSchema.parse(args);
  
  const connection = new SSHConnection();
  await connection.connect(params);
  
  const executor = new SSHExecutor(connection.getSSH());
  const vpsConfig = await collectVPSData(executor);
  await saveVPSConfig(vpsConfig);
  
  connection.dispose();
  return { content: [{ type: 'text', text: 'VPS configuration data refreshed successfully' }] };
}

export async function getVPSConfig() {
  const vpsConfig = await loadVPSConfig();
  const configText = vpsConfig ? JSON.stringify(vpsConfig, null, 2) : 'No VPS configuration data available';
  return { content: [{ type: 'text', text: configText }] };
}

export async function initializeVPSData(): Promise<VPSConfig | null> {
  try {
    const connection = new SSHConnection();
    await connection.connect({});
    
    console.log('[SSH-VPS] Collecting VPS data...');
    
    const executor = new SSHExecutor(connection.getSSH());
    const vpsConfig = await collectVPSData(executor);
    await saveVPSConfig(vpsConfig);
    
    console.log('[SSH-VPS] VPS data collected and saved');
    connection.dispose();
    
    return vpsConfig;
  } catch (error) {
    console.error('[SSH-VPS] Failed to collect VPS data:', error);
    return null;
  }
}