/*
 * NoteCard Component
 * Displays a note with title, body, metadata, and optional actions
 */

export interface NoteCardAction {
  label: string;
  onClick: (e: Event) => void;
  className?: string;
}

export interface NoteCardData {
  title: string;
  body: string;
  author?: string;
  date?: string;
  onClick?: () => void;
  actions?: NoteCardAction[];
}

export function NoteCard(data: NoteCardData): HTMLElement {
  const { title, body, author, date, onClick, actions } = data;

  const card = document.createElement('div');
  card.className = 'note-card';

  if (onClick) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', onClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    });
  }

  const titleEl = document.createElement('div');
  titleEl.className = 'note-card__title';
  titleEl.textContent = title;
  card.appendChild(titleEl);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'note-card__body';
  bodyEl.textContent = body;
  card.appendChild(bodyEl);

  if (author || date) {
    const meta = document.createElement('div');
    meta.className = 'note-card__meta';
    const parts: string[] = [];
    if (author) parts.push(author);
    if (date) parts.push(date);
    meta.textContent = parts.join(' \u00B7 ');
    card.appendChild(meta);
  }

  if (actions && actions.length > 0) {
    const actionsEl = document.createElement('div');
    actionsEl.className = 'note-card__actions';

    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.className = `note-card__action-btn ${action.className || ''}`;
      btn.textContent = action.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick(e);
      });
      actionsEl.appendChild(btn);
    });

    card.appendChild(actionsEl);
  }

  return card;
}
