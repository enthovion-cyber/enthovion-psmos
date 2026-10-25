'use client';

import { PermitDetail } from './PermitDetail';
import { PermitHeader } from './PermitHeader';
import { PermitRightPanel } from './PermitRightPanel';
import { PermitSidebarList } from './PermitSidebarList';
import { usePermit } from '../hooks/usePtw';

type PermitDetailTab = 'Details' | 'Isolation' | 'Gas Test' | 'Workforce' | 'Shift Handover' | 'Conflicts' | 'Signatures' | 'History' | 'Attachments' | 'Closure';

export function PermitDetailPage({ id, initialTab }: { id: string; initialTab?: PermitDetailTab }) {
  const permit = usePermit(id);

  return (
    <div className="space-y-3">
      {permit.data ? (
        <PermitHeader permit={permit.data} />
      ) : permit.isLoading ? (
        <div className="h-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1829] p-5 animate-pulse shadow-xs" />
      ) : null}

      <div className="grid gap-3 lg:gap-3.5 xl:grid-cols-[230px_minmax(0,1fr)_270px] 2xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <div className="hidden xl:block">
          <PermitSidebarList selectedId={id} />
        </div>
        <main className="min-w-0">
          {initialTab ? (
            <PermitDetail id={id} initialTab={initialTab} hideHeader />
          ) : (
            <PermitDetail id={id} hideHeader />
          )}
        </main>
        <div className="hidden xl:block">
          {permit.data ? <PermitRightPanel permit={permit.data} /> : <PermitRightPanel />}
        </div>
      </div>
    </div>
  );
}
