import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  CreateKeycloakUserInput,
  KeycloakAdminClient,
} from '../auth/keycloak-admin.client';
import { KeycloakUserConflictError } from '../auth/keycloak-admin.client';
import { KeycloakAdminUnavailableError } from '../auth/keycloak-admin.client';
import type {
  CreatedTenantAdmin,
  CreateTenantAdminInput,
  TenantAdminRepository,
} from './tenant-admin.repository';
import { TenantSlugConflictError } from './tenant-admin.repository';
import { DatabaseUnavailableError } from './tenant-admin.repository';
import type { TenantAdminRegistrationBody } from './tenant-admin-registration.input';

export const KEYCLOAK_ADMIN_CLIENT = Symbol('KEYCLOAK_ADMIN_CLIENT');
export const TENANT_ADMIN_REPOSITORY = Symbol('TENANT_ADMIN_REPOSITORY');
export const TENANT_ADMIN_IDENTITY_ISSUER = Symbol(
  'TENANT_ADMIN_IDENTITY_ISSUER',
);

type KeycloakAdminProvisioner = Pick<
  KeycloakAdminClient,
  'createUser' | 'deleteUser'
>;
type TenantAdminPersistence = Pick<TenantAdminRepository, 'createTenantAdmin'>;

export interface TenantAdminRegistrationResult extends CreatedTenantAdmin {
  readonly keycloakSubject: string;
  readonly tenantSlug: string;
  readonly username: string;
}

@Injectable()
export class TenantAdminRegistrationService {
  constructor(
    @Inject(KEYCLOAK_ADMIN_CLIENT)
    private readonly keycloak: KeycloakAdminProvisioner,
    @Inject(TENANT_ADMIN_REPOSITORY)
    private readonly repository: TenantAdminPersistence,
    @Inject(TENANT_ADMIN_IDENTITY_ISSUER)
    private readonly identityIssuer: string,
  ) {}

  async register(
    input: TenantAdminRegistrationBody,
  ): Promise<TenantAdminRegistrationResult> {
    const keycloakInput = toKeycloakUserInput(input);
    let keycloakSubject: string;
    try {
      keycloakSubject = await this.keycloak.createUser(keycloakInput);
    } catch (error) {
      throw mapKeycloakRegistrationError(error);
    }

    try {
      const created = await this.repository.createTenantAdmin(
        toRepositoryInput(input, this.identityIssuer, keycloakSubject),
      );
      return {
        keycloakSubject,
        tenantSlug: input.tenantSlug,
        username: input.admin.username,
        ...created,
      };
    } catch (error) {
      await this.cleanupKeycloakUser(keycloakSubject, error);
      throw mapPersistenceRegistrationError(error);
    }
  }

  private async cleanupKeycloakUser(
    subject: string,
    registrationError: unknown,
  ): Promise<void> {
    try {
      await this.keycloak.deleteUser(subject);
    } catch (cleanupError) {
      const registrationMessage = errorMessage(registrationError);
      const cleanupMessage = errorMessage(cleanupError);
      throw new Error(
        `Tenant admin registration failed (${registrationMessage}) and Keycloak cleanup also failed (${cleanupMessage}).`,
      );
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

function toKeycloakUserInput(
  input: TenantAdminRegistrationBody,
): CreateKeycloakUserInput {
  return {
    username: input.admin.username,
    email: input.admin.email,
    firstName: input.admin.firstName,
    lastName: input.admin.lastName,
    password: input.admin.password,
  };
}

function mapKeycloakRegistrationError(error: unknown): unknown {
  if (error instanceof KeycloakAdminUnavailableError) {
    return unavailableError();
  }
  if (!(error instanceof KeycloakUserConflictError)) return error;

  const code = `${error.field.toUpperCase()}_TAKEN`;
  const label = error.field === 'email' ? 'Email' : 'Username';
  return new ConflictException({
    error: {
      code,
      message: `${label} is already taken.`,
    },
  });
}

function mapPersistenceRegistrationError(error: unknown): unknown {
  if (error instanceof DatabaseUnavailableError) {
    return unavailableError();
  }
  if (!(error instanceof TenantSlugConflictError)) return error;

  return new ConflictException({
    error: {
      code: 'TENANT_SLUG_TAKEN',
      message: 'Tenant slug is already taken.',
    },
  });
}

function unavailableError(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    error: {
      code: 'UNAVAILABLE',
      message: 'Registration service is temporarily unavailable.',
    },
  });
}

function toRepositoryInput(
  input: TenantAdminRegistrationBody,
  identityIssuer: string,
  identitySubject: string,
): CreateTenantAdminInput {
  return {
    tenantSlug: input.tenantSlug,
    tenantName: input.tenantName,
    identityIssuer,
    identitySubject,
    email: input.admin.email,
    displayName: `${input.admin.firstName} ${input.admin.lastName}`,
  };
}
