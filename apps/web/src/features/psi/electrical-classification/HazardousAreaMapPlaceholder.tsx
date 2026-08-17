import { PsiCard } from '../shared/PsiUi';

export function HazardousAreaMapPlaceholder({ title = 'Hazardous Area Map / Extent View', message = 'Map coordinates and classified extents render when drawing/map geometry is available from Document Control or PSI drawings.' }: { title?: string; message?: string }) {
  return <PsiCard title={title}><div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-6 text-center text-sm text-[var(--psm-muted)]">{message}</div></PsiCard>;
}
