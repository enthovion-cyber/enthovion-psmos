import { TrainingCard } from '../shared/TrainingUi';

export function TrainingEvidenceDrilldown({ evidence }: { evidence?: Record<string, any> }) {
  return <TrainingCard title="Evidence Drilldown" subtitle="Completion evidence is pulled from real records when future Training Records, Certifications, Assessments, SOP acknowledgements, and Document Control adapters provide it."><div className="rounded-lg border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">{evidence?.summary ?? 'No evidence found. This is intentionally not marked complete.'}</div></TrainingCard>;
}
