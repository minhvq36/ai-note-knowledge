/* src/pages/dashboard/index.ts */
import { TenantService } from '../api/services/tenant';
import { hasError, resolveErrorMessage } from '../api/contracts/base';

/**
 * Dashboard Component
 * Manages the UI for listing tenants
 */
export const DashboardPage = {
  async render(container: HTMLElement) {
    /* Step 1: Show loading state */
    container.innerHTML = `<p class="p-4 text-gray-500">Loading your tenants...</p>`;

    /* Step 2: Call the Service */
    const response = await TenantService.list();

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
    const tenants = response.data || [];
    
    if (tenants.length === 0) {
      container.innerHTML = `<p class="p-4">No tenants found. Create one to get started!</p>`;
      return;
    }

    container.innerHTML = `
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 text-gray-800">Your Tenants</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${tenants.map(t => `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
              <div class="font-semibold text-lg">${t.name}</div>
              <div class="mt-4 text-xs text-gray-400">Created: ${new Date(t.created_at).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};