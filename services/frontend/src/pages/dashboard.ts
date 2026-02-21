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
    // if (store.activeTenantId) {
    //   router.navigate('/workspace');
    //   return;
    // }

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
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <div class="mb-12">
            <h1 class="text-4xl md:text-5xl font-bold mb-3">
              <span class="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Your Workspaces</span>
            </h1>
            <p class="text-slate-400 text-lg">Select a workspace to get started or create a new one</p>
          </div>

          <!-- Tenants Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${tenants.map(t => {
              const isActive = t.id === store.activeTenantId;
              const borderColor = isActive ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600/50';
              const bgColor = isActive ? 'bg-indigo-900/20' : 'bg-slate-800/30';
              
              return `
                <div 
                  class="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  data-tenant-id="${t.id}"
                >
                  <div class="backdrop-blur-xl rounded-xl p-6 border ${borderColor} ${bgColor} h-full hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <!-- Background gradient on hover -->
                    <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-cyan-600/0 group-hover:from-indigo-600/10 group-hover:to-cyan-600/10 transition-all duration-300"></div>
                    
                    <!-- Content -->
                    <div class="relative z-10">
                      <div class="flex items-start justify-between mb-4">
                        <div>
                          <h3 class="text-xl font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">${t.name}</h3>
                        </div>
                        ${isActive ? '<div class="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-xs font-semibold text-indigo-300">● Active</div>' : ''}
                      </div>
                      
                      <div class="space-y-3">
                        <div class="flex items-center gap-2 text-sm text-slate-400">
                          <span class="w-1 h-1 rounded-full bg-cyan-400"></span>
                          <span>Created ${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <!-- Arrow Indicator -->
                      <div class="mt-4 inline-block px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg group-hover:bg-indigo-500/20 transition-all duration-300">
                        <span class="text-sm font-medium text-indigo-300 group-hover:translate-x-1 inline-block transition-transform">Open →</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Empty State -->
          ${tenants.length === 0 ? `
            <div class="mt-12 text-center">
              <div class="inline-block p-12 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <p class="text-slate-400 text-lg mb-4">No workspaces yet</p>
                <button class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105">
                  Create Your First Workspace
                </button>
              </div>
            </div>
          ` : ''}
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