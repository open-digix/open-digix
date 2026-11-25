export interface AppAuthorizationApplication {
  readonly id: string;
  readonly status: string;
}

export interface AppAuthorizationMembership {
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
}

export interface AppAuthorizationDataSource {
  findApplication(
    tenantId: string,
    applicationId: string,
  ): Promise<AppAuthorizationApplication | null>;
  findMembershipAccess(
    tenantId: string,
    applicationId: string,
    membershipId: string,
  ): Promise<AppAuthorizationMembership>;
}

export interface AppAuthorizationInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly membershipId: string;
}

export interface AppAuthorizationResult {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly membershipId: string;
  readonly applicationStatus: string;
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
}

export const APP_AUTHORIZATION_REPOSITORY = Symbol(
  'APP_AUTHORIZATION_REPOSITORY',
);
