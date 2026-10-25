'use client';

import { Badge, DetailCard } from '../moc-detail-ui';

export function RiskLevelExplanation() {
  return (
    <DetailCard title="HAZOP Risk Level Classification Matrix">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Band
          tone="green"
          label="Low"
          range="0-2 Score"
          text="Standard discipline engineering review. Normal workflow routing without executive escalation."
        />
        <Band
          tone="amber"
          label="Medium"
          range="3-4 Score"
          text="Operations Manager sign-off required. Action Center itemization and detailed procedural verification."
        />
        <Band
          tone="red"
          label="High"
          range="5-7 Score"
          text="HSE Director & VP Operations approval path. Mandatory formal PHA/What-If revalidation and PSSR pre-startup gate."
        />
        <Band
          tone="purple"
          label="Critical"
          range="8-9 Score"
          text="Executive Management acceptance. Comprehensive HAZOP study, hard PSSR gate, regulatory notification, and 100% pre-startup closure."
        />
      </div>
    </DetailCard>
  );
}

function Band({
  tone,
  label,
  range,
  text
}: {
  tone: 'green' | 'amber' | 'red' | 'purple';
  label: string;
  range: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs transition-colors">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={tone}>{label}</Badge>
        <span className="font-mono text-[10px] font-bold text-[var(--psm-muted)]">{range}</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--psm-muted)]">{text}</p>
    </div>
  );
}
