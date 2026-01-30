#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { NodeSSH } from 'node-ssh';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
// Validation schemas
const SSHConfigSchema = z.object({
    host: z.string().optional(),
    username: z.string().optional(),
    privateKeyPath: z.string().optional(),
    password: z.string().optional(),
    port: z.number().default(22),
});
const ExecuteCommandSchema = SSHConfigSchema.extend({
    command: z.string(),
});
const DockerLogsSchema = SSHConfigSchema.extend({
    containerName: z.string(),
    lines: z.number().default(100),
});
const ServiceStatusSchema = SSHConfigSchema.extend({
    serviceName: z.string(),
});
const DESTRUCTIVE_COMMANDS = [
    'rm -rf', 'dd if=', 'mkfs', 'fdisk', 'parted', 'shutdown', 'reboot',
    'halt', 'poweroff', 'init 0', 'init 6', 'systemctl poweroff',
    'systemctl reboot', 'docker system prune -a', 'docker volume prune'
];
class SSHVPSConnector {
    server;
    ssh;
    defaultConfig;
    vpsConfigPath;
    vpsConfig = null;
    constructor() {
        this.server = new Server({
            name: 'ssh-vps-connector',
            version: '1.0.0',
        }, {
            capabilities: { tools: {} },
        });
        this.ssh = new NodeSSH();
        this.vpsConfigPath = path.join(process.cwd(), '.ai', 'vps-config.json');
        this.defaultConfig = {
            host: process.env.SSH_HOST,
            username: process.env.SSH_USERNAME,
            privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
            password: process.env.SSH_PASSWORD,
            port: parseInt(process.env.SSH_PORT || '22'),
        };
        this.setupHandlers();
    }
    async ensureConfigDir() {
        const configDir = path.dirname(this.vpsConfigPath);
        try {
            await fs.mkdir(configDir, { recursive: true });
        }
        catch (error) {
            // Directory might already exist
        }
    }
    async loadVPSConfig() {
        try {
            const data = await fs.readFile(this.vpsConfigPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async saveVPSConfig(config) {
        await this.ensureConfigDir();
        await fs.writeFile(this.vpsConfigPath, JSON.stringify(config, null, 2));
    }
    async connectSSH(config) {
        const finalConfig = {
            host: config.host || this.defaultConfig.host,
            username: config.username || this.defaultConfig.username,
            password: config.password || this.defaultConfig.password,
            privateKeyPath: config.privateKeyPath || this.defaultConfig.privateKeyPath,
            port: config.port || this.defaultConfig.port,
        };
        if (!finalConfig.host || !finalConfig.username) {
            throw new Error('Host and username are required');
        }
        const sshConfig = {
            host: finalConfig.host,
            username: finalConfig.username,
            port: finalConfig.port,
        };
        if (finalConfig.password) {
            sshConfig.password = finalConfig.password;
        }
        else if (finalConfig.privateKeyPath) {
            sshConfig.privateKeyPath = finalConfig.privateKeyPath;
        }
        else {
            throw new Error('Either password or privateKeyPath must be provided');
        }
        await this.ssh.connect(sshConfig);
    }
    async executeCommand(command) {
        const result = await this.ssh.execCommand(command);
        return result.stdout || result.stderr || '';
    }
    async collectDockerContainers() {
        try {
            const result = await this.executeCommand('docker ps -a --format "{{json .}}"');
            return result.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
        }
        catch {
            return [];
        }
    }
    async collectDockerComposeFiles() {
        try {
            const result = await this.executeCommand('find /opt /home -name "docker-compose.yml" -o -name "docker-compose.yaml" 2>/dev/null | head -10');
            const files = result.split('\n').filter(f => f.trim());
            const composeData = [];
            for (const file of files) {
                try {
                    const content = await this.executeCommand(`cat "${file}"`);
                    composeData.push({ path: file, content });
                }
                catch { }
            }
            return composeData;
        }
        catch {
            return [];
        }
    }
    async extractCredentials(containers) {
        const services = {};
        for (const container of containers) {
            try {
                const inspectResult = await this.executeCommand(`docker inspect ${container.Names}`);
                const inspect = JSON.parse(inspectResult)[0];
                const env = inspect.Config?.Env || [];
                const name = container.Names.replace(/^\//, '');
                if (name.includes('postgres') || name.includes('db')) {
                    const dbConfig = { type: 'postgresql' };
                    for (const envVar of env) {
                        if (envVar.startsWith('POSTGRES_USER='))
                            dbConfig.username = envVar.split('=')[1];
                        if (envVar.startsWith('POSTGRES_PASSWORD='))
                            dbConfig.password = envVar.split('=')[1];
                        if (envVar.startsWith('POSTGRES_DB='))
                            dbConfig.database = envVar.split('=')[1];
                    }
                    if (inspect.NetworkSettings?.Ports?.['5432/tcp']) {
                        dbConfig.port = inspect.NetworkSettings.Ports['5432/tcp'][0]?.HostPort || 5432;
                    }
                    services[name] = dbConfig;
                }
                if (name.includes('redis')) {
                    const redisConfig = { type: 'redis' };
                    if (inspect.NetworkSettings?.Ports?.['6379/tcp']) {
                        redisConfig.port = inspect.NetworkSettings.Ports['6379/tcp'][0]?.HostPort || 6379;
                    }
                    services[name] = redisConfig;
                }
                if (name.includes('mongo')) {
                    const mongoConfig = { type: 'mongodb' };
                    for (const envVar of env) {
                        if (envVar.startsWith('MONGO_INITDB_ROOT_USERNAME='))
                            mongoConfig.username = envVar.split('=')[1];
                        if (envVar.startsWith('MONGO_INITDB_ROOT_PASSWORD='))
                            mongoConfig.password = envVar.split('=')[1];
                    }
                    if (inspect.NetworkSettings?.Ports?.['27017/tcp']) {
                        mongoConfig.port = inspect.NetworkSettings.Ports['27017/tcp'][0]?.HostPort || 27017;
                    }
                    services[name] = mongoConfig;
                }
            }
            catch { }
        }
        return services;
    }
    async collectNetworkConfig() {
        try {
            const networks = await this.executeCommand('docker network ls --format "{{json .}}"');
            const ports = await this.executeCommand('netstat -tlnp 2>/dev/null | grep LISTEN || ss -tlnp | grep LISTEN');
            return {
                docker_networks: networks.split('\n').filter(line => line.trim()).map(line => {
                    try {
                        return JSON.parse(line);
                    }
                    catch {
                        return null;
                    }
                }).filter(Boolean),
                listening_ports: ports.split('\n').filter(line => line.trim())
            };
        }
        catch {
            return {};
        }
    }
    async collectVPSData() {
        const containers = await this.collectDockerContainers();
        const services = await this.extractCredentials(containers);
        const dockerComposeFiles = await this.collectDockerComposeFiles();
        const networkConfig = await this.collectNetworkConfig();
        return {
            docker_containers: containers,
            services,
            docker_compose_files: dockerComposeFiles,
            network_config: networkConfig,
            last_updated: new Date().toISOString()
        };
    }
    async initializeVPSData() {
        try {
            await this.connectSSH(this.defaultConfig);
            console.log('[SSH-VPS] Collecting VPS data...');
            this.vpsConfig = await this.collectVPSData();
            await this.saveVPSConfig(this.vpsConfig);
            console.log('[SSH-VPS] VPS data collected and saved');
            this.ssh.dispose();
        }
        catch (error) {
            console.error('[SSH-VPS] Failed to collect VPS data:', error);
        }
    }
    setupHandlers() {
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
                    case 'ssh_execute_command': {
                        const params = ExecuteCommandSchema.parse(args);
                        if (DESTRUCTIVE_COMMANDS.some(cmd => params.command.toLowerCase().includes(cmd.toLowerCase()))) {
                            throw new Error(`Destructive command blocked: ${params.command}`);
                        }
                        await this.connectSSH(params);
                        const result = await this.executeCommand(params.command);
                        this.ssh.dispose();
                        return { content: [{ type: 'text', text: result }] };
                    }
                    case 'ssh_read_docker_logs': {
                        const params = DockerLogsSchema.parse(args);
                        await this.connectSSH(params);
                        const result = await this.executeCommand(`docker logs --tail ${params.lines} ${params.containerName}`);
                        this.ssh.dispose();
                        return { content: [{ type: 'text', text: result }] };
                    }
                    case 'ssh_check_service_status': {
                        const params = ServiceStatusSchema.parse(args);
                        await this.connectSSH(params);
                        const result = await this.executeCommand(`systemctl status ${params.serviceName}`);
                        this.ssh.dispose();
                        return { content: [{ type: 'text', text: result }] };
                    }
                    case 'ssh_monitor_resources': {
                        const params = SSHConfigSchema.parse(args);
                        await this.connectSSH(params);
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
                        const result = await this.executeCommand(commands.join(' && '));
                        this.ssh.dispose();
                        return { content: [{ type: 'text', text: result }] };
                    }
                    case 'ssh_list_containers': {
                        const params = SSHConfigSchema.parse(args);
                        await this.connectSSH(params);
                        const result = await this.executeCommand('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
                        this.ssh.dispose();
                        return { content: [{ type: 'text', text: result }] };
                    }
                    case 'ssh_refresh_vps_data': {
                        const params = SSHConfigSchema.parse(args);
                        await this.connectSSH(params);
                        this.vpsConfig = await this.collectVPSData();
                        await this.saveVPSConfig(this.vpsConfig);
                        this.ssh.dispose();
                        return { content: [{ type: 'text', text: 'VPS configuration data refreshed successfully' }] };
                    }
                    case 'ssh_get_vps_config': {
                        if (!this.vpsConfig) {
                            this.vpsConfig = await this.loadVPSConfig();
                        }
                        const configText = this.vpsConfig ? JSON.stringify(this.vpsConfig, null, 2) : 'No VPS configuration data available';
                        return { content: [{ type: 'text', text: configText }] };
                    }
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [{ type: 'text', text: `Error: ${error}` }],
                    isError: true,
                };
            }
        });
    }
    async run() {
        try {
            console.log('[SSH-VPS] Initializing SSH VPS Connector...');
            // Load existing config or collect new data
            this.vpsConfig = await this.loadVPSConfig();
            if (!this.vpsConfig && this.defaultConfig.host && this.defaultConfig.username) {
                await this.initializeVPSData();
            }
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.log('[SSH-VPS] Server running successfully');
        }
        catch (error) {
            console.error('[SSH-VPS] Failed to start server:', error);
            process.exit(1);
        }
    }
}
const server = new SSHVPSConnector();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map