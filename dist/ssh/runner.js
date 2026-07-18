import { spawn, } from 'node:child_process';
const MAX_OUTPUT_BYTES = 65_536;
export async function runSSH(command, timeoutSeconds = 60, spawnProcess = spawn) {
    const target = process.env.SSH_TARGET?.trim();
    if (!target)
        throw new Error('SSH_TARGET is required');
    if (!/^(?:[A-Za-z0-9][A-Za-z0-9._-]*@)?[A-Za-z0-9][A-Za-z0-9.-]*$/.test(target)) {
        throw new Error('SSH_TARGET must be an SSH alias or user@host');
    }
    const timeoutMs = Math.min(Math.max(timeoutSeconds, 0.001), 300) * 1000;
    return new Promise((resolve, reject) => {
        const child = spawnProcess('ssh', [
            '-o',
            'BatchMode=yes',
            '-o',
            'ConnectTimeout=10',
            target,
            command,
        ], { shell: false, windowsHide: true });
        let stdout = Buffer.alloc(0);
        let stderr = Buffer.alloc(0);
        let timedOut = false;
        let truncated = false;
        let settled = false;
        const append = (current, chunk) => {
            const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            const available = MAX_OUTPUT_BYTES - current.length;
            if (available <= 0) {
                truncated = true;
                return current;
            }
            if (data.length > available)
                truncated = true;
            return Buffer.concat([current, data.subarray(0, available)]);
        };
        child.stdout.on('data', chunk => {
            stdout = append(stdout, chunk);
        });
        child.stderr.on('data', chunk => {
            stderr = append(stderr, chunk);
        });
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, timeoutMs);
        child.once('error', error => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            reject(new Error(`Unable to start ssh: ${error.message}`));
        });
        child.once('close', code => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            resolve({
                exitCode: timedOut ? null : code,
                stdout: stdout.toString('utf8'),
                stderr: stderr.toString('utf8'),
                timedOut,
                truncated,
            });
        });
    });
}
//# sourceMappingURL=runner.js.map