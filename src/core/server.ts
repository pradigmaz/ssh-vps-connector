import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { VPSConfig } from '../security/schemas.js';
import {
  executeCommand,
  readDockerLogs,
  listContainers,
  checkServiceStatus,
  monitorResources,
  refreshVPSData,
  getVPSConfig,
  loadVPSConfig,
  initializeVPSData
} from '../tools/index.js';
import { defaultConfig } from './config.js';

export class MCPServer {
  private server: Server;
  private vpsConfig: VPSConfig | null = null;

  constructor() {
    this.server = new Server({
      name: 'ssh-vps-connector',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} },
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'ssh_execute_command',
          description: 'Execute command on VPS via SSH',
          inputSchema: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              username: { type: 'string' },
              privateKeyPath: { type: 'string' },
              password: { type: 'string' },
              command: { type: 'string' },
              port: { type: 'number', default: 22 },
            },
            required: ['command'],
          },
        },
        {
          name: 'ssh_read_docker_logs',
          description: 'Read Docker container logs',
          inputSchema: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              username: { type: 'string' },
              privateKeyPath: { type: 'string' },
              password: { type: 'string' },
              containerName: { type: 'string' },
              lines: { type: 'number', default: 100 },
              port: { type: 'number', default: 22 },
            },
            required: ['containerName'],
          },
        },
        {
          name: 'ssh_check_service_status',
          description: 'Check systemd service status',
          inputSchema: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              username: { type: 'string' },
              privateKeyPath: { type: 'string' },
              password: { type: 'string' },
              serviceName: { type: 'string' },
              port: { type: 'number', default: 22 },
            },
            required: ['serviceName'],
          },
        },
        {
          name: 'ssh_monitor_resources',
          description: 'Monitor CPU/RAM/Disk usage',
          inputSchema: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              username: { type: 'string' },
              privateKeyPath: { type: 'string' },
              password: { type: 'string' },
              port: { type: 'number', default: 22 },
            },
            required: [],
          },
        },
        {
          name: 'ssh_list_containers',
          description: 'List Docker containers',
          inputSchema: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              username: { type: 'string' },
              privateKeyPath: { type: 'string' },
              password: { type: 'string' },
              port: { type: 'number', default: 22 },
            },
            required: [],
          },
        },
        {
          name: 'ssh_refresh_vps_data',
          description: 'Refresh collected VPS configuration data',
          inputSchema: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              username: { type: 'string' },
              privateKeyPath: { type: 'string' },
              password: { type: 'string' },
              port: { type: 'number', default: 22 },
            },
            required: [],
          },
        },
        {
          name: 'ssh_get_vps_config',
          description: 'Get cached VPS configuration data',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'ssh_execute_command':
            return await executeCommand(args);
          case 'ssh_read_docker_logs':
            return await readDockerLogs(args);
          case 'ssh_check_service_status':
            return await checkServiceStatus(args);
          case 'ssh_monitor_resources':
            return await monitorResources(args);
          case 'ssh_list_containers':
            return await listContainers(args);
          case 'ssh_refresh_vps_data':
            return await refreshVPSData(args);
          case 'ssh_get_vps_config':
            return await getVPSConfig();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error}` }],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    try {
      console.log('[SSH-VPS] Initializing SSH VPS Connector...');
      
      // Load existing config or collect new data
      this.vpsConfig = await loadVPSConfig();
      if (!this.vpsConfig && defaultConfig.host && defaultConfig.username) {
        this.vpsConfig = await initializeVPSData();
      }

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('[SSH-VPS] Server running successfully');
    } catch (error) {
      console.error('[SSH-VPS] Failed to start server:', error);
      process.exit(1);
    }
  }
}