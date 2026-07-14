import { OverviewEmptyState } from './OverviewEmptyState';
import { OverviewPanelShell } from './OverviewPanelShell';
export function QuickLinksNavigationPanel({ links = [] }: { links?: any[] }) {
  return <OverviewPanelShell title="Quick Links / Navigation Panel" subtitle="Jump to the relevant investigation section."><div className="grid gap-2 sm:grid-cols-2">{links.length ? links.map((link) => <button key={link.key} type="button" onClick={() => selectIncidentTab(link.href, link.key)} className={`rounded-lg border p-2 text-left text-xs font-bold hover:border-blue-400 dark:border-cyan-300/10 ${link.blocker ? 'border-amber-400/30 bg-amber-500/10' : 'border-slate-200'}`}>{link.label}</button>) : <OverviewEmptyState message="No quick links returned by backend."/>}</div></OverviewPanelShell>;
}

function selectIncidentTab(href?: string, fallbackKey?: string) {
  if (typeof window === 'undefined') return;
  const tabKey = tabKeyFromHref(href) ?? fallbackKey;
  if (!tabKey) return;
  window.dispatchEvent(new CustomEvent('incident:select-tab', { detail: { tabKey } }));
}

function tabKeyFromHref(href?: string) {
  if (!href) return undefined;
  try {
    return new URL(href, window.location.href).searchParams.get('tab') ?? undefined;
  } catch {
    return undefined;
  }
}
