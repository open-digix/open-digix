import { loadStorageConfig } from './storage.config';

describe('loadStorageConfig', () => {
  const validEnvironment: NodeJS.ProcessEnv = {
    S3_ENDPOINT: 'http://object-storage:8333',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'digix-files',
    S3_ACCESS_KEY_ID: 'digix-local',
    S3_SECRET_ACCESS_KEY: 'local-secret',
    S3_FORCE_PATH_STYLE: 'true',
  };

  it('loads an explicit S3-compatible storage configuration', () => {
    expect(loadStorageConfig(validEnvironment)).toEqual({
      bucket: 'digix-files',
      client: {
        endpoint: 'http://object-storage:8333',
        region: 'us-east-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'digix-local',
          secretAccessKey: 'local-secret',
        },
      },
    });
  });

  it('normalizes the endpoint by removing a trailing slash', () => {
    expect(
      loadStorageConfig({
        ...validEnvironment,
        S3_ENDPOINT: 'https://s3.example.test/',
      }).client.endpoint,
    ).toBe('https://s3.example.test');
  });

  it.each([
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_FORCE_PATH_STYLE',
  ])('fails fast when %s is missing', (name) => {
    const environment = { ...validEnvironment };
    delete environment[name];

    expect(() => loadStorageConfig(environment)).toThrow(`${name} is required`);
  });

  it('rejects a non-HTTP endpoint', () => {
    expect(() =>
      loadStorageConfig({
        ...validEnvironment,
        S3_ENDPOINT: 'file:///tmp/storage',
      }),
    ).toThrow('S3_ENDPOINT must use http or https');
  });

  it.each([
    'http://user:password@object-storage:8333',
    'http://object-storage:8333?debug=true',
    'http://object-storage:8333#fragment',
  ])('rejects endpoint metadata in %s', (value) => {
    expect(() =>
      loadStorageConfig({ ...validEnvironment, S3_ENDPOINT: value }),
    ).toThrow('S3_ENDPOINT must not contain credentials, query, or fragment');
  });

  it('rejects an endpoint with a path', () => {
    expect(() =>
      loadStorageConfig({
        ...validEnvironment,
        S3_ENDPOINT: 'http://object-storage:8333/s3',
      }),
    ).toThrow('S3_ENDPOINT must not contain a path');
  });

  it.each(['yes', '1', 'TRUE', ''])(
    'rejects invalid path-style value %s',
    (value) => {
      expect(() =>
        loadStorageConfig({
          ...validEnvironment,
          S3_FORCE_PATH_STYLE: value,
        }),
      ).toThrow(
        value
          ? 'S3_FORCE_PATH_STYLE must be true or false'
          : 'S3_FORCE_PATH_STYLE is required',
      );
    },
  );

  it.each(['ab', 'DigiX-Files', 'digix..files', '127.0.0.1'])(
    'rejects invalid bucket name %s',
    (value) => {
      expect(() =>
        loadStorageConfig({ ...validEnvironment, S3_BUCKET: value }),
      ).toThrow('S3_BUCKET must be 3-63 lowercase letters');
    },
  );

  it('rejects leading or trailing whitespace in credentials', () => {
    expect(() =>
      loadStorageConfig({
        ...validEnvironment,
        S3_SECRET_ACCESS_KEY: ' local-secret',
      }),
    ).toThrow(
      'S3_SECRET_ACCESS_KEY must not contain leading or trailing whitespace',
    );
  });
});
