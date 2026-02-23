/*
 * NotesSection Component
 * Manages notes list, creation, editing, and deletion within a tenant workspace
 */

import { store } from '../../core/state';
import { NoteService } from '../../api/services/note';
import { hasError, resolveErrorMessage } from '../../api/contracts/base';
import type { Note, CreateNoteRequest } from '../../api/contracts/note';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Modal } from '../../components/ui/modal';
import { Spinner } from '../../components/ui/spinner';
import { NoteCard } from '../../components/note/noteCard';

interface NotesState {
  notes: Note[];
  isInitialLoading: boolean;
  isFetching: boolean;
  error: string | null;
  editingNoteId: string | null;
}

/*
 * Helper: Extract pseudo-title from note content (first 40 chars)
 */
function getTitleFromContent(content: string, maxLength = 40): string {
  return content.substring(0, maxLength).replace(/\n/g, ' ');
}

/*
 * Helper: Render note card using NoteCard component with edit/delete actions
 */
function createNoteCard(note: Note, onEdit: (note: Note) => void, onDelete: (note: Note) => void): HTMLElement {
  const title = getTitleFromContent(note.content);

  return NoteCard({
    title: title + (note.content.length > 40 ? '...' : ''),
    body: note.content,
    date: new Date(note.created_at).toLocaleDateString(),
    onClick: () => onEdit(note),
    actions: [
      {
        label: 'Edit',
        onClick: () => onEdit(note),
        className: 'note-card__action-btn--edit',
      },
      {
        label: 'Delete',
        onClick: () => onDelete(note),
        className: 'note-card__action-btn--delete',
      },
    ],
  });
}

/*
 * Helper: Show create/edit note modal
 */
function showNoteModal(
  title: string,
  initialContent: string = '',
  onSave: (content: string) => Promise<void>,
): Promise<void> {
  return new Promise((resolve) => {
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '12px';

    const textarea = document.createElement('textarea');
    textarea.value = initialContent;
    textarea.placeholder = 'Write your note...';
    textarea.style.padding = '8px';
    textarea.style.border = '1px solid var(--border-color)';
    textarea.style.borderRadius = '4px';
    textarea.style.fontFamily = 'inherit';
    textarea.style.fontSize = '14px';
    textarea.style.minHeight = '300px';
    textarea.style.resize = 'vertical';
    textarea.style.flex = '1';
    form.appendChild(textarea);

    let alertEl: HTMLElement | null = null;
    let isSubmitting = false;

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.gap = '8px';
    footer.style.justifyContent = 'flex-end';

    const cancelBtnEl = Button('Cancel', {
      variant: 'secondary',
      size: 'sm',
      onClick: () => {
        modal.remove();
        resolve();
      },
    });
    const cancelBtn = cancelBtnEl as HTMLButtonElement;

    const saveBtnEl = Button(initialContent ? 'Update' : 'Create', {
      variant: 'primary',
      size: 'sm',
      onClick: () => {
        handleSave();
      },
    });
    const saveBtn = saveBtnEl as HTMLButtonElement;

    async function handleSave() {
      if (isSubmitting) return;

      const content = textarea.value.trim();
      if (!content) {
        if (alertEl) alertEl.remove();
        alertEl = Alert('Content cannot be empty', { type: 'error' });
        form.insertBefore(alertEl, form.firstChild);
        textarea.focus();
        return;
      }

      isSubmitting = true;
      saveBtn.disabled = true;
      cancelBtn.disabled = true;

      try {
        await onSave(content);
        modal.remove();
        resolve();
      } catch (err) {
        isSubmitting = false;
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        if (alertEl) alertEl.remove();
        alertEl = Alert(err instanceof Error ? err.message : 'Failed to save note', { type: 'error' });
        form.insertBefore(alertEl, form.firstChild);
      }
    }

    footer.appendChild(cancelBtnEl);
    footer.appendChild(saveBtnEl);

    const modal = Modal({
      title,
      content: form,
      footer,
      onClose: () => {
        resolve();
      },
      className: 'modal--wide', // Apply the custom class here
    });

    document.body.appendChild(modal);
    textarea.focus();
  });
}

/*
 * Helper: Show delete confirmation modal
 */
function showDeleteConfirmation(noteName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const content = document.createElement('p');
    content.textContent = `Are you sure you want to delete this note?`;
    content.style.marginBottom = '16px';

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.gap = '8px';
    footer.style.justifyContent = 'flex-end';

    const cancelBtn = Button('Cancel', {
      variant: 'secondary',
      size: 'sm',
      onClick: () => {
        modal.remove();
        resolve(false);
      },
    });

    const deleteBtn = Button('Delete', {
      variant: 'primary',
      size: 'sm',
      onClick: () => {
        modal.remove();
        resolve(true);
      },
    }) as HTMLButtonElement;

    deleteBtn.style.backgroundColor = 'var(--red)';

    footer.appendChild(cancelBtn);
    footer.appendChild(deleteBtn);

    const modal = Modal({
      title: 'Delete Note',
      content,
      footer,
      onClose: () => {
        resolve(false);
      },
    });

    document.body.appendChild(modal);
  });
}

/*
 * Main NotesSection component
 */
export async function createNotesSection(tenantId: string): Promise<HTMLElement> {
  const section = document.createElement('section');
  section.id = 'notesSection';
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.flex = '1';
  section.style.minHeight = '0';
  section.style.gap = '16px';

  const headerEl = document.createElement('div');
  headerEl.style.display = 'flex';
  headerEl.style.justifyContent = 'space-between';
  headerEl.style.alignItems = 'center';
  headerEl.style.flexShrink = '0';

  const h2 = document.createElement('h2');
  h2.textContent = 'Notes';
  headerEl.appendChild(h2);

  const newNoteBtn = Button('+ New Note', {
    variant: 'primary',
    size: 'sm',
  });
  headerEl.appendChild(newNoteBtn);

  section.appendChild(headerEl);

  const state: NotesState = {
    notes: [],
    isInitialLoading: true,
    isFetching: false,
    error: null,
    editingNoteId: null,
  };

  const contentContainer = document.createElement('div');
  contentContainer.className = 'notes-content';
  contentContainer.style.flex = '1';
  contentContainer.style.overflowY = 'auto';
  contentContainer.style.minHeight = '0';

  /*
   * Render function - SWR pattern (Stale-While-Revalidate)
   * Keep old data while fetching, show small loading indicator
   */
  function render() {
    contentContainer.innerHTML = '';

    // Initial loading (no data yet)
    if (state.isInitialLoading && state.notes.length === 0) {
      const loading = document.createElement('p');
      loading.style.textAlign = 'center';
      loading.style.color = 'var(--text-secondary)';
      loading.textContent = 'Loading notes...';
      contentContainer.appendChild(loading);
      return;
    }

    // Error during initial load
    if (state.error && state.notes.length === 0) {
      const errorAlert = Alert(state.error, { type: 'error' });
      contentContainer.appendChild(errorAlert);
      return;
    }

    // Render notes (whether fresh or stale while revalidating)
    if (state.notes.length === 0) {
      const empty = document.createElement('p');
      empty.style.textAlign = 'center';
      empty.style.color = 'var(--text-secondary)';
      empty.textContent = 'No notes yet. Create your first note!';
      contentContainer.appendChild(empty);
    } else {
      state.notes.forEach((note) => {
        const card = createNoteCard(
          note,
          (note) => handleEdit(note),
          (note) => handleDelete(note),
        );
        contentContainer.appendChild(card);
      });
    }

    // Show small loading indicator while revalidating (SWR pattern)
    if (state.isFetching) {
      const revalidatingEl = document.createElement('div');
      revalidatingEl.style.paddingTop = '16px';
      const spinnerEl = Spinner({ size: 'sm', label: 'Syncing...' });
      revalidatingEl.appendChild(spinnerEl);
      contentContainer.appendChild(revalidatingEl);
    }

    // Show error banner if fetch fails (but keep old data visible)
    if (state.error && state.notes.length > 0) {
      const errorEl = document.createElement('div');
      errorEl.style.marginBottom = '12px';
      const errorAlert = Alert(state.error, { type: 'error' });
      errorEl.appendChild(errorAlert);
      contentContainer.insertBefore(errorEl, contentContainer.firstChild);
    }
  }

  /*
   * Fetch notes - SWR pattern
   * First fetch: show loading state
   * Subsequent fetches: keep old data, show small "Syncing..." indicator
   */
  async function fetchNotes(isRevalidate: boolean = false) {
    if (!isRevalidate) {
      // Initial load: show loading state
      state.isInitialLoading = true;
    } else {
      // Revalidation: keep old data, set fetching flag
      state.isFetching = true;
    }

    state.error = null;
    render();

    const response = await NoteService.listByTenant(tenantId);

    if (hasError(response)) {
      state.error = resolveErrorMessage(response.error);
      state.isInitialLoading = false;
      state.isFetching = false;
      render();
      return;
    }

    state.notes = response.data?.notes || [];
    state.isInitialLoading = false;
    state.isFetching = false;
    state.error = null;
    render();
  }

  /*
   * Create new note
   */
  async function handleCreate() {
    await showNoteModal('Create Note', '', async (content: string) => {
      const payload: CreateNoteRequest = { content };
      const response = await NoteService.create(tenantId, payload);

      if (hasError(response)) {
        throw new Error(resolveErrorMessage(response.error));
      }

      await fetchNotes(true);
    });
  }

  /*
   * Edit existing note
   */
  async function handleEdit(note: Note) {
    await showNoteModal(`Edit Note`, note.content, async (content: string) => {
      const payload = { content };
      const response = await NoteService.update(note.id, payload);

      if (hasError(response)) {
        throw new Error(resolveErrorMessage(response.error));
      }

      await fetchNotes(true);
    });
  }

  /*
   * Delete note with confirmation
   */
  async function handleDelete(note: Note) {
    const confirmed = await showDeleteConfirmation(getTitleFromContent(note.content));

    if (!confirmed) return;

    const response = await NoteService.delete(note.id);

    if (hasError(response)) {
      const errorAlert = Alert(resolveErrorMessage(response.error), { type: 'error' });
      contentContainer.appendChild(errorAlert);
      return;
    }

    await fetchNotes(true);
  }

  /*

   * Event listeners
   */
  newNoteBtn.addEventListener('click', handleCreate);

  section.appendChild(contentContainer);

  // Initial fetch
  await fetchNotes();

  return section;
}
