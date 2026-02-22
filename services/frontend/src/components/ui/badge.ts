/*
 * Badge Component
 * Display inline badges with different variants and colors
 */

export interface BadgeOptions {
  variant?: "default" | "blue" | "green" | "amber" | "red";
}

export function Badge(label: string, options: BadgeOptions = {}): HTMLElement {
  const { variant = "default" } = options;
  const badge = document.createElement("span");
  badge.className = `badge badge--${variant}`;
  badge.textContent = label;
  return badge;
}
