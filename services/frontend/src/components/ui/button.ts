/*
 * UI Button Component
 * Vanilla TypeScript button with Tailwind styling
 */

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function createButton(
  text: string,
  options: ButtonProps & { id?: string; onClick?: () => void } = {}
): HTMLButtonElement {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    id,
    onClick,
  } = options;

  const button = document.createElement('button');
  if (id) button.id = id;
  button.disabled = disabled;
  if (onClick) button.addEventListener('click', onClick);

  /*
   * Base styles
   */
  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ];

  /*
   * Size variants
   */
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  /*
   * Color variants
   */
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  button.className = [
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  button.textContent = text;

  return button;
}
