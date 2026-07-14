'use client';

import { Download, Eye, FileText, GitBranch, Plus, ShieldCheck } from 'lucide-react';
import { hazopOverviewService } from '../../services/hazop-overview.service';

const icons: Record<string, any> = { edit: FileText, risk: ShieldCheck, recommendation: Plus, signoff: GitBranch, history: Eye, export: Download };

export function HazopQuickActions({ studyId, actions, onNavigate }: { studyId: string; actions: any[]; onNavigate: (tab?: string) => void }) {
  const exportOverview = async () => {
    const file = await hazopOverviewService.export(studyId);
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName ?? 'hazop-overview.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">Quick Actions</h3>
      <div className="grid gap-2">
        {(actions ?? []).map((action) => {
          const Icon = icons[action.key] ?? FileText;
          const run = action.key === 'export' ? exportOverview : () => onNavigate(action.tab);
          return (
            <button key={action.key} disabled={!action.enabled} onClick={run} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[var(--psm-surface-2)]">
              <span><Icon size={15} className="mr-2 inline" />{action.label}</span>
              <span className="text-xs text-[var(--psm-muted)]">{action.enabled ? 'Available' : 'Locked'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
