import type { FoundationInput } from '@/services/foundation.service';

export function CompanyWorkspaceStep({ draft, setDraft }: { draft: FoundationInput; setDraft: (draft: FoundationInput) => void }) {
  return <Step title="Company Workspace Creation" fields={[['Company name', 'name'], ['Company code / workspace slug', 'code'], ['Industry', 'industry'], ['Country', 'country'], ['Timezone', 'timezone'], ['Primary contact name', 'displayName'], ['Primary contact email', 'domainOwnerEmail']]} draft={draft} setDraft={setDraft} />;
}

export function Step({ title, fields, draft, setDraft }: { title: string; fields: Array<[string, string]>; draft: FoundationInput; setDraft: (draft: FoundationInput) => void }) {
  return (
    <section className="psm-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fields.map(([label, key]) => <label key={key} className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{label}</span><input className="psm-input h-10 w-full px-3" value={String((draft as any)[key] ?? '')} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
      </div>
    </section>
  );
}
