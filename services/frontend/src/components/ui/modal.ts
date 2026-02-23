/*
 * Modal Component
 * Reusable dialog with overlay, header, body, footer
 */

export interface ModalOptions {
  title: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onClose?: () => void;
}

export function Modal(options: ModalOptions): HTMLElement {
  const { title, content, footer, onClose } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title);

  const modal = document.createElement('div');
  modal.className = 'modal';

  /*
   * Header
   */
  const header = document.createElement('div');
  header.className = 'modal-header';

  const heading = document.createElement('h2');
  heading.textContent = title;
  header.appendChild(heading);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.setAttribute('type', 'button');
  closeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    onClose?.();
  });
  header.appendChild(closeBtn);

  /*
   * Body
   */
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.appendChild(content);

  modal.appendChild(header);
  modal.appendChild(body);

  /*
   * Footer (optional)
   */
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'modal-footer';
    footerEl.appendChild(footer);
    modal.appendChild(footerEl);
  }

  overlay.appendChild(modal);

  /*
   * Close on overlay click
   */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      onClose?.();
    }
  });

  /*
   * Close on Escape key
   */
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove();
      onClose?.();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  return overlay;
}
