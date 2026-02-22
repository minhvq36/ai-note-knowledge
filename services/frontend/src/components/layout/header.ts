/*
 * Header Component
 * Page header with title and actions
 */

export interface HeaderOptions {
  title: string;
  actions?: HTMLElement[];
}

export function createHeader(options: HeaderOptions): HTMLElement {
  const { title, actions = [] } = options;

  const header = document.createElement("header");
  header.className = "layout-header";

  const titleEl = document.createElement("h1");
  titleEl.className = "layout-header__title";
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (actions.length > 0) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "layout-header__actions";
    actions.forEach((action) => actionsContainer.appendChild(action));
    header.appendChild(actionsContainer);
  }

  return header;
}
