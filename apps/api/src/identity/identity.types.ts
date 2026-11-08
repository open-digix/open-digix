export type IdentityUserStatus = 'active' | 'disabled';
export type TenantStatus = 'active' | 'suspended' | 'archived';
export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';

export interface MeUser {
  id: string;
  subject: string;
  email: string | null;
  displayName: string | null;
  status: IdentityUserStatus;
}

export interface MeTenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
}

export interface MeMembership {
  id: string;
  status: MembershipStatus;
  tenant: MeTenant;
  roles: string[];
}

export interface MeResponse {
  user: MeUser;
  memberships: MeMembership[];
  activeMembership: MeMembership | null;
}
