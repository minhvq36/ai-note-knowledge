/*
 * Sidebar Component
 * Navigation sidebar with sections and active states
 */

export interface SidebarItem {
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

export interface SidebarOptions {
  brand: string;
  brandIcon?: string;
  sections: SidebarSection[];
  footer?: HTMLElement;
}

function createSvgIcon(name: string): string {
  const icons: Record<string, string> = {
    home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };
  return icons[name] || icons.file;
}

export function createSidebar(options: SidebarOptions): HTMLElement {
  const { brand, brandIcon, sections, footer } = options;

  const sidebar = document.createElement("nav");
  sidebar.className = "layout-sidebar";
  sidebar.setAttribute("aria-label", "Main navigation");

  /*
   * Brand
   */
  const brandEl = document.createElement("div");
  brandEl.className = "sidebar-brand";

  const iconEl = document.createElement("span");
  iconEl.className = "sidebar-brand__icon";
  iconEl.textContent = brandIcon || brand.charAt(0).toUpperCase();
  brandEl.appendChild(iconEl);

  const brandText = document.createElement("span");
  brandText.textContent = brand;
  brandEl.appendChild(brandText);

  sidebar.appendChild(brandEl);

  /*
   * Sections
   */
  sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "sidebar-section";

    if (section.label) {
      const labelEl = document.createElement("div");
      labelEl.className = "sidebar-section__label";
      labelEl.textContent = section.label;
      sectionEl.appendChild(labelEl);
    }

    section.items.forEach((item) => {
      const itemEl = document.createElement("button");
      itemEl.className = `sidebar-item${item.active ? " sidebar-item--active" : ""}`;

      const iconSpan = document.createElement("span");
      iconSpan.className = "sidebar-item__icon";
      iconSpan.innerHTML = createSvgIcon(item.icon);
      itemEl.appendChild(iconSpan);

      const labelSpan = document.createElement("span");
      labelSpan.textContent = item.label;
      itemEl.appendChild(labelSpan);

      if (item.onClick) {
        itemEl.addEventListener("click", item.onClick);
      }

      sectionEl.appendChild(itemEl);
    });

    sidebar.appendChild(sectionEl);
  });

  /*
   * Spacer
   */
  const spacer = document.createElement("div");
  spacer.className = "sidebar-spacer";
  sidebar.appendChild(spacer);

  /*
   * Footer
   */
  if (footer) {
    const footerEl = document.createElement("div");
    footerEl.className = "sidebar-footer";
    footerEl.appendChild(footer);
    sidebar.appendChild(footerEl);
  }

  return sidebar;
}
