import { BadRequestException, Injectable } from '@nestjs/common';
import { METADATA_ALLOWLIST } from './constants/audit-policy.constants';
import {
  AuditRepository,
  type AuditEntry,
  type AuditWriter,
  type NewAuditEntry,
} from './audit.repository';

export interface RecordAuditInput extends Omit<
  NewAuditEntry,
  'metadata' | 'resourceId' | 'actorMembershipId'
> {
  actorMembershipId?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

function safeMetadata(
  action: string,
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = METADATA_ALLOWLIST[action] ?? METADATA_ALLOWLIST.default;
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = metadata[key];
    if (typeof value === 'string') {
      // Never store raw request bodies, credentials, query strings or unbounded values.
      const cleaned = key === 'path' ? value.split('?')[0] : value;
      if (
        cleaned.length <= 160 &&
        !/bearer\s|token|secret|password|cookie|authorization|[\r\n]/i.test(
          cleaned,
        )
      ) {
        result[key] = cleaned;
      }
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
    } else if (typeof value === 'boolean') {
      result[key] = value;
    } else if (
      key === 'changedKeys' &&
      Array.isArray(value) &&
      value.length <= 20 &&
      value.every(
        (item) =>
          typeof item === 'string' && /^[a-zA-Z][\w.-]{0,63}$/.test(item),
      )
    ) {
      result[key] = value;
    }
  }
  return result;
}

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async record(
    input: RecordAuditInput,
    writer?: AuditWriter,
  ): Promise<AuditEntry> {
    if (!input.tenantId || !input.action || !input.resourceType) {
      throw new BadRequestException(
        'Audit tenant, action and resource type are required',
      );
    }
    return this.repository.insert(
      {
        tenantId: input.tenantId,
        actorMembershipId: input.actorMembershipId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        result: input.result,
        metadata: safeMetadata(input.action, input.metadata ?? {}),
      },
      writer,
    );
  }

  findById(tenantId: string, id: string): Promise<AuditEntry | null> {
    return this.repository.findById(tenantId, id);
  }

  // Callers must authorize access to this resource before exposing its history.
  findByResource(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<AuditEntry[]> {
    if (!tenantId || !resourceType || !resourceId) {
      throw new BadRequestException('Audit resource scope is required');
    }
    return this.repository.findByResource(tenantId, resourceType, resourceId);
  }
}
