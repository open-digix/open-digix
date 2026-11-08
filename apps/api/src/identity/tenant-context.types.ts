import type { AuthenticatedRequest } from '../auth/auth.types';
import type { TenantContext } from './identity.types';

export interface TenantContextRequest extends AuthenticatedRequest {
  tenantContext?: TenantContext;
}
