import { Socket } from 'node:net';
import { Inject, Injectable } from '@nestjs/common';
import { SCANNER_CONFIG } from './storage.constants';
import type { ScannerConfig } from './scanner.config';

export type ScanResult = 'clean' | 'rejected';

export interface FileScanner {
  scan(body: Uint8Array): Promise<ScanResult>;
}

@Injectable()
export class ClamavScanner implements FileScanner {
  constructor(@Inject(SCANNER_CONFIG) private readonly config: ScannerConfig) {}

  scan(body: Uint8Array): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let response = '';
      let settled = false;
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(error);
      };
      socket.setTimeout(this.config.timeoutMs, () =>
        fail(new Error('ClamAV scan timed out')),
      );
      socket.on('error', fail);
      socket.on('data', (chunk: Buffer) => {
        response += chunk.toString('utf8');
        if (response.length > 4096) {
          fail(new Error('Invalid ClamAV response'));
          return;
        }
        const end = response.indexOf('\0');
        if (end < 0) return;
        const result = response.slice(0, end);
        if (settled) return;
        if (result === 'stream: OK') {
          settled = true;
          socket.destroy();
          resolve('clean');
        } else if (/^stream: .+ FOUND$/.test(result)) {
          settled = true;
          socket.destroy();
          resolve('rejected');
        } else {
          fail(new Error('ClamAV could not scan the file'));
        }
      });
      socket.on('close', () => {
        if (!settled) fail(new Error('ClamAV disconnected during scan'));
      });
      socket.connect(this.config.port, this.config.host, () => {
        socket.write('zINSTREAM\0');
        for (let offset = 0; offset < body.byteLength; offset += 65536) {
          const chunk = body.subarray(offset, offset + 65536);
          const length = Buffer.alloc(4);
          length.writeUInt32BE(chunk.byteLength);
          socket.write(length);
          socket.write(chunk);
        }
        socket.write(Buffer.alloc(4));
      });
    });
  }
}
