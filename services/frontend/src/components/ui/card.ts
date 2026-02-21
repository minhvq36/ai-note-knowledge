/*
 * UI Card Component
 * Vanilla TypeScript card with Tailwind styling
 */

export interface CardProps {
  className?: string;
}

export function createCard(options: CardProps = {}): HTMLDivElement {
  const { className = '' } = options;

  const card = document.createElement('div');
  card.className = [
    'rounded-lg border border-border bg-card text-card-foreground',
    'shadow-sm transition-all hover:border-accent/50 hover:shadow-md',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return card;
}

export function createCardHeader(className = ''): HTMLDivElement {
  const header = document.createElement('div');
  header.className = ['px-6 py-4 border-b border-border', className]
    .filter(Boolean)
    .join(' ');
  return header;
}

export function createCardContent(className = ''): HTMLDivElement {
  const content = document.createElement('div');
  content.className = ['px-6 py-4', className]
    .filter(Boolean)
    .join(' ');
  return content;
}

export function createCardTitle(text: string, className = ''): HTMLHeadingElement {
  const title = document.createElement('h3');
  title.textContent = text;
  title.className = [
    'text-lg font-semibold text-card-foreground',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return title;
}

export function createCardDescription(
  text: string,
  className = ''
): HTMLParagraphElement {
  const desc = document.createElement('p');
  desc.textContent = text;
  desc.className = [
    'text-sm text-muted-foreground mt-1',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return desc;
}
