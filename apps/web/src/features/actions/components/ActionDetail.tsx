'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, FileUp, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useAction, useActionMutations } from '../hooks/useActions';
import { PriorityBadge, StatusBadge, daysUntil } from './ActionBadges';

export function ActionDetail({ id }: { id: string }) {
  const actionQuery = useAction(id);
  const mutations = useActionMutations(id);
  const toast = useMutationToast();
  const [comment, setComment] = useState('');
  const [evidence, setEvidence] = useState({ fileName: '', mimeType: 'application/pdf', sizeBytes: 0, storageKey: '', description: '' });
  const [verificationNotes, setVerificationNotes] = useState('');
  const action = actionQuery.data;

  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
    } catch (error) {
      toast.error('Action request failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  if (actionQuery.isLoading) return <div className="psm-card p-5">Loading action...</div>;
  if (!action) return <div className="psm-card p-5 text-danger">Action not found.</div>;

  const dueDays = daysUntil(action.dueDate);

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2"><PriorityBadge priority={action.priority} /><StatusBadge status={action.status} /></div>
            <h1 className="text-2xl font-semibold">{action.actionNumber ?? action.id}</h1>
            <p className="mt-1 text-lg">{action.title}</p>
            <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{action.description}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-80">
            <a href="/actions" className="psm-button psm-button-secondary"><X size={16} /> Close View</a>
            <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.watch.mutateAsync(), 'Subscribed to updates')}><Eye size={16} /> Watch</button>
            <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.close.mutateAsync(undefined), 'Action closed')}><CheckCircle2 size={16} /> Close</button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="space-y-5">
          <Card title="Overview">
            <Info label="Source Module" value={action.moduleKey} />
            <Info label="Source Record" value={action.sourceId} />
            <Info label="Equipment" value={action.equipment ? `${action.equipment.tag} - ${action.equipment.name}` : 'Not linked'} />
            <Info label="Site" value={action.site ? `${action.site.name} (${action.site.code})` : 'Not assigned'} />
          </Card>

          <Card title="Comments">
            <form onSubmit={(event) => { event.preventDefault(); void run(async () => { await mutations.comment.mutateAsync(comment); setComment(''); }, 'Comment added'); }} className="mb-4 flex gap-2">
              <input className="psm-input flex-1 px-3" placeholder="Add progress update or comment..." value={comment} onChange={(event) => setComment(event.target.value)} />
              <button className="psm-button psm-button-primary"><MessageSquare size={16} /> Add</button>
            </form>
            <div className="space-y-3">
              {(action.comments ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                  <div className="flex justify-between gap-3 text-sm"><strong>{item.author?.displayName ?? item.authorId}</strong><span className="text-xs text-[var(--psm-muted)]">{new Date(item.createdAt).toLocaleString()}</span></div>
                  <p className="mt-2 text-sm text-[var(--psm-muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Evidence">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await mutations.evidence.mutateAsync({ ...evidence, sizeBytes: Number(evidence.sizeBytes), storageKey: evidence.storageKey || `actions/${id}/${evidence.fileName}` });
                  setEvidence({ fileName: '', mimeType: 'application/pdf', sizeBytes: 0, storageKey: '', description: '' });
                }, 'Evidence added');
              }}
              className="mb-4 grid gap-2 md:grid-cols-5"
            >
              <label className="psm-button psm-button-secondary cursor-pointer justify-center">
                <FileUp size={16} /> Pick File
                <input
                  className="hidden"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setEvidence({ fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size, storageKey: String(reader.result), description: evidence.description });
                    reader.readAsDataURL(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <input required className="psm-input px-3 text-sm md:col-span-2" placeholder="File name" value={evidence.fileName} onChange={(event) => setEvidence({ ...evidence, fileName: event.target.value })} />
              <input className="psm-input px-3 text-sm" placeholder="MIME type" value={evidence.mimeType} onChange={(event) => setEvidence({ ...evidence, mimeType: event.target.value })} />
              <input className="psm-input px-3 text-sm" type="number" placeholder="Size" value={evidence.sizeBytes} onChange={(event) => setEvidence({ ...evidence, sizeBytes: Number(event.target.value) })} />
              <button className="psm-button psm-button-secondary"><FileUp size={16} /> Add Evidence</button>
            </form>
            {evidence.storageKey.startsWith('data:image') ? <img src={evidence.storageKey} alt="Evidence preview" className="mb-4 max-h-64 rounded-lg border border-[var(--psm-line)] object-contain" /> : null}
            <div className="space-y-2">
              {(action.evidence ?? []).map((item) => (
                <div key={item.id} className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div><div className="font-semibold">{item.fileName}</div><div className="text-xs text-[var(--psm-muted)]">{item.uploadedBy?.displayName} · {new Date(item.uploadedAt).toLocaleString()}</div></div>
                    <span className="psm-badge psm-badge-muted">{item.status}</span>
                  </div>
                  {item.storageKey?.startsWith('data:image') ? <img src={item.storageKey} alt={item.fileName} className="mt-3 max-h-72 rounded-lg border border-[var(--psm-line)] object-contain" /> : null}
                  {item.storageKey?.startsWith('data:') ? <a className="mt-2 inline-block text-xs text-primary" href={item.storageKey} download={item.fileName}>Download evidence</a> : null}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-5">
          <Card title="Assignment">
            <Info label="Owner" value={action.owner?.displayName ?? action.assignedToId} />
            <Info label="Assigned By" value={action.creator?.displayName ?? action.createdById} />
            <Info label="Due Date" value={`${new Date(action.dueDate).toLocaleDateString()} (${dueDays < 0 ? `${Math.abs(dueDays)}d overdue` : `${dueDays}d left`})`} />
          </Card>

          <Card title="Verification">
            <div className="mb-3 flex flex-wrap gap-2">
              {action.evidenceRequired ? <span className="psm-badge psm-badge-warning">Evidence Required</span> : null}
              {action.verificationRequired ? <span className="psm-badge psm-badge-info">Verification Required</span> : null}
              {action.verifiedAt ? <span className="psm-badge psm-badge-success">Verified</span> : null}
            </div>
            <textarea className="psm-input mb-2 min-h-20 w-full p-3 text-sm" placeholder="Verification notes" value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} />
            <div className="grid gap-2">
              <button className="psm-button psm-button-primary" onClick={() => run(() => mutations.verify.mutateAsync({ decision: 'APPROVED', notes: verificationNotes }), 'Verification approved')}><ShieldCheck size={16} /> Approve</button>
              <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.verify.mutateAsync({ decision: 'REJECTED', notes: verificationNotes }), 'Verification rejected')}>Reject</button>
            </div>
          </Card>

          <Card title="History">
            <div className="space-y-3">
              {(action.history ?? []).map((item) => (
                <div key={item.id} className="border-l-2 border-primary pl-3 text-sm">
                  <div className="font-semibold">{item.event.replaceAll('_', ' ')}</div>
                  <div className="text-xs text-[var(--psm-muted)]">{item.actor?.displayName ?? 'System'} · {new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="psm-card p-5"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">{title}</h2>{children}</section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mb-3 rounded-lg bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
