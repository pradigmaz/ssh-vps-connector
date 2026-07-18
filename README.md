# SSH VPS Connector

Minimal MCP server for running commands through native OpenSSH. Docker has no special integration; run Docker commands through `ssh_execute` when needed.

## Requirements

- Node.js 22+
- OpenSSH client available as `ssh` in `PATH`
- A working SSH alias or `user@host` target
- Host key verified once with ordinary OpenSSH before MCP use

Example SSH config:

```sshconfig
Host my-vps
  HostName 203.0.113.10
  User deploy
  IdentityFile ~/.ssh/id_ed25519
```

Verify manually:

```powershell
ssh my-vps "whoami; hostname; pwd"
```

## Install

```powershell
npm ci
npm test
npm run build
```

Codex configuration:

```toml
[mcp_servers.ssh-vps-connector]
command = "node"
args = ["dist/index.js"]
cwd = 'E:\mcp\ssh-vps-connector'
enabled = true
startup_timeout_sec = 30.0
tool_timeout_sec = 330.0
env = { SSH_TARGET = "deploy@192.0.2.10" }
```

Restart Codex after changing MCP configuration.

## Tools

- `ssh_status` runs harmless identity/system checks.
- `ssh_execute` runs one command with an optional timeout from 1 to 300 seconds.

Results contain `exitCode`, `stdout`, `stderr`, `timedOut`, and `truncated`. Nonzero exit codes and timeouts are MCP errors. Each output stream is capped at 64 KiB.

## Security

- Host, user, key, and password are never accepted in MCP tool arguments.
- Authentication and `known_hosts` verification stay in native OpenSSH.
- `BatchMode=yes` prevents password prompts from hanging the MCP process.
- `ssh_execute` is intentionally unrestricted. Use a dedicated VPS account and server-side `sudo` policy for authorization.
