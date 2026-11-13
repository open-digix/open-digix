import type { S3ClientConfig } from '@aws-sdk/client-s3';

export interface StorageConfig {
  bucket: string;
  client: S3ClientConfig;
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const rawValue = environment[name];
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  if (rawValue !== value) {
    throw new Error(`${name} must not contain leading or trailing whitespace`);
  }

  return value;
}

function endpoint(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('S3_ENDPOINT must be a valid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('S3_ENDPOINT must use http or https');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      'S3_ENDPOINT must not contain credentials, query, or fragment',
    );
  }

  if (url.pathname !== '/') {
    throw new Error('S3_ENDPOINT must not contain a path');
  }

  return url.origin;
}

function bucket(value: string): string {
  const validName = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(value);
  const resemblesIpAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value);

  if (!validName || value.includes('..') || resemblesIpAddress) {
    throw new Error(
      'S3_BUCKET must be 3-63 lowercase letters, numbers, dots, or hyphens and must not resemble an IP address',
    );
  }

  return value;
}

function boolean(environment: NodeJS.ProcessEnv, name: string): boolean {
  const value = required(environment, name);

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`${name} must be true or false`);
}

export function loadStorageConfig(
  environment: NodeJS.ProcessEnv = process.env,
): StorageConfig {
  return {
    bucket: bucket(required(environment, 'S3_BUCKET')),
    client: {
      endpoint: endpoint(required(environment, 'S3_ENDPOINT')),
      region: required(environment, 'S3_REGION'),
      forcePathStyle: boolean(environment, 'S3_FORCE_PATH_STYLE'),
      credentials: {
        accessKeyId: required(environment, 'S3_ACCESS_KEY_ID'),
        secretAccessKey: required(environment, 'S3_SECRET_ACCESS_KEY'),
      },
    },
  };
}
