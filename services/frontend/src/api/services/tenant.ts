/* src/api/services/tenant.ts */
import { api } from '../client';
/* Import type only to satisfy verbatimModuleSyntax */
import type { ApiResponse } from '../contracts/base';
import type { ListTenantsResponse, TenantDetailsResponse, CreateTenantRequest } from '../contracts/tenant';

interface CreateTenantResponse {
  tenant_id: string;
}

export const TenantService = {
  list: async (): Promise<ApiResponse<ListTenantsResponse>> => {
    return await api.get<ListTenantsResponse>('/tenants');
  },

  /*
   * Fetch single tenant details by ID
   * Used for refreshing workspace when tenant is not cached in store
   */
  getTenant: async (tenantId: string): Promise<ApiResponse<TenantDetailsResponse>> => {
    return await api.get<TenantDetailsResponse>(`/tenants/${tenantId}`);
  },

  /*
   * Create new tenant
   * Caller becomes owner automatically
   */
  create: async (payload: CreateTenantRequest): Promise<ApiResponse<CreateTenantResponse>> => {
    return await api.post<CreateTenantResponse>('/tenants', payload);
  },
};