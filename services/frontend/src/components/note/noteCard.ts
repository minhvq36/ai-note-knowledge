/*
 * Note Card Component
 * Display individual note in list
 */

export interface NoteCardProps {
  id: string;
  content: string;
  created_at: string;
  owner_id: string;
  onClick?: () => void;
}

export function createNoteCard(note: NoteCardProps): HTMLDivElement {
  const card = document.createElement('div');
  card.className = [
    'group cursor-pointer rounded-lg border border-border bg-card',
    'hover:border-accent/50 hover:shadow-md transition-all p-4',
  ]
    .join(' ');

  card.innerHTML = `
    <div class="flex flex-col gap-3">
      <!-- Title/Content -->
      <h4 class="font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
        ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}
      </h4>

      <!-- Meta info -->
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>${new Date(note.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}</span>
        <span class="text-accent group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  `;

  if (note.onClick) {
    card.addEventListener('click', note.onClick);
  }

  return card;
}
