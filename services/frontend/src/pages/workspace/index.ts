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
    <div class="flex h-screen overflow-hidden bg-background">
      <!-- Sidebar -->
      <aside class="hidden lg:flex flex-col w-56 border-r border-border bg-sidebar">
        <!-- Tenant Switcher -->
        <div class="flex h-14 items-center border-b border-sidebar-border px-3">
          <button class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent transition-colors w-full outline-none">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">
              ${tenant.name.charAt(0).toUpperCase()}
            </span>
            <span class="truncate font-medium text-sidebar-foreground">
              ${tenant.name}
            </span>
            <span class="shrink-0 ml-auto text-muted-foreground">⋮</span>
          </button>
        </div>

        <!-- Search -->
        <div class="px-3 py-3">
          <button class="flex w-full items-center gap-2 rounded-md bg-sidebar-accent px-2.5 py-1.5 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
            <span>🔍</span>
            <span>Search notes...</span>
            <kbd class="ml-auto rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              /
            </kbd>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-2">
          <ul class="flex flex-col gap-0.5" role="list">
            <li>
              <button
                class="section-nav active flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                data-section="notes"
              >
                <span>📝</span>
                Notes
              </button>
            </li>
            <li>
              <button
                class="section-nav flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                data-section="members"
              >
                <span>👥</span>
                Members
              </button>
            </li>
            <li>
              <button
                class="section-nav flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                data-section="settings"
              >
                <span>⚙️</span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <!-- New Note Button -->
        <div class="border-t border-sidebar-border p-3">
          <button class="flex w-full items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-sidebar-primary hover:bg-sidebar-accent transition-colors font-medium">
            <span>+</span>
            New note
          </button>
        </div>

        <!-- User Info -->
        <div class="border-t border-sidebar-border p-3">
          <div class="flex items-center gap-2.5">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              ${store.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-medium text-sidebar-foreground truncate">User</span>
              <span class="text-[10px] text-muted-foreground truncate">${store.user?.email || 'unknown@example.com'}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Top Bar -->
        <header class="flex h-14 items-center border-b border-border px-6">
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-foreground">
              ${tenant.name}
            </h2>
          </div>
          <button
            id="backBtn"
            class="px-3 py-1.5 text-sm rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </header>

        <!-- Content Area -->
        <main class="flex-1 overflow-auto">
          <div id="notesSection" class="section-content p-6">
            <div class="max-w-5xl">
              <h3 class="text-2xl font-bold text-foreground mb-6">Notes</h3>
              <div id="notesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="rounded-lg border border-border bg-card p-4 text-center text-muted-foreground">
                  Loading notes...
                </div>
              </div>
            </div>
          </div>

          <div id="membersSection" class="section-content hidden p-6">
            <div class="max-w-5xl">
              <h3 class="text-2xl font-bold text-foreground mb-6">Team Members</h3>
              <div id="membersList" class="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
                Loading members...
              </div>
            </div>
          </div>

          <div id="settingsSection" class="section-content hidden p-6">
            <div class="max-w-5xl">
              <h3 class="text-2xl font-bold text-foreground mb-6">Settings</h3>
              <div class="rounded-lg border border-border bg-card p-6">
                <p class="text-muted-foreground">Workspace settings coming soon...</p>
              </div>
            </div>
          </div>
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
          b.classList.remove('bg-sidebar-accent', 'text-sidebar-accent-foreground', 'font-medium');
          b.classList.add('text-sidebar-foreground/70', 'hover:text-sidebar-foreground');
        });
        btn.classList.add('bg-sidebar-accent', 'text-sidebar-accent-foreground', 'font-medium');
        btn.classList.remove('text-sidebar-foreground/70', 'hover:text-sidebar-foreground');

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
