import type { Request } from 'express';

export interface AuthenticatedIdentity {
  issuer: string;
  subject: string;
  audience: string[];
  issuedAt: number;
  expiresAt: number;
  tokenId?: string;
  username?: string;
  email?: string;
  displayName?: string;
}

export interface AuthenticatedRequest extends Request {
  authenticatedIdentity?: AuthenticatedIdentity;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<AuthenticatedIdentity>;
}
