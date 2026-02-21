/*
 * Workspace Sidebar Component
 * Navigation and tenant context
 */

export interface WorkspaceSidebarOptions {
  tenantName: string;
  userEmail?: string;
  onSectionChange: (section: string) => void;
}

export function createWorkspaceSidebar(
  options: WorkspaceSidebarOptions
): HTMLElement {
  const { tenantName, userEmail = 'unknown@example.com', onSectionChange } = options;

  const sidebar = document.createElement('aside');
  sidebar.className = [
    'hidden lg:flex flex-col w-56 border-r border-border',
    'bg-sidebar',
  ]
    .join(' ');

  sidebar.innerHTML = `
    <!-- Tenant Switcher -->
    <div class="flex h-14 items-center border-b border-sidebar-border px-3">
      <button class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent transition-colors w-full outline-none">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">
          ${tenantName.charAt(0).toUpperCase()}
        </span>
        <span class="truncate font-medium text-sidebar-foreground">
          ${tenantName}
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
          <button class="nav-section active flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors bg-sidebar-accent text-sidebar-accent-foreground font-medium" data-section="notes">
            <span>📝</span>
            Notes
          </button>
        </li>
        <li>
          <button class="nav-section flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" data-section="shared">
            <span>🔗</span>
            Shared with me
          </button>
        </li>
        <li>
          <button class="nav-section flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" data-section="members">
            <span>👥</span>
            Members
          </button>
        </li>
        <li>
          <button class="nav-section flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" data-section="settings">
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
          ${userEmail.charAt(0).toUpperCase()}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-medium text-sidebar-foreground truncate">User</span>
          <span class="text-[10px] text-muted-foreground truncate">${userEmail}</span>
        </div>
      </div>
    </div>
  `;

  /*
   * Attach event listeners to nav buttons
   */
  const navButtons = sidebar.querySelectorAll('.nav-section');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      /*
       * Update active state
       */
      navButtons.forEach((b) => {
        b.classList.remove('bg-sidebar-accent', 'text-sidebar-accent-foreground', 'font-medium');
        b.classList.add('text-sidebar-foreground/70', 'hover:text-sidebar-foreground', 'hover:bg-sidebar-accent/50');
      });
      btn.classList.add('bg-sidebar-accent', 'text-sidebar-accent-foreground', 'font-medium');
      btn.classList.remove('text-sidebar-foreground/70', 'hover:text-sidebar-foreground', 'hover:bg-sidebar-accent/50');

      /*
       * Callback
       */
      const section = btn.getAttribute('data-section');
      if (section) {
        onSectionChange(section);
      }
    });
  });

  return sidebar;
}
