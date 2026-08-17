import { SectionCard } from '../safeguards/SafeguardUiPrimitives';
import type { MiLinkedRecord } from '../types/linked-record.types';

export function RelationshipGraphPanel({ rows }: { rows?: MiLinkedRecord[] }) {
  const modules = Array.from(new Set((rows ?? []).flatMap((row) => [row.source_module, row.target_module]).filter(Boolean)));
  return <SectionCard title="Relationship Map Panel" description="Foundation graph of connected source and target modules."><div className="flex flex-wrap gap-2">{modules.length ? modules.map((module) => <span key={module} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold">{module}</span>) : <p className="text-sm text-[var(--psm-muted)]">No relationship graph available until links are created.</p>}</div></SectionCard>;
}
