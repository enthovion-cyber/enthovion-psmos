import type { PTWMapPermitItem } from '../../services/ptw-map.service';

export function riskTone(risk?: string | null) {
  const value = (risk ?? '').toLowerCase();
  if (value.includes('critical')) return 'border-red-300 bg-red-500 text-white shadow-red-500/40';
  if (value.includes('high')) return 'border-orange-300 bg-orange-500 text-white shadow-orange-500/35';
  if (value.includes('medium')) return 'border-amber-300 bg-amber-400 text-slate-950 shadow-amber-400/30';
  if (value.includes('low')) return 'border-emerald-300 bg-emerald-500 text-white shadow-emerald-500/30';
  return 'border-blue-300 bg-blue-500 text-white shadow-blue-500/30';
}

export function statusTone(status?: string | null) {
  const value = (status ?? '').toLowerCase();
  if (value.includes('active')) return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  if (value.includes('suspend')) return 'border-purple-400/30 bg-purple-500/10 text-purple-200';
  if (value.includes('close')) return 'border-slate-400/25 bg-slate-500/10 text-slate-300';
  if (value.includes('draft')) return 'border-slate-400/25 bg-slate-500/10 text-slate-300';
  if (value.includes('expire')) return 'border-red-400/35 bg-red-500/10 text-red-200';
  return 'border-amber-400/35 bg-amber-500/10 text-amber-200';
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function markerTitle(permit: PTWMapPermitItem) {
  return `${permit.permit_number} - ${permit.permit_title || permit.equipment_tag || 'Permit'}`;
}
