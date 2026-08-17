'use client';

export function ReviewSubmitSection({ validation, saving, onSubmit }: { validation?: { blockers: string[]; warnings: string[] } | undefined; saving?: boolean | undefined; onSubmit: () => void }) {
  const blocked = !!validation?.blockers?.length;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Review / Submit</h2>
      <div className="mt-3 space-y-2 text-sm">
        {validation?.blockers?.map((item) => <div key={item} className="rounded-md border border-danger/30 bg-danger/10 p-2 text-danger">{item}</div>)}
        {validation?.warnings?.map((item) => <div key={item} className="rounded-md border border-warning/30 bg-warning/10 p-2 text-warning">{item}</div>)}
        {!blocked ? <div className="rounded-md border border-success/30 bg-success/10 p-2 text-success">Assessment is ready for review.</div> : null}
      </div>
      <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={blocked || saving} title={blocked ? validation?.blockers.join(' ') : undefined} onClick={onSubmit}>{saving ? 'Submitting...' : 'Submit for Review'}</button>
    </section>
  );
}
