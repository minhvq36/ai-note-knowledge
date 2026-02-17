/* src/api/services/me.ts */
import { api } from '../client';
/* Import type only to satisfy verbatimModuleSyntax */
import type { ApiResponse } from '../contracts/base';
import type { ListTenantsResponse } from '../contracts/tenant';

export const MeService = {
  /**
   * List all tenants the authenticated user is a member of.
   * 
   * Endpoint: GET /me/tenants
   * 
   * Returns tenants where user has membership (owner, admin, or member role).
   * RLS enforces access control - user only sees their own tenants.
   * 
   * Use this for:
   * - Dashboard display of user's tenants
   * - Tenant selector/picker
   * - User's workspace switcher
   */
  listMyTenants: async (): Promise<ApiResponse<ListTenantsResponse>> => {
    return await api.get<ListTenantsResponse>('/me/tenants');
  }
};
