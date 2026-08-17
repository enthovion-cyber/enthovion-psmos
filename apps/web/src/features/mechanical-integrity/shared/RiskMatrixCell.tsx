import { RiskScoreBadge } from './RiskScoreBadge';

export function RiskMatrixCell({ consequence, likelihood, score }: { consequence?: number | null | undefined; likelihood?: number | null | undefined; score?: number | null | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm">
      <div className="text-muted-foreground">Risk Matrix Cell</div>
      <div className="mt-1 flex items-center gap-2 font-semibold">
        <span>C{consequence ?? '-'}</span>
        <span>x</span>
        <span>L{likelihood ?? '-'}</span>
        <RiskScoreBadge value={score} />
      </div>
    </div>
  );
}
