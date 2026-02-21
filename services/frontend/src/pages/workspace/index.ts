/*
 * Workspace Page
 * Main workspace interface for managing notes within a tenant
 */

import { store } from '../../core/state';
import { router } from '../../core/router';

export const WorkspacePage = {
  async render(container: HTMLElement) {
    const tenant = store.activeTenant;

    container.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Workspace</h1>
            <p class="mt-2 text-gray-600">
              Current tenant: <span class="font-semibold text-indigo-600">${tenant?.name ?? 'Unknown'}</span>
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
            Workspace for tenant: <span class="font-mono">${tenant?.id ?? 'N/A'}</span>
          </p>
        </div>
      </div>
    `;

    /*
     * Back button handler
     */
    const backBtn = container.querySelector<HTMLButtonElement>('#backBtn');
    backBtn?.addEventListener('click', () => {
      router.navigate('/dashboard');
    });
  }
};
