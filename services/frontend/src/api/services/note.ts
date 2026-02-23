/* src/api/services/note.ts */
import { api } from '../client';
/* Import type only to satisfy verbatimModuleSyntax */
import type { ApiResponse } from '../contracts/base';
import type {
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteResponse,
  ListTenantNotesResponse,
} from '../contracts/note';

export const NoteService = {
  /*
   * Fetch all notes for a specific tenant
   * Ordered by created_at descending (newest first)
   * Excludes soft-deleted notes by default
   */
  listByTenant: async (tenantId: string): Promise<ApiResponse<ListTenantNotesResponse>> => {
    return await api.get<ListTenantNotesResponse>(`/tenants/${tenantId}/notes`);
  },

  /*
   * Create new note in a tenant
   * Caller becomes owner automatically
   * Returns full Note object with generated ID
   */
  create: async (tenantId: string, payload: CreateNoteRequest): Promise<ApiResponse<CreateNoteResponse>> => {
    return await api.post<CreateNoteResponse>(`/tenants/${tenantId}/notes`, payload);
  },

  /*
   * Update note content by ID
   * Only owner can update
   * Returns updated Note object
   */
  update: async (noteId: string, payload: UpdateNoteRequest): Promise<ApiResponse<UpdateNoteResponse>> => {
    return await api.patch<UpdateNoteResponse>(`/notes/${noteId}`, payload);
  },

  /*
   * Soft-delete note by ID
   * Only owner can delete
   * Sets deleted_at timestamp and deleted_by user ID
   */
  delete: async (noteId: string): Promise<ApiResponse<DeleteNoteResponse>> => {
    return await api.delete<DeleteNoteResponse>(`/notes/${noteId}`);
  },
};
