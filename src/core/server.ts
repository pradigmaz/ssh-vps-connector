import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { sshExecute, sshStatus } from '../tools/index.js';

export class MCPServer {
  private readonly server = new Server(
    { name: 'ssh-vps-connector', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  constructor() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'ssh_status',
          description: 'Check the configured SSH target with harmless system commands',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            openWorldHint: true,
          },
        },
        {
          name: 'ssh_execute',
          description: 'Execute one command on the configured SSH target',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', minLength: 1, maxLength: 16_384 },
              timeoutSeconds: {
                type: 'integer',
                minimum: 1,
                maximum: 300,
                default: 60,
              },
            },
            required: ['command'],
            additionalProperties: false,
          },
          annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            openWorldHint: true,
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      try {
        const { name, arguments: args } = request.params;
        if (name === 'ssh_status') return await sshStatus();
        if (name === 'ssh_execute') return await sshExecute(args);
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    console.error('[ssh-vps-connector] starting');
    await this.server.connect(new StdioServerTransport());
    console.error('[ssh-vps-connector] ready');
  }
}
