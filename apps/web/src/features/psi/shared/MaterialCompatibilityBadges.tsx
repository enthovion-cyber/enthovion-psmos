function badgeClass(tone: 'good' | 'warn' | 'danger' | 'info' | 'neutral') {
  const tones = {
    good: 'border-success/30 bg-success/10 text-success',
    warn: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    info: 'border-info/30 bg-info/10 text-info',
    neutral: 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
  };
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`;
}

function tone(value?: string | null): 'good' | 'warn' | 'danger' | 'info' | 'neutral' {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('incompatible') || text.includes('critical') || text.includes('blocker') || text.includes('overdue')) return 'danger';
  if (text.includes('condition') || text.includes('limited') || text.includes('warning') || text.includes('needs') || text.includes('missing') || text.includes('pending')) return 'warn';
  if (text.includes('compatible') || text.includes('complete') || text.includes('approved') || text.includes('ready')) return 'good';
  if (text.includes('moc') || text.includes('pssr') || text.includes('mi')) return 'info';
  return 'neutral';
}

export function CompatibilityRatingBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(tone(value))}>{value || 'Not Rated'}</span>;
}

export function MaterialFamilyBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value ? 'info' : 'neutral')}>{value || 'Material Missing'}</span>;
}

export function DegradationRiskBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(tone(value))}>{value || 'Risk Unknown'}</span>;
}

export function MaterialConflictBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(tone(value))}>{value || 'Not Checked'}</span>;
}

export function MaterialCompletenessBadge({ value, score }: { value?: string | null | undefined; score?: number | null | undefined }) {
  return <span className={badgeClass(tone(value))}>{value || 'Not Checked'}{score !== null && score !== undefined ? ` (${score}%)` : ''}</span>;
}

export function MiReadinessImpactBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={badgeClass(value ? 'warn' : 'good')}>{value ? 'MI Impact' : 'No MI Impact'}</span>;
}

export function PssrBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={badgeClass(value ? 'danger' : 'good')}>{value ? 'PSSR Blocker' : 'No PSSR Blocker'}</span>;
}

export function MocRequiredBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={badgeClass(value ? 'warn' : 'good')}>{value ? 'MOC Required' : 'No MOC Flag'}</span>;
}
