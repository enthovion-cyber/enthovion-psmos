'use client';
export function IncidentDraftSaveStatus({ draft, saving, error }: { draft?: any; saving?: boolean; error?: string | null }) {
  return <div className="text-xs text-slate-500 dark:text-slate-400">{saving ? 'Saving draft...' : error ? `Draft save failed: ${error}` : draft ? `Draft saved ${new Date(draft.last_saved_at ?? draft.updated_at).toLocaleString()}` : 'No draft saved yet'}</div>;
}
