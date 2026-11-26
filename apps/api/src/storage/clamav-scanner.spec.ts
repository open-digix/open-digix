import { createServer, type Server, type Socket } from 'node:net';
import { ClamavScanner } from './clamav-scanner';

describe('ClamavScanner INSTREAM protocol', () => {
  let server: Server;
  let port: number;
  let response: string;
  let received: Buffer;
  const sockets = new Set<Socket>();

  beforeEach(async () => {
    response = 'stream: OK\0';
    received = Buffer.alloc(0);
    server = createServer((socket: Socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.on('data', (chunk: Buffer) => {
        received = Buffer.concat([received, chunk]);
        if (
          received.length >= 21 &&
          received.subarray(-4).equals(Buffer.alloc(4))
        ) {
          socket.write(response);
        }
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    port = address.port;
  });

  afterEach(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('streams bytes to clamd and accepts only an OK response', async () => {
    const scanner = new ClamavScanner({
      host: '127.0.0.1',
      port,
      timeoutMs: 500,
    });
    await expect(scanner.scan(Buffer.from('abc'))).resolves.toBe('clean');
    expect(received).toEqual(
      Buffer.concat([
        Buffer.from('zINSTREAM\0'),
        Buffer.from([0, 0, 0, 3]),
        Buffer.from('abc'),
        Buffer.alloc(4),
      ]),
    );
  });

  it.each([
    ['stream: Eicar-Test-Signature FOUND\0', 'rejected'],
    ['stream: size limit exceeded ERROR\0', 'error'],
  ])('handles %s without marking it clean', async (reply, expected) => {
    response = reply;
    const scanner = new ClamavScanner({
      host: '127.0.0.1',
      port,
      timeoutMs: 500,
    });
    if (expected === 'error')
      await expect(scanner.scan(Buffer.from('abc'))).rejects.toThrow();
    else
      await expect(scanner.scan(Buffer.from('abc'))).resolves.toBe('rejected');
  });
});
