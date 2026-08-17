import { AsBuiltStatusBadge } from '../shared/AsBuiltStatusBadge';
import { RedlineStatusBadge } from '../shared/RedlineStatusBadge';
import { PsiCard } from '../shared/PsiUi';
import type { DrawingMocRedline } from '../types/drawing.types';

export function MocRedlinePanel({ value }: { value?: DrawingMocRedline | null }) {
  return (
    <PsiCard title="MOC / Redline Status" subtitle="MOC drawing update status, redline control, as-built status, field walkdown, and PSSR blocker context.">
      {!value ? <p className="text-sm text-[var(--psm-muted)]">No MOC/redline/as-built status has been recorded.</p> : <div className="grid gap-3 md:grid-cols-3"><div><p className="text-xs text-[var(--psm-muted)]">Redline</p><RedlineStatusBadge value={value.redline_status ?? null} /></div><div><p className="text-xs text-[var(--psm-muted)]">MOC update</p><p className="font-semibold">{value.moc_update_status ?? 'Not Required'}</p></div><div><p className="text-xs text-[var(--psm-muted)]">As-built</p><AsBuiltStatusBadge verified={value.as_built_verified} required={value.as_built_required} /></div><div><p className="text-xs text-[var(--psm-muted)]">Linked MOC</p><p>{value.linked_moc_id ?? '-'}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Field walkdown</p><p>{value.field_walkdown_status ?? '-'}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Comments</p><p>{value.comments ?? '-'}</p></div></div>}
    </PsiCard>
  );
}
