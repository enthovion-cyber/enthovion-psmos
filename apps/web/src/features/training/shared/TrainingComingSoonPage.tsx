import { TrainingButton, TrainingCard } from './TrainingUi';

export function TrainingComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Training & Competency</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">Safe placeholder for a future Training phase. This page is permission-aware through backend navigation and does not show fake data.</p></div>
      <TrainingCard title="Coming in next phase" subtitle="The Phase 1 foundation is ready to receive data from this future module.">
        <p className="text-sm text-[var(--psm-muted)]">No mock training records, certificates, assessments, SOP acknowledgements, MOC/PSSR requirements, PTW authorizations, reports, or approval records are generated here.</p>
        <div className="mt-4 flex gap-2"><TrainingButton href="/training-competency/dashboard" variant="secondary">Dashboard</TrainingButton><TrainingButton href="/training-competency/workforce" variant="secondary">Workforce</TrainingButton></div>
      </TrainingCard>
    </div>
  );
}
