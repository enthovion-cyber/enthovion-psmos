'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceRequests } from '../hooks/useRegulatoryEvidenceRequests';
import { useRegulatoryEvidenceMutations } from '../hooks/useRegulatoryEvidenceMutations';

export function RegulatoryEvidenceRequestPage({ mode = 'register', requestId }: { mode?: 'register' | 'new' | 'detail'; requestId?: string }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25 });
  const query = useRegulatoryEvidenceRequests(filters);
  if (mode === 'new') return <NewRequest />;
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const rows = requestId ? query.data?.rows.filter((row) => row.id === requestId) : query.data?.rows;
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title="Evidence Requests" subtitle="Requests for missing or replacement evidence, routed through the backend evidence request workflow." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/evidence/requests/new">New Request</RegulatoryButton>} /><RegulatoryCard title="Filters / Search"><input className={regulatoryInputClass()} placeholder="Search requests" value={String(filters.search ?? '')} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></RegulatoryCard>{rows?.length ? <RegulatoryCard title="Request Register"><div className="space-y-3">{rows.map((row) => <Link key={row.id} href={`/regulatory/evidence/requests/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><b>{row.request_code ?? row.id}</b><div>{row.request_title}</div><div className="text-sm text-[var(--psm-muted)]">{row.request_status} · due {row.due_date ? new Date(row.due_date).toLocaleDateString() : 'not set'}</div></Link>)}</div></RegulatoryCard> : <RegulatoryEmptyState title="No evidence requests" message="No evidence requests match this company/site scope." />}</div></RegulatoryLayout>;
}

function NewRequest() {
  const mutations = useRegulatoryEvidenceMutations();
  const [form, setForm] = useState<Record<string, unknown>>({ sourceType: 'Manual Requirement', requestStatus: 'Open' });
  const [message, setMessage] = useState<string | null>(null);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    const row = await mutations.createRequest.mutateAsync(form);
    setMessage(`Created request ${row.request_code ?? row.id}`);
  }
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title="New Evidence Request" subtitle="Create an evidence request linked to a requirement, regulatory item, obligation, assessment, or gap." action={<RegulatoryButton onClick={submit} disabled={mutations.createRequest.isPending}>{mutations.createRequest.isPending ? 'Saving...' : 'Save Request'}</RegulatoryButton>} />{message ? <RegulatoryCard><p className="text-sm text-[var(--psm-fg)]">{message}</p></RegulatoryCard> : null}<RegulatoryCard title="Request Details"><div className="grid gap-3 md:grid-cols-2"><Field label="Request title" value={form.requestTitle} onChange={(value) => update('requestTitle', value)} /><Field label="Evidence requirement ID" value={form.evidenceRequirementId} onChange={(value) => update('evidenceRequirementId', value)} /><Field label="Regulatory item ID" value={form.regulatoryItemId} onChange={(value) => update('regulatoryItemId', value)} /><Field label="Obligation ID" value={form.obligationId} onChange={(value) => update('obligationId', value)} /><Field label="Requested from user ID" value={form.requestedFromUserId} onChange={(value) => update('requestedFromUserId', value)} /><Field label="Due date" type="datetime-local" value={form.dueDate} onChange={(value) => update('dueDate', value)} /><Field label="Priority" value={form.priority} onChange={(value) => update('priority', value)} /><Field label="Message" value={form.requestMessage} onChange={(value) => update('requestMessage', value)} /></div></RegulatoryCard></div></RegulatoryLayout>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: unknown; onChange: (value: string) => void; type?: string | undefined }) {
  return <RegulatoryField label={label}><input className={regulatoryInputClass()} type={type} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></RegulatoryField>;
}
