export function badgeClass(tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info') {
  const tones = {
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    info: 'border-info/30 bg-info/10 text-info',
    neutral: 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
  };
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`;
}

export function labelValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
