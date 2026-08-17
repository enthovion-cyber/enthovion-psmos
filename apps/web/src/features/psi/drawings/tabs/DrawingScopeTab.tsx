import { PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingScopeTab({ detail }: { detail: DrawingDetail }) {
  const scope = detail.scope ?? {};
  const items = ['company_id', 'site_id', 'unit_id', 'department_id', 'area_id', 'building_location', 'battery_limits', 'system_service', 'related_process_step', 'related_operating_mode', 'upstream_unit_id', 'downstream_unit_id', 'notes'];
  return <PsiCard title="Drawing Scope" subtitle="Company/site/unit/area, battery limits, affected utilities, upstream/downstream units, and cross-unit scope."><div className="grid gap-3 md:grid-cols-3">{items.map((key) => <div key={key} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</p><p className="font-medium">{String((scope as Record<string, unknown>)[key] ?? (detail.drawing as unknown as Record<string, unknown>)[key] ?? '-')}</p></div>)}</div></PsiCard>;
}
