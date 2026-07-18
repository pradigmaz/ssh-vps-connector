import { type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process';
type SpawnProcess = (command: string, args: readonly string[], options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams;
export interface SSHResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
    truncated: boolean;
}
export declare function runSSH(command: string, timeoutSeconds?: number, spawnProcess?: SpawnProcess): Promise<SSHResult>;
export {};
//# sourceMappingURL=runner.d.ts.map