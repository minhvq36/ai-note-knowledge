/*
 * Spinner Component
 * Loading indicator used for revalidating/syncing states
 */

export interface SpinnerOptions {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner(options: SpinnerOptions = {}): HTMLElement {
  const { size = 'md', label } = options;

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.gap = '8px';

  const spinner = document.createElement('div');
  spinner.className = `spinner spinner--${size}`;

  container.appendChild(spinner);

  if (label) {
    const text = document.createElement('span');
    text.style.fontSize = '12px';
    text.style.color = 'var(--text-tertiary)';
    text.textContent = label;
    container.appendChild(text);
  }

  return container;
}
