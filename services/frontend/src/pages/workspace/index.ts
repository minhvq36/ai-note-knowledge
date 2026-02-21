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
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header Section -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex-1">
            <h1 class="text-5xl font-bold mb-3">
              <span class="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">${tenant.name}</span>
            </h1>
            <p class="text-slate-400 text-lg">Workspace • ${new Date(tenant.created_at).toLocaleDateString()}</p>
          </div>
          <button 
            id="backBtn"
            class="ml-4 px-6 py-3 backdrop-blur-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 text-slate-200 hover:text-indigo-300 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 mb-8"></div>

        <!-- Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Workspace Info Card -->
          <div class="lg:col-span-2 backdrop-blur-xl rounded-xl p-8 border border-slate-700/50 bg-slate-800/30 hover:border-indigo-500/30 transition-all duration-300">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-3 h-3 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full"></div>
              <h2 class="text-2xl font-bold text-slate-100">Workspace Details</h2>
            </div>
            
            <div class="space-y-4">
              <div class="flex justify-between items-center py-4 border-b border-slate-700/30">
                <span class="text-slate-400">Workspace ID</span>
                <code class="px-4 py-2 bg-slate-900/50 rounded text-indigo-300 font-mono text-sm">${tenant.id}</code>
              </div>
              
              <div class="flex justify-between items-center py-4 border-b border-slate-700/30">
                <span class="text-slate-400">Created</span>
                <span class="text-slate-200 font-medium">${new Date(tenant.created_at).toLocaleString()}</span>
              </div>

              <div class="flex justify-between items-center py-4">
                <span class="text-slate-400">Status</span>
                <span class="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-medium">● Active</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="backdrop-blur-xl rounded-xl p-8 border border-slate-700/50 bg-slate-800/30 h-fit">
            <h3 class="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <span class="w-2 h-2 bg-cyan-400 rounded-full"></span>
              Quick Actions
            </h3>
            
            <div class="space-y-3">
              <button class="w-full px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95">
                + Create Note
              </button>
              <button class="w-full px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95">
                👥 Members
              </button>
              <button class="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>

        <!-- Introduction Section -->
        <div class="backdrop-blur-xl rounded-xl p-8 border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-cyan-900/20">
          <h3 class="text-2xl font-bold text-slate-100 mb-4">Welcome to Your Workspace</h3>
          <p class="text-slate-400 leading-relaxed mb-4">
            You're now in the <span class="font-semibold text-indigo-300">${tenant.name}</span> workspace. Here you can:
          </p>
          <ul class="space-y-2 text-slate-400">
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 bg-indigo-400 rounded-full"></span>
              <span>Create and manage notes collaboratively</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 bg-cyan-400 rounded-full"></span>
              <span>Share notes with team members</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 bg-indigo-400 rounded-full"></span>
              <span>Organize by workspaces and teams</span>
            </li>
          </ul>
        </div>
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
