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
    <div className="space-y-4">
      {permit.data ? <PermitHeader permit={permit.data} /> : null}
      <div className="grid gap-4 2xl:grid-cols-[300px_minmax(0,1fr)_330px]">
        <div className="hidden 2xl:block">
          <PermitSidebarList selectedId={id} />
        </div>
        <main className="min-w-0">
          {initialTab ? <PermitDetail id={id} initialTab={initialTab} hideHeader /> : <PermitDetail id={id} hideHeader />}
        </main>
        <div className="hidden xl:block">
          {permit.data ? <PermitRightPanel permit={permit.data} /> : <PermitRightPanel />}
        </div>
      </div>
    </div>
  );
}
