/**
 * Tenant Role Levels
 * Strictly matches the database enum: owner, admin, member
 */
export type TenantRole = 'owner' | 'admin' | 'member';

/**
 * Main Tenant Entity
 * Mirrors 'tenants' table and Backend response models
 */
export interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly created_at: string;
}

/**
 * Tenant Membership Entity
 * Mirrors 'tenant_members' table join with 'users'
 */
export interface TenantMember {
  readonly user_id: string;
  readonly email: string;
  readonly role: TenantRole;
  readonly created_at: string;
}

/**
 * Request payload for creating a new tenant
 * POST /tenants
 */
export interface CreateTenantRequest {
  name: string;
}

/**
 * Response when listing all tenants user belongs to
 */
export interface ListTenantsResponse {
  readonly tenants: Tenant[];
  readonly total: number;
}

/**
 * Payload for changing a member's role
 */
export interface ChangeMemberRoleRequest {
  role: TenantRole;
}