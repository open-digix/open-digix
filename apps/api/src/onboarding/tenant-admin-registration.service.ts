import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateKeycloakUserInput,
  KeycloakAdminClient,
} from '../auth/keycloak-admin.client';
import type {
  CreatedTenantAdmin,
  CreateTenantAdminInput,
  TenantAdminRepository,
} from './tenant-admin.repository';
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
    const keycloakSubject = await this.keycloak.createUser(keycloakInput);

    try {
      const created = await this.repository.createTenantAdmin(
        toRepositoryInput(input, this.identityIssuer, keycloakSubject),
      );
      return { keycloakSubject, ...created };
    } catch (error) {
      await this.cleanupKeycloakUser(keycloakSubject, error);
      throw error;
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
    displayName: `${input.admin.firstName} ${input.admin.lastName}`,
    password: input.admin.password,
  };
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
