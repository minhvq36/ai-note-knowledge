/*
 * TenantCard Component
 * Displays workspace/tenant information with role and member count
 */

import { Badge } from "../ui/badge";

export interface TenantCardData {
  id: string;
  name: string;
  description?: string;
  role: string;
  memberCount: number;
  noteCount?: number;
  color?: string;
  createdAt?: string;
  onClick?: () => void;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

export function createTenantCard(data: TenantCardData): HTMLElement {
  const { id, name, description, role, memberCount, color, onClick } = data;

  const card = document.createElement("div");
  card.className = "tenant-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("data-tenant-id", id);

  if (onClick) {
    card.addEventListener("click", onClick);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });
  }

  /*
   * Header row: icon + badge
   */
  const header = document.createElement("div");
  header.className = "tenant-card__header";

  const icon = document.createElement("div");
  icon.className = "tenant-card__icon";
  icon.style.background = color || COLORS[name.length % COLORS.length];
  icon.textContent = name.charAt(0).toUpperCase();
  header.appendChild(icon);

  const roleBadge = Badge(role, {
    variant: role === "owner" ? "blue" : role === "admin" ? "amber" : "default",
  });
  header.appendChild(roleBadge);

  card.appendChild(header);

  /*
   * Name
   */
  const nameEl = document.createElement("div");
  nameEl.className = "tenant-card__name";
  nameEl.textContent = name;
  card.appendChild(nameEl);

  /*
   * Description
   */
  if (description) {
    const descEl = document.createElement("div");
    descEl.className = "tenant-card__desc";
    descEl.textContent = description;
    card.appendChild(descEl);
  }

  /*
   * Footer with member count
   */
  const footer = document.createElement("div");
  footer.className = "tenant-card__footer";

  const meta = document.createElement("span");
  meta.className = "tenant-card__meta";
  meta.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${memberCount} member${memberCount !== 1 ? "s" : ""}`;
  footer.appendChild(meta);

  card.appendChild(footer);

  return card;
}
