/*
 * Alert Component
 * Notification/error messages with animations
 */

export interface AlertOptions {
  type?: 'error' | 'success' | 'warning' | 'info';
  dismissible?: boolean;
}

export function Alert(message: string, options: AlertOptions = {}): HTMLElement {
  const { type = 'error', dismissible = true } = options;
  
  const alert = document.createElement('div');
  alert.className = `alert alert--${type}`;
  alert.setAttribute('role', 'alert');

  const content = document.createElement('div');
  content.className = 'alert__content';
  content.textContent = message;
  alert.appendChild(content);

  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'alert__close';
    closeBtn.setAttribute('aria-label', 'Close alert');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      alert.remove();
    });
    alert.appendChild(closeBtn);
  }

  return alert;
}
