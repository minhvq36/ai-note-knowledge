/* src/pages/dashboard/index.ts */
import { MeService } from '../api/services/me';
import { hasError, resolveErrorMessage } from '../api/contracts/base';
import { store } from '../core/state';
import { router } from '../core/router';
import { AuthService } from '../api/services/auth';

/**
 * Dashboard Component
 * v0-inspired layout with vanilla logic
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

    /*
     * Step 1: Show loading state
     */
    container.innerHTML = `
      <div class="dashboard-shell dashboard-shell--center">
        <p class="dashboard-muted-text">Loading workspaces...</p>
      </div>
    `;

    /*
     * Step 2: Fetch tenants
     */
    const response = await MeService.listMyTenants();

    /*
     * Step 3: Handle error
     */
    if (hasError(response)) {
      container.innerHTML = `
        <div class="dashboard-shell dashboard-shell--center dashboard-shell--padded">
          <div class="dashboard-error-card">
            <h2>Error</h2>
            <p>${resolveErrorMessage(response.error)}</p>
          </div>
        </div>
      `;
      return;
    }

    const tenants = response.data?.tenants || [];

    /*
     * Step 4: Render dashboard
     */
    container.innerHTML = `
      <div class="dashboard-shell">
        <header class="dashboard-header">
          <div class="dashboard-header__inner">
            <div class="dashboard-brand">
              <div class="dashboard-brand__logo">A</div>
              <span>NoteStack</span>
            </div>
            <button id="logoutBtn" type="button" class="dashboard-ghost-btn">Sign out</button>
          </div>
        </header>

        <main class="dashboard-main">
          <section class="dashboard-topbar">
            <div>
              <h1>Workspaces</h1>
              <p class="dashboard-muted-text">Select a workspace or create a new one to get started.</p>
            </div>
            <button id="createBtn" type="button" class="dashboard-primary-btn">
              <span>+</span>
              <span>New workspace</span>
            </button>
          </section>

          ${
            tenants.length === 0
              ? `
                <section class="dashboard-empty">
                  <p class="dashboard-muted-text">No workspaces yet.</p>
                  <button id="createBtn2" type="button" class="dashboard-primary-btn">Create Your First Workspace</button>
                </section>
              `
              : `
                <section class="dashboard-grid">
                  ${tenants
                    .map(
                      (t) => `
                        <article class="dashboard-tenant-card" data-tenant-id="${t.id}">
                          <div class="dashboard-tenant-card__header">
                            <div class="dashboard-tenant-card__avatar">${t.name.charAt(0).toUpperCase()}</div>
                            <div class="dashboard-tenant-card__meta">
                              <h3>${t.name}</h3>
                              <p>${t.id}</p>
                            </div>
                          </div>
                          <div class="dashboard-tenant-card__footer">
                            <span>
                              Created ${new Date(t.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>→</span>
                          </div>
                        </article>
                      `
                    )
                    .join('')}
                </section>
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
