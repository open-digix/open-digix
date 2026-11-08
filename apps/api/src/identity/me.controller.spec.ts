import { UnauthorizedException } from '@nestjs/common';
import type {
  AuthenticatedIdentity,
  AuthenticatedRequest,
} from '../auth/auth.types';
import { IdentityContextService } from './identity-context.service';
import { MeController } from './me.controller';

describe('MeController', () => {
  const identity: AuthenticatedIdentity = {
    issuer: 'http://localhost:8080/realms/digix',
    subject: 'keycloak-subject',
    audience: ['digix-api'],
    issuedAt: 1_700_000_000,
    expiresAt: 1_700_000_300,
  };
  let identityContext: { getMe: jest.Mock };
  let controller: MeController;

  beforeEach(() => {
    identityContext = { getMe: jest.fn() };
    controller = new MeController(
      identityContext as unknown as IdentityContextService,
    );
  });

  it('passes the verified identity and selected tenant to the service', async () => {
    const request = { authenticatedIdentity: identity } as AuthenticatedRequest;
    identityContext.getMe.mockResolvedValue({});

    await controller.getMe(request, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(identityContext.getMe).toHaveBeenCalledWith(
      identity,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  it('fails closed if the guard did not attach an identity', () => {
    const request = {} as AuthenticatedRequest;

    expect(() => controller.getMe(request)).toThrow(UnauthorizedException);
    expect(identityContext.getMe).not.toHaveBeenCalled();
  });
});
