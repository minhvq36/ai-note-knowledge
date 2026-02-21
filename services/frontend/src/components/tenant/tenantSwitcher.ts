/*
 * Tenant Switcher Component
 * Dropdown for switching between tenants
 */

export interface TenantSwitcherOptions {
  currentTenant: {
    id: string;
    name: string;
  };
  tenants: Array<{
    id: string;
    name: string;
  }>;
  onSelect: (tenantId: string) => void;
}

export function createTenantSwitcher(options: TenantSwitcherOptions): HTMLButtonElement {
  const { currentTenant, tenants, onSelect } = options;

  const button = document.createElement('button');
  button.className = [
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
    'hover:bg-sidebar-accent transition-colors w-full outline-none',
  ]
    .join(' ');

  button.innerHTML = `
    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">
      ${currentTenant.name.charAt(0).toUpperCase()}
    </span>
    <span class="truncate font-medium text-sidebar-foreground">
      ${currentTenant.name}
    </span>
    <span class="shrink-0 ml-auto text-muted-foreground">⋮</span>
  `;

  /*
   * Dropdown menu (simple implementation)
   */
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    /*
     * Create dropdown menu
     */
    const existingDropdown = document.querySelector('[data-dropdown="tenant-menu"]');
    if (existingDropdown) {
      existingDropdown.remove();
    }

    const menu = document.createElement('div');
    menu.setAttribute('data-dropdown', 'tenant-menu');
    menu.className = [
      'absolute top-14 left-3 mt-1 w-56 rounded-md border border-border bg-card',
      'shadow-lg z-50',
    ]
      .join(' ');

    tenants.forEach((tenant) => {
      const item = document.createElement('button');
      item.className = [
        'flex w-full items-center gap-2 px-3 py-2 text-sm',
        'hover:bg-accent transition-colors text-left',
      ]
        .join(' ');

      item.innerHTML = `
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent text-[9px] font-bold text-accent-foreground">
          ${tenant.name.charAt(0).toUpperCase()}
        </span>
        <span class="flex-1 truncate">${tenant.name}</span>
        ${currentTenant.id === tenant.id ? '<span text-accent>✓</span>' : ''}
      `;

      item.addEventListener('click', () => {
        onSelect(tenant.id);
        menu.remove();
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    /*
     * Close menu on outside click
     */
    const closeMenu = () => {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  });

  return button;
}
