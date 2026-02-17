/* src/api/services/tenant.ts */
import { api } from '../client';
/* Import type only to satisfy verbatimModuleSyntax */
import type { ApiResponse } from '../contracts/base';
import type { ListTenantsResponse } from '../contracts/tenant';

export const TenantService = {
  /**
   * Fetch all tenants for the current user
   */
  list: async (): Promise<ApiResponse<ListTenantsResponse>> => {
    return await api.get<ListTenantsResponse>('/tenants');
  }
};