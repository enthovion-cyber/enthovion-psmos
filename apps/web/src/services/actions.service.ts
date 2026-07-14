import { api } from './api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFETY_CRITICAL';
export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED' | 'CANCELLED';

export type ActionRecord = {
  id: string;
  actionNumber?: string | null;
  title: string;
  description: string;
  moduleKey: string;
  sourceType: string;
  sourceId: string;
  equipmentId?: string | null;
  siteId?: string | null;
  departmentId?: string | null;
  priority: ActionPriority;
  status: ActionStatus;
  assignedToId: string;
  createdById: string;
  dueDate: string;
  assignedDate?: string | null;
  closedAt?: string | null;
  evidenceRequired: boolean;
  verificationRequired: boolean;
  verifiedById?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; displayName: string; email: string; title?: string | null };
  creator?: { id: string; displayName: string; email: string };
  verifier?: { id: string; displayName: string; email: string };
  equipment?: { id: string; tag: string; name: string } | null;
  site?: { id: string; name: string; code: string } | null;
  comments?: ActionComment[];
  evidence?: ActionEvidence[];
  verifications?: ActionVerification[];
  watchers?: Array<{ id: string; user?: { id: string; displayName: string } }>;
  history?: ActionHistory[];
};

export type ActionComment = {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
  editedAt?: string | null;
  author?: { id: string; displayName: string; email: string };
};

export type ActionEvidence = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  description?: string | null;
  status: string;
  uploadedAt: string;
  uploadedBy?: { id: string; displayName: string; email: string };
};

export type ActionVerification = {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  notes?: string | null;
  verifiedAt: string;
  verifiedBy?: { id: string; displayName: string; email: string };
};

export type ActionHistory = {
  id: string;
  event: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
  actor?: { id: string; displayName: string; email: string };
};

export type CreateActionInput = {
  title: string;
  description: string;
  sourceModule: string;
  sourceRecordId: string;
  sourceType?: string;
  equipmentId?: string;
  siteId?: string;
  departmentId?: string;
  ownerId: string;
  priority: ActionPriority;
  dueDate: string;
  evidenceRequired?: boolean;
  verificationRequired?: boolean;
};

export const actionsService = {
  async list(params?: Record<string, string>): Promise<ActionRecord[]> {
    return unwrap(await api.get('/actions', { params }));
  },
  async get(id: string): Promise<ActionRecord> {
    return unwrap(await api.get(`/actions/${id}`));
  },
  async dashboard(): Promise<{ totals: Record<string, number>; byPriority: Record<string, number>; byModule: Record<string, number>; byDepartment: Record<string, number> }> {
    return unwrap(await api.get('/actions/dashboard'));
  },
  async aging(): Promise<Record<string, number>> {
    return unwrap(await api.get('/actions/aging-summary'));
  },
  async create(input: CreateActionInput): Promise<ActionRecord> {
    return unwrap(await api.post('/actions', input));
  },
  async update(id: string, input: Partial<CreateActionInput>): Promise<ActionRecord> {
    return unwrap(await api.patch(`/actions/${id}`, input));
  },
  async transition(id: string, status: ActionStatus): Promise<ActionRecord> {
    if (status === 'CLOSED') return unwrap(await api.post(`/actions/${id}/close`, {}));
    if (status === 'IN_PROGRESS') return unwrap(await api.post(`/actions/${id}/reopen`));
    if (status === 'CANCELLED') return unwrap(await api.delete(`/actions/${id}`));
    return unwrap(await api.patch(`/actions/${id}`, { status }));
  },
  async close(id: string, notes?: string): Promise<ActionRecord> {
    return unwrap(await api.post(`/actions/${id}/close`, { notes }));
  },
  async addComment(id: string, body: string): Promise<ActionComment> {
    return unwrap(await api.post(`/actions/${id}/comment`, { body }));
  },
  async addEvidence(id: string, input: { fileName: string; mimeType: string; sizeBytes: number; storageKey: string; description?: string }): Promise<ActionEvidence> {
    return unwrap(await api.post(`/actions/${id}/evidence`, input));
  },
  async deleteEvidence(evidenceId: string): Promise<{ deleted: boolean }> {
    return unwrap(await api.delete(`/actions/evidence/${evidenceId}`));
  },
  async verify(id: string, input: { decision: 'APPROVED' | 'REJECTED'; notes?: string }): Promise<ActionRecord> {
    return unwrap(await api.post(`/actions/${id}/verify`, input));
  },
  async watch(id: string) {
    return unwrap(await api.post(`/actions/${id}/watch`));
  }
};
