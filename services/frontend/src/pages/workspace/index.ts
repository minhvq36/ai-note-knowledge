/*
 * Workspace Page
 * Merged v0 sidebar layout + vanilla logic
 */

import { store } from '../../core/state';
import { router } from '../../core/router';
import { TenantService } from '../../api/services/tenant';
import { hasError, resolveErrorMessage } from '../../api/contracts/base';
import type { Tenant } from '../../api/contracts/tenant';

/*
 * UI Render Helper
 */
function renderWorkspaceUI(tenant: Tenant): string {
  return `
    <div class="workspace-shell">
      <aside class="workspace-sidebar">
        <div class="workspace-sidebar__switcher">
          <button type="button" class="workspace-tenant-btn">
            <span class="workspace-tenant-btn__avatar">
              ${tenant.name.charAt(0).toUpperCase()}
            </span>
            <span class="workspace-tenant-btn__name">${tenant.name}</span>
            <span class="workspace-tenant-btn__menu">⋮</span>
          </button>
        </div>

        <div class="workspace-sidebar__search">
          <button type="button" class="workspace-search-btn">
            <span>🔍</span>
            <span>Search notes...</span>
            <kbd>/</kbd>
          </button>
        </div>

        <nav class="workspace-sidebar__nav" aria-label="Workspace sections">
          <ul role="list">
            <li>
              <button type="button" class="section-nav section-nav--active" data-section="notes">
                <span>📝</span>
                Notes
              </button>
            </li>
            <li>
              <button type="button" class="section-nav" data-section="members">
                <span>👥</span>
                Members
              </button>
            </li>
            <li>
              <button type="button" class="section-nav" data-section="settings">
                <span>⚙️</span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <div class="workspace-sidebar__new-note">
          <button type="button" class="workspace-new-note-btn">
            <span>+</span>
            New note
          </button>
        </div>

        <div class="workspace-sidebar__user">
          <div class="workspace-user-chip">
            <div class="workspace-user-chip__avatar">${store.user?.email?.charAt(0).toUpperCase() || 'U'}</div>
            <div class="workspace-user-chip__content">
              <span>User</span>
              <span>${store.user?.email || 'unknown@example.com'}</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="workspace-main">
        <header class="workspace-header">
          <h2>${tenant.name}</h2>
          <button id="backBtn" type="button" class="workspace-back-btn">← Back</button>
        </header>

        <main class="workspace-content">
          <section id="notesSection" class="section-content workspace-section">
            <div class="workspace-section__inner">
              <h3>Notes</h3>
              <div id="notesList" class="workspace-card-grid">
                <div class="workspace-card workspace-card--muted">Loading notes...</div>
              </div>
            </div>
          </section>

          <section id="membersSection" class="section-content workspace-section hidden">
            <div class="workspace-section__inner">
              <h3>Team Members</h3>
              <div id="membersList" class="workspace-card workspace-card--muted">Loading members...</div>
            </div>
          </section>

          <section id="settingsSection" class="section-content workspace-section hidden">
            <div class="workspace-section__inner">
              <h3>Settings</h3>
              <div class="workspace-card">
                <p>Workspace settings coming soon...</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
}

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
     * Check if tenant is cached in store
     */
    let tenant = store.activeTenant;

    if (!tenant) {
      container.innerHTML = `<div class="flex-center min-h-screen"><p class="text-muted-foreground">Loading workspace...</p></div>`;

      const response = await TenantService.getTenant(store.activeTenantId);

      if (hasError(response)) {
        container.innerHTML = `
          <div class="flex-center min-h-screen px-4">
            <div class="rounded-lg border border-border bg-card shadow-lg p-6 max-w-md text-center">
              <p class="text-destructive text-sm">${resolveErrorMessage(response.error)}</p>
            </div>
          </div>
        `;
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
     * Render workspace UI
     */
    container.innerHTML = renderWorkspaceUI(tenant);

    /*
     * Setup event listeners
     */

    /*
     * Section navigation
     */
    const sectionBtns = container.querySelectorAll('.section-nav');
    sectionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        if (!section) return;

        /*
         * Update active nav button
         */
        sectionBtns.forEach((b) => {
          b.classList.remove('section-nav--active');
        });
        btn.classList.add('section-nav--active');

        /*
         * Update visible section
         */
        const sections = container.querySelectorAll('.section-content');
        sections.forEach((s) => s.classList.add('hidden'));
        container.querySelector(`#${section}Section`)?.classList.remove('hidden');
      });
    });

    /*
     * Back button
     */
    container.querySelector('#backBtn')?.addEventListener('click', () => {
      store.setActiveTenant(null);
      router.navigate('/dashboard');
    });
  },
};
