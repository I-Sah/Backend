export type AiResult = | {
    success: true;
    response: string;
} | {
    success: false;
    error: string;
}
