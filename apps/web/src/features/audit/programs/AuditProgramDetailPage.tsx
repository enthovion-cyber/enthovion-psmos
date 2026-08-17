'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuditLayout } from '../AuditLayout';
import { AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { useAuditProgramDetail } from '../hooks/useAuditProgramDetail';
import { AuditProgramDetailHeader } from './AuditProgramDetailHeader';
import { ProgramOverviewTab } from './tabs/ProgramOverviewTab';
import { ProgramScopeTab } from './tabs/ProgramScopeTab';
import { ProgramStandardsTab } from './tabs/ProgramStandardsTab';
import { ProgramModulesTab } from './tabs/ProgramModulesTab';
import { ProgramFrequencyTab } from './tabs/ProgramFrequencyTab';
import { ProgramOwnershipTab } from './tabs/ProgramOwnershipTab';
import { ProgramIntegrationTab } from './tabs/ProgramIntegrationTab';
import { ProgramHistoryTab } from './tabs/ProgramHistoryTab';

export function AuditProgramDetailPage({ programId, tab = 'overview' }: { programId: string; tab?: string }) {
  const query = useAuditProgramDetail(programId);
  const pathname = usePathname();
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError || !query.data) return <AuditLayout><AuditErrorState message={query.error ?? 'Program not found'} onRetry={() => query.refetch()} /></AuditLayout>;
  const detail = query.data;
  return <AuditLayout><div className="space-y-5"><AuditProgramDetailHeader detail={detail} /><div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{[['overview','Overview'],['scope','Scope'],['standards','Standards / Regulations'],['modules','Modules Covered'],['frequency','Frequency / Review Cycle'],['ownership','Ownership / Governance'],['settings','Integration Settings'],['plans','Future Audit Plans'],['findings','Future Findings'],['history','History']].map(([key, label]) => <Link key={key} href={`/audit-compliance/programs/${programId}/${key === 'overview' ? '' : key}`.replace(/\/$/, '')} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${pathname.endsWith(String(key)) || tab === key ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{label}</Link>)}</div>{tab === 'scope' ? <ProgramScopeTab detail={detail} /> : tab === 'standards' ? <ProgramStandardsTab detail={detail} /> : tab === 'modules' ? <ProgramModulesTab detail={detail} /> : tab === 'frequency' ? <ProgramFrequencyTab detail={detail} /> : tab === 'ownership' ? <ProgramOwnershipTab detail={detail} /> : tab === 'settings' ? <ProgramIntegrationTab detail={detail} /> : tab === 'history' ? <ProgramHistoryTab detail={detail} /> : tab === 'plans' || tab === 'findings' ? <ProgramFuturePlaceholder tab={tab} /> : <ProgramOverviewTab detail={detail} />}</div></AuditLayout>;
}

function ProgramFuturePlaceholder({ tab }: { tab: string }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-8 text-center"><h2 className="text-lg font-semibold">{tab === 'plans' ? 'Future Audit Plans placeholder' : 'Future Findings placeholder'}</h2><p className="mt-2 text-sm text-[var(--psm-muted)]">This phase is not implemented yet. No fake data is shown.</p></div>;
}
