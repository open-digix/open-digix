import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { StoredFileRepository } from './stored-file.repository';
import { StorageObjectService } from './storage-object.service';

export interface FileAccessContext {
  tenantId: string;
  membershipId: string;
}

// B02 policy is deliberately limited to requesters of existing records.
// B03a must supply the app-scoped authorizer before expanding access.
@Injectable()
export class FileAccess {
  private readonly key: string;
  private readonly ttlSeconds = 60;

  constructor(
    private readonly repository: StoredFileRepository,
    private readonly objects: StorageObjectService,
  ) {
    const key = process.env.FILE_URL_SIGNING_KEY;
    if (!key || key.length < 32)
      throw new Error(
        'FILE_URL_SIGNING_KEY must contain at least 32 characters',
      );
    this.key = key;
  }

  private signature(
    fileId: string,
    context: FileAccessContext,
    expires: number,
  ): string {
    return createHmac('sha256', this.key)
      .update(
        `${context.tenantId}:${context.membershipId}:${fileId}:${expires}`,
      )
      .digest('hex');
  }

  private async readable(fileId: string, context: FileAccessContext) {
    const file = await this.repository.findReadable(
      context.tenantId,
      fileId,
      context.membershipId,
    );
    if (!file)
      throw new NotFoundException({
        error: { code: 'FILE_NOT_FOUND', message: 'File not found.' },
      });
    return file;
  }

  async getDownloadUrl(
    fileId: string,
    context: FileAccessContext,
  ): Promise<{ url: string; expiresAt: string }> {
    await this.readable(fileId, context);
    const expires = Math.floor(Date.now() / 1000) + this.ttlSeconds;
    return {
      url: `/v1/files/${encodeURIComponent(fileId)}/content?expires=${expires}&signature=${this.signature(fileId, context, expires)}`,
      expiresAt: new Date(expires * 1000).toISOString(),
    };
  }

  async download(
    fileId: string,
    context: FileAccessContext,
    expiresRaw: string,
    signature: string,
  ) {
    const expires = Number(expiresRaw);
    if (
      !/^\d+$/.test(expiresRaw ?? '') ||
      !Number.isSafeInteger(expires) ||
      expires <= Math.floor(Date.now() / 1000) ||
      expires > Math.floor(Date.now() / 1000) + this.ttlSeconds ||
      !/^[a-f0-9]{64}$/.test(signature ?? '')
    ) {
      throw new NotFoundException();
    }
    const expected = this.signature(fileId, context, expires);
    if (
      !timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      )
    ) {
      throw new NotFoundException();
    }
    const file = await this.readable(fileId, context);
    const object = await this.objects.getObject(file.storageKey);
    return { file, object };
  }
}
