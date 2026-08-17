function badgeClass(tone: 'neutral' | 'good' | 'warn' | 'danger' | 'info') {
  return `inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${tone === 'danger' ? 'border-danger/30 bg-danger/10 text-danger' : tone === 'warn' ? 'border-warning/30 bg-warning/10 text-warning' : tone === 'good' ? 'border-success/30 bg-success/10 text-success' : tone === 'info' ? 'border-info/30 bg-info/10 text-info' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`;
}

export function SafeguardTypeBadge({ value }: { value?: string | null | undefined }) {
  const instrumented = ['SIF / SIS', 'Interlock', 'Critical alarm', 'Alarm with operator response', 'Basic process control system'].includes(String(value));
  const mechanical = ['PSV / PRV / rupture disk', 'Relief / vent / flare system', 'Mechanical design margin'].includes(String(value));
  return <span className={badgeClass(instrumented ? 'info' : mechanical ? 'good' : 'neutral')}>{value || 'Type missing'}</span>;
}
export function SafeguardCategoryBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value === 'Prevention' ? 'good' : value === 'Emergency response' ? 'danger' : value === 'Mitigation' ? 'warn' : 'neutral')}>{value || 'Category missing'}</span>;
}
export function SafeguardCriticalityBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value === 'Critical' ? 'danger' : value === 'High' ? 'warn' : value === 'Low' ? 'good' : 'neutral')}>{value || 'Criticality missing'}</span>;
}
export function SafeguardEffectivenessBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value === 'Effective' ? 'good' : value === 'Not Effective' || value === 'Not Creditable' ? 'danger' : value === 'Unknown / Needs Review' ? 'warn' : 'neutral')}>{value || 'Unknown / Needs Review'}</span>;
}
export function SafeguardSourceStatusBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(String(value).includes('Failed') || String(value).includes('Missing') ? 'danger' : value ? 'good' : 'warn')}>{value || 'Not checked'}</span>;
}
export function SafeguardTestingStatusBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value === 'Current' || value === 'Not Required' ? 'good' : ['Overdue', 'Failed', 'Out of Service'].includes(String(value)) ? 'danger' : ['Due Soon', 'Unknown', 'Source Module Required'].includes(String(value)) ? 'warn' : 'neutral')}>{value || 'Unknown'}</span>;
}
export function SafeguardImpairmentBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(['Bypassed', 'Impaired', 'Out of Service'].includes(String(value)) ? 'danger' : value ? 'good' : 'neutral')}>{value || 'No active impairment returned'}</span>;
}
export function IplQualificationBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(String(value).startsWith('Qualified') ? 'good' : value === 'Needs LOPA Review' || value === 'Candidate' ? 'warn' : value === 'Not Qualified' ? 'danger' : 'neutral')}>{value || 'Not IPL'}</span>;
}
export function SafeguardConflictBadge({ value }: { value?: string | null | undefined }) {
  return <span className={badgeClass(value === 'No Conflict' ? 'good' : value === 'Critical Conflict' ? 'danger' : value === 'Major Conflict' || value === 'Warning' ? 'warn' : value === 'Override Approved' ? 'info' : 'neutral')}>{value || 'Not Checked'}</span>;
}
export function SafeguardCompletenessBadge({ value, score }: { value?: string | null | undefined; score?: number | null | undefined }) {
  return <span className={badgeClass(value === 'Complete' ? 'good' : value === 'Critical Gaps' ? 'danger' : value === 'Mostly Complete' ? 'warn' : 'neutral')}>{value || 'Not Reviewed'}{score !== null && score !== undefined ? ` (${score}%)` : ''}</span>;
}
export function MiReadinessImpactBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={badgeClass(value ? 'warn' : 'good')}>MI impact: {value ? 'Yes' : 'No'}</span>;
}
export function PssrBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={badgeClass(value ? 'danger' : 'good')}>PSSR blocker: {value ? 'Yes' : 'No'}</span>;
}
export function MocRequiredBadge({ value }: { value?: boolean | null | undefined }) {
  return <span className={badgeClass(value ? 'warn' : 'good')}>MOC required: {value ? 'Yes' : 'No'}</span>;
}
