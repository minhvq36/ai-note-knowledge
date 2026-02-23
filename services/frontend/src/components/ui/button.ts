/*
 * Button Component
 * Reusable button with multiple variants and sizes
 */

export interface ButtonOptions {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: boolean;
  onClick?: () => void;
}

export function Button(label: string, options: ButtonOptions = {}): HTMLElement {
  const { variant = "primary", size = "md", icon = false, onClick } = options;
  const btn = document.createElement("button");
  btn.type = "button";

  const classes = ["btn"];
  classes.push(`btn--${variant}`);
  if (size !== "md") classes.push(`btn--${size}`);
  if (icon) classes.push("btn--icon");
  btn.className = classes.join(" ");

  if (!icon) {
    btn.textContent = label;
  } else {
    btn.innerHTML = label;
    btn.setAttribute("aria-label", label);
  }

  if (onClick) {
    btn.addEventListener("click", onClick);
  }

  return btn;
}
