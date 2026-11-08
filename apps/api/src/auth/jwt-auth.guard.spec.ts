import {
  ExecutionContext,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedIdentity, AuthenticatedRequest } from './auth.types';
import { JwtAuthGuard, extractBearerToken } from './jwt-auth.guard';
import { OidcTokenVerifier } from './oidc-token.verifier';

describe('extractBearerToken', () => {
  it('accepts the Bearer scheme case-insensitively', () => {
    expect(extractBearerToken('bearer header.payload.signature')).toBe(
      'header.payload.signature',
    );
  });

  it.each([undefined, '', 'Basic credentials', 'Bearer', 'Bearer one two'])(
    'rejects a missing or malformed header: %s',
    (authorization) => {
      expect(extractBearerToken(authorization)).toBeUndefined();
    },
  );
});

describe('JwtAuthGuard', () => {
  const identity: AuthenticatedIdentity = {
    issuer: 'http://localhost:8080/realms/digix',
    subject: 'user-subject',
    audience: ['digix-api'],
    issuedAt: 1_700_000_000,
    expiresAt: 1_700_000_300,
  };

  let request: AuthenticatedRequest;
  let reflector: { getAllAndOverride: jest.Mock };
  let verifier: { verify: jest.Mock };
  let guard: JwtAuthGuard;

  class TestController {}

  beforeEach(() => {
    request = { headers: {} } as AuthenticatedRequest;
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    verifier = { verify: jest.fn() };
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      verifier as unknown as OidcTokenVerifier,
    );
  });

  function context(): ExecutionContext {
    return {
      getHandler: () => TestController,
      getClass: () => TestController as Type<unknown>,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  async function rejectedResponse(
    activation: Promise<boolean>,
  ): Promise<unknown> {
    try {
      await activation;
      throw new Error('Guard unexpectedly allowed the request');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      return (error as UnauthorizedException).getResponse();
    }
  }

  it('bypasses authentication only for endpoints marked public', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('rejects a protected endpoint without Authorization', async () => {
    await expect(
      rejectedResponse(guard.canActivate(context())),
    ).resolves.toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'A Bearer access token is required.',
      },
    });
  });

  it('rejects an invalid Bearer token without leaking verifier details', async () => {
    request.headers.authorization = 'Bearer invalid-token';
    verifier.verify.mockRejectedValue(new Error('internal JOSE details'));

    await expect(
      rejectedResponse(guard.canActivate(context())),
    ).resolves.toEqual({
      error: {
        code: 'INVALID_ACCESS_TOKEN',
        message: 'The access token is invalid or expired.',
      },
    });
  });

  it('attaches the verified identity to the request', async () => {
    request.headers.authorization = 'Bearer header.payload.signature';
    verifier.verify.mockResolvedValue(identity);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(verifier.verify).toHaveBeenCalledWith('header.payload.signature');
    expect(request.authenticatedIdentity).toEqual(identity);
  });
});
