export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const statusToneClasses: Record<StatusTone, string> = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  info: 'bg-info/15 text-info border-info/30',
  neutral: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
};
