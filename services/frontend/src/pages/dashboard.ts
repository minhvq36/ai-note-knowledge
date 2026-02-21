/* src/pages/dashboard/index.ts */
import { MeService } from '../api/services/me';
import { hasError, resolveErrorMessage } from '../api/contracts/base';
import { store } from '../core/state';
import { router } from '../core/router';
import { AuthService } from '../api/services/auth';

/**
 * Dashboard Component
 * Merged v0 UI (beautiful grid layout) + Vanilla logic
 */
export const DashboardPage = {
  async render(container: HTMLElement) {
    /*
     * Auto-redirect if user already has active tenant
     */
    if (store.activeTenantId) {
      router.navigate('/workspace');
      return;
    }

    /* Step 1: Show loading state */
    container.innerHTML = `<div class="flex-center min-h-screen"><p class="text-muted-foreground">Loading workspaces...</p></div>`;

    /* Step 2: Fetch tenants */
    const response = await MeService.listMyTenants();

    /* Step 3: Handle error */
    if (hasError(response)) {
      container.innerHTML = `
        <div class="min-h-screen flex-center px-4">
          <div class="rounded-lg border border-border bg-card shadow-lg p-6 max-w-md">
            <h2 class="text-lg font-semibold text-foreground mb-2">Error</h2>
            <p class="text-sm text-muted-foreground">${resolveErrorMessage(response.error)}</p>
          </div>
        </div>
      `;
      return;
    }

    const tenants = response.data?.tenants || [];

    /* Step 4: Render dashboard */
    container.innerHTML = `
      <div class="min-h-screen bg-background">
        <!-- Header -->
        <header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <span class="text-sm font-bold text-accent-foreground">A</span>
              </div>
              <span class="font-semibold text-foreground">NoteStack</span>
            </div>
            <button
              id="logoutBtn"
              class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="mx-auto max-w-5xl px-6 py-10">
          <!-- Heading -->
          <div class="mb-8 flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-foreground">
                Workspaces
              </h1>
              <p class="mt-2 text-sm text-muted-foreground">
                Select a workspace or create a new one to get started
              </p>
            </div>
            <button
              id="createBtn"
              class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <span>+</span>
              <span>New workspace</span>
            </button>
          </div>

          <!-- Tenants Grid -->
          ${
            tenants.length === 0
              ? `
            <div class="flex-center py-20">
              <div class="text-center max-w-md">
                <p class="text-muted-foreground mb-4">No workspaces yet</p>
                <button id="createBtn2" class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium bg-foreground text-background hover:bg-foreground/90">
                  Create Your First Workspace
                </button>
              </div>
            </div>
          `
              : `
            <div class="grid grid-responsive">
              ${tenants
                .map(
                  (t) => `
                <div 
                  class="group cursor-pointer rounded-lg border border-border bg-card hover:border-accent/50 hover:shadow-md transition-all p-6"
                  data-tenant-id="${t.id}"
                >
                  <!-- Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                        ${t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 class="font-semibold text-foreground group-hover:text-accent transition-colors">
                          ${t.name}
                        </h3>
                        <p class="text-xs text-muted-foreground">${t.id}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Meta Info -->
                  <div class="flex items-center justify-between pt-4 border-t border-border/50">
                    <span class="text-xs text-muted-foreground">
                      Created ${new Date(t.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span class="text-accent group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
          }
        </main>
      </div>
    `;

    /*
     * Event delegation for tenant selection
     */
    const selectTenant = (tenantId: string) => {
      const selectedTenant = tenants.find((t) => t.id === tenantId);
      if (!selectedTenant) return;

      store.setActiveTenant(selectedTenant);
      router.navigate('/workspace');
    };

    container.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('[data-tenant-id]');
      if (!card) return;

      const tenantId = card.getAttribute('data-tenant-id');
      if (tenantId) {
        selectTenant(tenantId);
      }
    });

    /*
     * Logout button
     */
    container.querySelector('#logoutBtn')?.addEventListener('click', async () => {
      await AuthService.logout();
      store.clear();
      router.navigate('/login');
    });
  },
};