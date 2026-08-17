import { MissingDataList, SectionCard } from '../safeguards/SafeguardUiPrimitives';

export function ImpairmentReadinessPanel({ readiness }: { readiness?: { status: string; blockers: string[]; warnings: string[] } }) {
  return (
    <SectionCard title="Readiness / Blockers" description="Backend-generated close, startup, mitigation, link, and workflow blockers.">
      <div className="grid gap-4 md:grid-cols-2">
        <div><p className="mb-2 text-sm font-semibold">Blockers</p><MissingDataList items={readiness?.blockers} /></div>
        <div><p className="mb-2 text-sm font-semibold">Warnings</p><MissingDataList items={readiness?.warnings} /></div>
      </div>
    </SectionCard>
  );
}
