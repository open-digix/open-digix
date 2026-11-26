export interface ScannerConfig {
  host: string;
  port: number;
  timeoutMs: number;
}

export function loadScannerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ScannerConfig {
  const host = env.CLAMAV_HOST?.trim();
  const port = Number(env.CLAMAV_PORT);
  const timeoutMs = Number(env.CLAMAV_TIMEOUT_MS);
  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1
  ) {
    throw new Error(
      'CLAMAV_HOST, CLAMAV_PORT and CLAMAV_TIMEOUT_MS must be configured',
    );
  }
  return { host, port, timeoutMs };
}
