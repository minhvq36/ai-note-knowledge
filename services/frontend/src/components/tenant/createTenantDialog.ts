/*
 * CreateTenantDialog Component
 * Modal for creating a new workspace/tenant
 */

import { Button } from "../ui/button";
import { Input } from "../ui/input";

export interface CreateTenantDialogOptions {
  onSubmit?: (tenantName: string) => void;
  onCancel?: () => void;
}

export function createCreateTenantDialog(options: CreateTenantDialogOptions = {}): HTMLDialogElement {
  const { onSubmit, onCancel } = options;

  const dialog = document.createElement("dialog");
  dialog.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  /*
   * Header
   */
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.textContent = "Create workspace";
  header.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "✕";
  closeBtn.addEventListener("click", () => {
    dialog.close();
    onCancel?.();
  });
  header.appendChild(closeBtn);

  modal.appendChild(header);

  /*
   * Body
   */
  const body = document.createElement("div");
  body.className = "modal-body";

  const nameInput = Input({
    label: "Workspace name",
    placeholder: "My Workspace",
    required: true,
    id: "workspace-name",
  });
  body.appendChild(nameInput);

  modal.appendChild(body);

  /*
   * Footer
   */
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const cancelBtn = Button("Cancel", { variant: "ghost" });
  cancelBtn.addEventListener("click", () => {
    dialog.close();
    onCancel?.();
  });
  footer.appendChild(cancelBtn);

  const submitBtn = Button("Create", { variant: "primary" });
  submitBtn.addEventListener("click", () => {
    const input = dialog.querySelector<HTMLInputElement>("#workspace-name");
    if (input?.value) {
      onSubmit?.(input.value);
    }
  });
  footer.appendChild(submitBtn);

  modal.appendChild(footer);
  dialog.appendChild(modal);

  /*
   * Dialog styling
   */
  Object.assign(dialog.style, {
    border: "none",
    padding: "0",
    margin: "0",
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return dialog;
}
