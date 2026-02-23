/*
 * Input Component
 * Reusable form input with label, placeholder, and validation
 */

export interface InputOptions {
  type?: string;
  placeholder?: string;
  label?: string;
  value?: string;
  required?: boolean;
  id?: string;
}

export function Input(options: InputOptions = {}): HTMLElement {
  const {
    type = "text",
    placeholder = "",
    label,
    value = "",
    required = false,
    id,
  } = options;

  const wrapper = document.createElement("div");
  wrapper.className = "input-group";

  const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`;

  if (label) {
    const labelEl = document.createElement("label");
    labelEl.className = "input-label";
    labelEl.textContent = label;
    labelEl.htmlFor = inputId;
    wrapper.appendChild(labelEl);
  }

  const input = document.createElement("input");
  input.className = "input";
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.id = inputId;
  if (required) input.required = true;

  wrapper.appendChild(input);
  return wrapper;
}
