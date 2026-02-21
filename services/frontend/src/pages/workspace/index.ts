/*
 * Workspace Page
 * Main workspace interface for managing notes within a tenant
 */

import { store } from '../../core/state';
import { router } from '../../core/router';
import { TenantService } from '../../api/services/tenant';
import { hasError, resolveErrorMessage } from '../../api/contracts/base';
import type { Tenant } from '../../api/contracts/tenant';

/*
 * UI Render Helper
 * Separates rendering logic from page logic
 */
function renderWorkspaceUI(tenant: Tenant): string {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Workspace</h1>
          <p class="mt-2 text-gray-600">
            Current tenant: <span class="font-semibold text-indigo-600">${tenant.name}</span>
          </p>
        </div>
        <button 
          id="backBtn"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-700">
          Workspace for tenant: <span class="font-mono">${tenant.id}</span>
        </p>
        <p class="text-xs text-blue-600 mt-2">
          Created: ${new Date(tenant.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  `;
}

export const WorkspacePage = {
  async render(container: HTMLElement) {
    /*
     * Guard: ensure tenant ID is selected
     * Router guard checks this, but double-check for safety
     */
    if (!store.activeTenantId) {
      router.navigate('/dashboard');
      return;
    }

    /*
     * Check if tenant is cached in store
     * If not (e.g., page refresh), load from API
     */
    let tenant = store.activeTenant;

    if (!tenant) {
      container.innerHTML = `<p class="p-4 text-gray-500">Loading workspace...</p>`;

      const response = await TenantService.getTenant(store.activeTenantId);

      if (hasError(response)) {
        container.innerHTML = `
          <div class="p-4 bg-red-100 text-red-700 rounded m-4">
            Error: ${resolveErrorMessage(response.error)}
          </div>
        `;
        return;
      }

      tenant = response.data;

      if (!tenant) {
        router.navigate('/dashboard');
        return;
      }

      /*
       * Hydrate store with fetched tenant
       */
      store.setActiveTenant(tenant);
    }

    /*
     * Render workspace UI
     */
    container.innerHTML = renderWorkspaceUI(tenant);

    /*
     * Back button handler
     */
    container
      .querySelector<HTMLButtonElement>('#backBtn')
      ?.addEventListener('click', () => {
        store.setActiveTenant(null);
        router.navigate('/dashboard');
      });
  }
};
