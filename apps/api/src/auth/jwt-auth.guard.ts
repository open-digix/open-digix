import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AccessTokenVerifier, AuthenticatedRequest } from './auth.types';
import { OidcTokenVerifier } from './oidc-token.verifier';
import { IS_PUBLIC_ENDPOINT } from './public.decorator';

function authenticationRequired(): UnauthorizedException {
  return new UnauthorizedException({
    error: {
      code: 'AUTHENTICATION_REQUIRED',
      message: 'A Bearer access token is required.',
    },
  });
}

function invalidAccessToken(): UnauthorizedException {
  return new UnauthorizedException({
    error: {
      code: 'INVALID_ACCESS_TOKEN',
      message: 'The access token is invalid or expired.',
    },
  });
}

export function extractBearerToken(
  authorization: string | undefined,
): string | undefined {
  if (!authorization) {
    return undefined;
  }

  const parts = authorization.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return undefined;
  }

  return parts[1];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly verifier: AccessTokenVerifier;

  constructor(
    private readonly reflector: Reflector,
    verifier: OidcTokenVerifier,
  ) {
    this.verifier = verifier;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ENDPOINT,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw authenticationRequired();
    }

    const token = extractBearerToken(authorization);
    if (!token) {
      throw invalidAccessToken();
    }

    try {
      request.authenticatedIdentity = await this.verifier.verify(token);
      return true;
    } catch {
      throw invalidAccessToken();
    }
  }
}
