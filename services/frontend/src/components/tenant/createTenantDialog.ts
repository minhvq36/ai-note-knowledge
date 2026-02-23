/*
 * Create Tenant Dialog Component
 * Form to create new workspace
 */

import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';

export interface CreateTenantDialogOptions {
  onSubmit?: (data: { name: string }) => Promise<void>;
  onClose?: () => void;
}

export function CreateTenantDialog(options: CreateTenantDialogOptions = {}): HTMLElement {
  const { onSubmit, onClose } = options;

  const form = document.createElement('div');
  form.className = 'create-dialog-form';

  /*
   * Error display
   */
  const errorDiv = document.createElement('div');
  errorDiv.id = 'createTenantDialogError';
  form.appendChild(errorDiv);

  /*
   * Name input
   */
  const nameInput = Input({
    label: 'Workspace name',
    placeholder: 'My Workspace',
    required: true,
    id: 'workspace-name-input',
  });
  form.appendChild(nameInput);

  /*
   * Button footer
   */
  const footerDiv = document.createElement('div');
  footerDiv.style.display = 'flex';
  footerDiv.style.gap = '8px';
  footerDiv.style.justifyContent = 'flex-end';
  footerDiv.style.width = '100%';

  let isSubmitting = false;

  const cancelBtn = Button('Cancel', {
    variant: 'ghost',
    onClick: () => {
      modal.remove();
      onClose?.();
    },
  });

  const createBtn = Button('Create workspace', { variant: 'primary' });
  createBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    errorDiv.innerHTML = '';
    const nameEl = nameInput.querySelector<HTMLInputElement>('input');
    const nameVal = nameEl?.value.trim() || '';

    if (!nameVal) {
      const alert = Alert('Workspace name cannot be empty', { type: 'error' });
      errorDiv.appendChild(alert);
      nameEl?.focus();
      return;
    }

    isSubmitting = true;
    createBtn.setAttribute('disabled', 'true');

    try {
      await onSubmit?.({ name: nameVal });
      modal.remove();
    } catch (err: any) {
      const alert = Alert(err?.message || 'Failed to create workspace', { type: 'error' });
      errorDiv.appendChild(alert);
      createBtn.removeAttribute('disabled');
      isSubmitting = false;
    }
  });

  footerDiv.appendChild(cancelBtn);
  footerDiv.appendChild(createBtn);

  /*
   * Create modal
   */
  const modal = Modal({
    title: 'Create workspace',
    content: form,
    footer: footerDiv,
    onClose,
  });

  /*
   * Auto-focus input
   */
  setTimeout(() => {
    const nameEl = nameInput.querySelector<HTMLInputElement>('input');
    nameEl?.focus();
  }, 0);

  return modal;
}
