# SSH VPS Connector Configuration

## Setup Instructions

1. Open the MCP configuration file:
   ```bash
   nano /home/zaikana/.kiro/settings/mcp.json
   ```

2. Find the `ssh-vps-connector` section and replace the placeholders:
   - Replace `<VPS_IP>` with your VPS IP address
   - Replace `<USERNAME>` with your SSH username

3. Ensure your SSH private key exists at `/home/zaikana/.ssh/id_rsa`
   - If using a different key path, update `SSH_PRIVATE_KEY_PATH`

4. Test SSH connection manually first:
   ```bash
   ssh -i /home/zaikana/.ssh/id_rsa <USERNAME>@<VPS_IP>
   ```

5. Restart Kiro CLI to load the new MCP server configuration.

## Example Configuration
```json
"ssh-vps-connector": {
  "command": "node",
  "args": ["/home/zaikana/.kiro/mcp-servers/ssh-vps-connector/dist/index.js"],
  "env": {
    "SSH_HOST": "192.168.1.100",
    "SSH_USERNAME": "ubuntu",
    "SSH_PRIVATE_KEY_PATH": "/home/zaikana/.ssh/id_rsa"
  },
  "disabled": false,
  "autoApprove": []
}
```