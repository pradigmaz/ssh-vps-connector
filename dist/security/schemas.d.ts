import { z } from 'zod';
export declare const SSHExecuteSchema: z.ZodObject<{
    command: z.ZodString;
    timeoutSeconds: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    command: string;
    timeoutSeconds: number;
}, {
    command: string;
    timeoutSeconds?: number | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map