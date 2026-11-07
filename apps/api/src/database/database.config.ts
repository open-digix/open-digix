import type { PoolConfig } from 'pg';

function readPort(value: string | undefined): number {
  const port = Number(value ?? 5432);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }

  return port;
}

export function getDatabaseConfig(): PoolConfig {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: readPort(process.env.DB_PORT),
    user: process.env.DB_USER ?? 'digix',
    database: process.env.DB_NAME ?? 'digix',
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 2000,
  };
}
