import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedIdentity } from '../auth/auth.types';
import {
  IdentityContextRepository,
  type ResolvedIdentityContext,
} from './identity-context.repository';
import type { MeMembership, MeResponse, TenantContext } from './identity.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function forbidden(code: string, message: string): ForbiddenException {
  return new ForbiddenException({ error: { code, message } });
}

@Injectable()
export class IdentityContextService {
  constructor(private readonly repository: IdentityContextRepository) {}

  async getMe(
    identity: AuthenticatedIdentity,
    requestedTenantId?: string,
  ): Promise<MeResponse> {
    const tenantId = this.validateTenantId(requestedTenantId);
    const context = await this.resolveIdentity(identity);

    const activeMembership = tenantId
      ? this.selectActiveMembership(context.memberships, tenantId)
      : null;

    return {
      ...context,
      activeMembership,
    };
  }

  async resolveRequiredTenant(
    identity: AuthenticatedIdentity,
    requestedTenantId?: string,
  ): Promise<TenantContext> {
    const tenantId = this.requireTenantId(requestedTenantId);
    const context = await this.resolveIdentity(identity);

    return {
      user: context.user,
      membership: this.selectActiveMembership(context.memberships, tenantId),
    };
  }

  private async resolveIdentity(
    identity: AuthenticatedIdentity,
  ): Promise<ResolvedIdentityContext> {
    const context = await this.repository.findByExternalIdentity(
      identity.issuer,
      identity.subject,
    );

    if (!context) {
      throw forbidden(
        'USER_NOT_PROVISIONED',
        'The authenticated identity is not provisioned in DigiX.',
      );
    }

    if (context.user.status !== 'active') {
      throw forbidden('ACCOUNT_DISABLED', 'The DigiX account is disabled.');
    }

    return context;
  }

  private validateTenantId(tenantId?: string): string | undefined {
    const normalized = tenantId?.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (!UUID_PATTERN.test(normalized)) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_TENANT_ID',
          message: 'X-Tenant-Id must be a valid UUID.',
        },
      });
    }

    return normalized;
  }

  private requireTenantId(tenantId?: string): string {
    const normalized = this.validateTenantId(tenantId);
    if (!normalized) {
      throw new BadRequestException({
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'X-Tenant-Id is required for this endpoint.',
        },
      });
    }

    return normalized;
  }

  private selectActiveMembership(
    memberships: MeMembership[],
    tenantId: string,
  ): MeMembership {
    const membership = memberships.find(
      (candidate) => candidate.tenant.id === tenantId,
    );

    if (
      !membership ||
      membership.status !== 'active' ||
      membership.tenant.status !== 'active'
    ) {
      throw forbidden(
        'TENANT_ACCESS_DENIED',
        'The user does not have an active membership in the selected tenant.',
      );
    }

    return membership;
  }
}
