/* src/pages/dashboard/index.ts */
import { MeService } from '../api/services/me';
import { hasError, resolveErrorMessage } from '../api/contracts/base';
import { store } from '../core/state';
import { router } from '../core/router';

/**
 * Dashboard Component
 * Manages the UI for listing user's tenants with tenant selection flow
 */
export const DashboardPage = {
  async render(container: HTMLElement) {
    /*
     * Auto-redirect if user already has active tenant
     * Improves UX for already-working users
     */
    if (store.activeTenantId) {
      router.navigate('/workspace');
      return;
    }

    /* Step 1: Show loading state */
    container.innerHTML = `<p class="p-4 text-gray-500">Loading your tenants...</p>`;

    /* Step 2: Call the Service - Get user's tenants from /me/tenants */
    const response = await MeService.listMyTenants();

    /* Step 3: Handle Error */
    if (hasError(response)) {
      container.innerHTML = `
        <div class="p-4 bg-red-100 text-red-700 rounded m-4">
          Error: ${resolveErrorMessage(response.error)}
        </div>
      `;
      return;
    }

    /* Step 4: Handle Success and Render HTML */
    const tenants = response.data?.tenants || [];
    
    if (tenants.length === 0) {
      container.innerHTML = `<p class="p-4">No tenants found. Create one to get started!</p>`;
      return;
    }

    container.innerHTML = `
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 text-gray-800">Your Tenants</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${tenants.map(t => {
            const isActive = t.id === store.activeTenantId;
            const borderColor = isActive ? 'border-indigo-500 border-2 bg-indigo-50' : 'border-gray-200';
            const shadowClass = isActive ? 'shadow-md' : 'hover:shadow-md';
            
            return `
              <div 
                class="border rounded-lg p-4 transition-shadow cursor-pointer bg-white ${borderColor} ${shadowClass}"
                data-tenant-id="${t.id}"
              >
                <div class="font-semibold text-lg">${t.name}</div>
                <div class="mt-4 text-xs text-gray-400">Created: ${new Date(t.created_at).toLocaleDateString()}</div>
                ${isActive ? '<div class="mt-2 text-xs text-indigo-600 font-medium">• Active</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    /*
     * Helper function for tenant selection
     */
    const selectTenant = (tenantId: string) => {
      const selectedTenant = tenants.find(t => t.id === tenantId);
      if (!selectedTenant) return;

      store.setActiveTenant(selectedTenant);
      router.navigate('/workspace');
    };

    /*
     * Step 5: Event delegation for tenant card clicks
     * Single listener scales better than multiple listeners per card
     */
    container.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('[data-tenant-id]');
      if (!card) return;

      const tenantId = card.getAttribute('data-tenant-id');
      if (tenantId) {
        selectTenant(tenantId);
      }
    });
  }
};