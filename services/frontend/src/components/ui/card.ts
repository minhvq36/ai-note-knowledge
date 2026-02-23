/*
 * Card Component
 * Reusable card container with hover and clickable states
 */

export interface CardOptions {
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  children?: HTMLElement[];
}

export function Card(options: CardOptions = {}): HTMLElement {
  const { hoverable = false, clickable = false, onClick, children = [] } = options;

  const card = document.createElement("div");
  const classes = ["card"];
  if (hoverable) classes.push("card--hover");
  if (clickable) classes.push("card--clickable");
  card.className = classes.join(" ");

  if (clickable) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
  }

  if (onClick) {
    card.addEventListener("click", onClick);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });
  }

  children.forEach((child) => card.appendChild(child));

  return card;
}
