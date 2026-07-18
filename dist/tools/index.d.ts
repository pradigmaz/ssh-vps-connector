export declare function sshStatus(): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export declare function sshExecute(args: unknown): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=index.d.ts.map