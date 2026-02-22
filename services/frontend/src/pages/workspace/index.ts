/*
 * Workspace Page
 * Sidebar layout with sections and content area
 */

import { store } from '../../core/state';
import { router } from '../../core/router';
import { TenantService } from '../../api/services/tenant';
import { AuthService } from '../../api/services/auth';
import { hasError, resolveErrorMessage } from '../../api/contracts/base';
import { createSidebar } from '../../components/layout/sidebar';
import { createHeader } from '../../components/layout/header';
import { Button } from '../../components/ui/button';
import type { Tenant } from '../../api/contracts/tenant';

export const WorkspacePage = {
  async render(container: HTMLElement) {
    /*
     * Guard: ensure tenant ID is selected
     */
    if (!store.activeTenantId) {
      router.navigate('/dashboard');
      return;
    }

    /*
     * Check if tenant is cached
     */
    let tenant = store.activeTenant;

    if (!tenant) {
      container.innerHTML = '';
      const loading = document.createElement('div');
      loading.className = 'dashboard-shell dashboard-shell--center';
      loading.innerHTML = '<p class="dashboard-muted-text">Loading workspace...</p>';
      container.appendChild(loading);

      const response = await TenantService.getTenant(store.activeTenantId);

      if (hasError(response)) {
        container.innerHTML = '';
        const errorCard = document.createElement('div');
        errorCard.className = 'dashboard-shell dashboard-shell--center dashboard-shell--padded';
        const card = document.createElement('div');
        card.className = 'card dashboard-error-card';
        const p = document.createElement('p');
        p.textContent = resolveErrorMessage(response.error);
        p.style.color = 'var(--red)';
        p.style.fontSize = '14px';
        card.appendChild(p);
        errorCard.appendChild(card);
        container.appendChild(errorCard);
        return;
      }

      tenant = response.data;

      if (!tenant) {
        router.navigate('/dashboard');
        return;
      }

      store.setActiveTenant(tenant);
    }

    /*
     * Page setup
     */
    container.innerHTML = '';
    container.className = 'page-workspace';

    /*
     * Sidebar
     */
    const sidebar = createSidebar({
      brand: tenant.name,
      brandIcon: tenant.name.charAt(0).toUpperCase(),
      sections: [
        {
          items: [
            {
              label: 'Notes',
              icon: 'file',
              active: true,
              onClick: () => {
                document.querySelectorAll('.section-nav').forEach((el) => el.classList.remove('sidebar-item--active'));
                (event?.target as HTMLElement)?.classList.add('sidebar-item--active');
                document.querySelectorAll('section').forEach((s) => s.classList.add('hidden'));
                document.querySelector('#notesSection')?.classList.remove('hidden');
              },
            },
            {
              label: 'Members',
              icon: 'users',
              onClick: () => {
                document.querySelectorAll('.section-nav').forEach((el) => el.classList.remove('sidebar-item--active'));
                (event?.target as HTMLElement)?.classList.add('sidebar-item--active');
                document.querySelectorAll('section').forEach((s) => s.classList.add('hidden'));
                document.querySelector('#membersSection')?.classList.remove('hidden');
              },
            },
            {
              label: 'Settings',
              icon: 'settings',
              onClick: () => {
                document.querySelectorAll('.section-nav').forEach((el) => el.classList.remove('sidebar-item--active'));
                (event?.target as HTMLElement)?.classList.add('sidebar-item--active');
                document.querySelectorAll('section').forEach((s) => s.classList.add('hidden'));
                document.querySelector('#settingsSection')?.classList.remove('hidden');
              },
            },
          ],
        },
      ],
      footer: Button('← Back', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          store.setActiveTenant(null);
          router.navigate('/dashboard');
        },
      }),
    });
    container.appendChild(sidebar);

    /*
     * Main area
     */
    const main = document.createElement('div');
    main.className = 'workspace-main';

    const signOutBtn = Button('Sign out', {
      variant: 'ghost',
      size: 'sm',
      onClick: async () => {
        await AuthService.logout();
        store.clear();
        router.navigate('/login');
      },
    });

    const header = createHeader({
      title: `${tenant.name} / Notes`,
      actions: [signOutBtn],
    });
    main.appendChild(header);

    /*
     * Content
     */
    const content = document.createElement('div');
    content.className = 'workspace-content';

    const notesSection = document.createElement('section');
    notesSection.id = 'notesSection';
    const notesHeading = document.createElement('h2');
    notesHeading.textContent = 'Notes';
    const notesList = document.createElement('div');
    notesList.className = 'notes-list';
    notesList.innerHTML = '<p style="text-align:center;color:var(--text-secondary)">No notes yet</p>';
    notesSection.appendChild(notesHeading);
    notesSection.appendChild(notesList);
    content.appendChild(notesSection);

    const membersSection = document.createElement('section');
    membersSection.id = 'membersSection';
    membersSection.className = 'hidden';
    const membersHeading = document.createElement('h2');
    membersHeading.textContent = 'Members';
    const membersList = document.createElement('div');
    membersList.className = 'members-list';
    membersList.innerHTML = '<p style="text-align:center;color:var(--text-secondary)">Loading members...</p>';
    membersSection.appendChild(membersHeading);
    membersSection.appendChild(membersList);
    content.appendChild(membersSection);

    const settingsSection = document.createElement('section');
    settingsSection.id = 'settingsSection';
    settingsSection.className = 'hidden';
    const settingsHeading = document.createElement('h2');
    settingsHeading.textContent = 'Settings';
    const settingsContent = document.createElement('p');
    settingsContent.style.color = 'var(--text-secondary)';
    settingsContent.textContent = 'Workspace settings coming soon...';
    settingsSection.appendChild(settingsHeading);
    settingsSection.appendChild(settingsContent);
    content.appendChild(settingsSection);

    main.appendChild(content);
    container.appendChild(main);
  },
};
