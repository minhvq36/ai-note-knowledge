/*
 * Note Data Contracts
 */

export interface Note {
  readonly id: string;
  readonly tenant_id: string;
  readonly owner_id: string;
  readonly content: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
  readonly deleted_by: string | null;
}

export interface CreateNoteRequest {
  content: string;
}

export interface CreateNoteResponse {
  id: string;
  tenant_id: string;
  owner_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateNoteRequest {
  content: string;
}

export interface UpdateNoteResponse {
  id: string;
  tenant_id: string;
  owner_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DeleteNoteResponse {
  id: string;
  deleted_at: string;
  deleted_by: string;
}

export interface ListTenantNotesResponse {
  readonly notes: Note[];
  readonly total: number;
}
