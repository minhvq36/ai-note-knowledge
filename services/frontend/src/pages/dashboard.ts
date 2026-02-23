/*
 * Dashboard Page
 * Workspace list with create dialog and tenant management
 */
import { MeService } from '../api/services/me';
import { TenantService } from '../api/services/tenant';
import { hasError, resolveErrorMessage } from '../api/contracts/base';
import { store } from '../core/state';
import { router, ROUTES } from '../core/router';
import { AuthService } from '../api/services/auth';
import { createHeader } from '../components/layout/header';
import { createTenantCard } from '../components/tenant/tenantCard';
import { CreateTenantDialog } from '../components/tenant/createTenantDialog';
import { Button } from '../components/ui/button';

export const DashboardPage = {
  async render(container: HTMLElement) {
    /*
     * Loading state
     */
    container.innerHTML = '';
    container.className = 'page-dashboard';
    const loading = document.createElement('div');
    loading.className = 'dashboard-shell dashboard-shell--center';
    loading.innerHTML = '<p class="dashboard-muted-text">Loading workspaces...</p>';
    container.appendChild(loading);

    const response = await MeService.listMyTenants();

    if (hasError(response)) {
      container.innerHTML = '';
      const errorCard = document.createElement('div');
      errorCard.className = 'dashboard-shell dashboard-shell--center dashboard-shell--padded';
      const card = document.createElement('div');
      card.className = 'card dashboard-error-card';
      const h2 = document.createElement('h2');
      h2.textContent = 'Error';
      h2.style.fontSize = '18px';
      h2.style.fontWeight = '600';
      h2.style.marginBottom = '8px';
      const p = document.createElement('p');
      p.textContent = resolveErrorMessage(response.error);
      p.style.fontSize = '14px';
      p.style.color = 'var(--text-secondary)';
      card.appendChild(h2);
      card.appendChild(p);
      errorCard.appendChild(card);
      container.appendChild(errorCard);
      return;
    }

    const tenants = response.data?.tenants || [];

    /*
     * Page setup
     */
    container.innerHTML = '';
    container.className = 'page-dashboard';

    /*
     * Header with Create and Sign out
     */
    const createBtn = Button('+ Create Workspace', {
      variant: 'primary',
      size: 'sm',
      onClick: () => {
        const dialog = CreateTenantDialog({
          onSubmit: async (data) => {
            const result = await TenantService.create({ name: data.name });

            if (hasError(result)) {
              throw new Error(resolveErrorMessage(result.error));
            }

            /*
             * Set tenant ID and navigate to workspace
             * Workspace page will fetch full tenant details
             */
            const tenantId = result.data?.tenant_id;
            if (!tenantId) {
              throw new Error('Invalid workspace response');
            }
            store.setActiveTenantId(tenantId);
            router.navigate(ROUTES.WORKSPACE);
          },
        });
        document.body.appendChild(dialog);
      },
    });
    const signOutBtn = Button('Sign out', {
      variant: 'ghost',
      size: 'sm',
      onClick: async () => {
        await AuthService.logout();
        store.clear();
        router.navigate(ROUTES.LOGIN);
      },
    });

    const header = createHeader({
      title: 'Workspaces',
      actions: [createBtn, signOutBtn],
    });
    container.appendChild(header);

    /*
     * Content
     */
    const content = document.createElement('div');
    content.className = 'dashboard-content';

    const contentHeader = document.createElement('div');
    contentHeader.className = 'dashboard-content__header';

    const heading = document.createElement('h1');
    heading.textContent = 'Your workspaces';
    contentHeader.appendChild(heading);
    content.appendChild(contentHeader);

    const sub = document.createElement('p');
    sub.className = 'dashboard-content__sub';
    sub.textContent = 'Select a workspace to get started, or create a new one.';
    content.appendChild(sub);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';

    if (tenants.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'dashboard-muted-text';
      emptyMsg.textContent = 'No workspaces yet';
      grid.appendChild(emptyMsg);
    } else {
      tenants.forEach((t) => {
        const role = (t as any).role || 'member';
        const memberCount = (t as any).member_count || 0;
        const card = createTenantCard({
          id: t.id,
          name: t.name,
          role,
          memberCount,
          onClick: () => {
            store.setActiveTenantId(t.id);
            router.navigate(ROUTES.WORKSPACE);
          },
        });
        grid.appendChild(card);
      });
    }

    content.appendChild(grid);
    container.appendChild(content);
  },
};
