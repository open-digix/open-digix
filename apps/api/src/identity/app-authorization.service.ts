import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  APP_AUTHORIZATION_REPOSITORY,
  type AppAuthorizationInput,
  type AppAuthorizationDataSource,
  type AppAuthorizationResult,
} from './app-authorization.types';

function appNotFound(): NotFoundException {
  return new NotFoundException({
    error: {
      code: 'APP_NOT_FOUND',
      message: 'The application was not found in the selected tenant.',
    },
  });
}

function appRoleRequired(): ForbiddenException {
  return new ForbiddenException({
    error: {
      code: 'APP_ROLE_REQUIRED',
      message: 'The membership does not have a role in this application.',
    },
  });
}

function appPermissionRequired(permission: string): ForbiddenException {
  return new ForbiddenException({
    error: {
      code: 'APP_PERMISSION_REQUIRED',
      message: `The application role lacks permission '${permission}'.`,
    },
  });
}

@Injectable()
export class AppAuthorizationService {
  constructor(
    @Inject(APP_AUTHORIZATION_REPOSITORY)
    private readonly repository: AppAuthorizationDataSource,
  ) {}

  async requireAppAccess(
    input: AppAuthorizationInput,
  ): Promise<AppAuthorizationResult> {
    const application = await this.requireApplication(
      input.tenantId,
      input.applicationId,
    );

    const membershipAccess = await this.repository.findMembershipAccess(
      input.tenantId,
      input.applicationId,
      input.membershipId,
    );

    if (membershipAccess.roleCodes.length === 0) {
      throw appRoleRequired();
    }

    return {
      tenantId: input.tenantId,
      applicationId: application.id,
      membershipId: input.membershipId,
      applicationStatus: application.status,
      roleCodes: membershipAccess.roleCodes,
      permissions: membershipAccess.permissions,
    };
  }

  async requireApplication(tenantId: string, applicationId: string) {
    const application = await this.repository.findApplication(
      tenantId,
      applicationId,
    );

    if (!application || application.status === 'retired') {
      throw appNotFound();
    }

    return application;
  }

  async requirePermission(
    input: AppAuthorizationInput,
    permission: string,
  ): Promise<AppAuthorizationResult> {
    const access = await this.requireAppAccess(input);

    if (!access.permissions.includes(permission)) {
      throw appPermissionRequired(permission);
    }

    return access;
  }
}
