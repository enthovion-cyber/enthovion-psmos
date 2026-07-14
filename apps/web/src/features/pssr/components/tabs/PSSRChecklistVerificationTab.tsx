'use client';

import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, PSSRCard } from '../pssr-ui';
import { ChecklistBlockersPanel } from '../checklist/ChecklistBlockersPanel';
import { ChecklistEvidenceUploadPanel } from '../checklist/ChecklistEvidenceUploadPanel';
import { ChecklistGenerateControls } from '../checklist/ChecklistGenerateControls';
import { ChecklistGroupTabs } from '../checklist/ChecklistGroupTabs';
import { ChecklistItemDetailDrawer } from '../checklist/ChecklistItemDetailDrawer';
import { ChecklistItemsTable } from '../checklist/ChecklistItemsTable';
import { ChecklistSummaryCard } from '../checklist/ChecklistSummaryCard';
import { ChecklistVerificationPanel } from '../checklist/ChecklistVerificationPanel';
import { usePSSRChecklist } from '../../hooks/usePSSRChecklist';
import { usePSSRChecklistMutations } from '../../hooks/usePSSRChecklistMutations';
import { usePSSRAutoVerification, usePSSRPhase1Mutations } from '../../hooks/usePSSRPhase1';
import { AutoVerificationLinksPanel } from '../auto-verification/AutoVerificationLinksPanel';

export function PSSRChecklistVerificationTab({ pssr }: { pssr: any }) {
  const query = usePSSRChecklist(pssr.id);
  const mutations = usePSSRChecklistMutations(pssr.id);
  const phase1 = usePSSRPhase1Mutations(pssr.id);
  const autoVerification = usePSSRAutoVerification(pssr.id);
  const [activeGroup, setActiveGroup] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const data = query.data;
  const groups = useMemo(() => {
    const items = data?.items ?? pssr.checklist ?? [];
    return items.reduce((acc: Record<string, any[]>, item: any) => {
      const key = item.group_name ?? 'Other';
      acc[key] = [...(acc[key] ?? []), item];
      return acc;
    }, {});
  }, [data?.items, pssr.checklist]);
  const groupNames = Object.keys(groups);
  const currentGroup = activeGroup || groupNames[0] || '';
  const items = currentGroup ? groups[currentGroup] ?? [] : [];

  function evidenceFor(item: any) {
    const fileName = window.prompt('Evidence file name or Document Control reference');
    if (!fileName) return;
    const note = window.prompt('Evidence note') ?? '';
    mutations.evidence.mutate({ itemId: item.id, values: { evidenceType: 'File', fileName, note } });
  }

  function failItem(item: any) {
    const reason = window.prompt('Reason this checklist item failed');
    if (reason) mutations.fail.mutate({ itemId: item.id, reason });
  }

  function verifyItem(item: any) {
    const comment = window.prompt('Verification comment') ?? '';
    mutations.verify.mutate({ itemId: item.id, comment });
  }

  function manualItem() {
    const title = window.prompt('Manual checklist item title');
    if (title) mutations.addItem.mutate({ title, groupName: currentGroup || 'Other', required: true, requiredBeforeStartup: true, verificationRequired: true });
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load PSSR checklist from API." />;
  if (!groupNames.length) {
    return (
      <div className="space-y-4">
        <ChecklistGenerateControls onGenerate={() => mutations.generate.mutate()} onRegenerate={() => mutations.regenerate.mutate()} onManualItem={manualItem} busy={mutations.generate.isPending || mutations.regenerate.isPending} />
        <PSSRCard title="Checklist & Verification"><EmptyState title="No checklist generated yet. Generate checklist from PSSR context." /></PSSRCard>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <ChecklistSummaryCard summary={data?.summary} />
      <ChecklistGenerateControls onGenerate={() => mutations.generate.mutate()} onRegenerate={() => mutations.regenerate.mutate()} onManualItem={manualItem} busy={mutations.generate.isPending || mutations.regenerate.isPending} />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => phase1.generateHazardItems.mutate()} className="rounded-md border border-cyan-300/15 px-3 py-2 text-xs font-black text-slate-200 hover:border-amber-300/40">Generate Hazard-Specific Items</button>
      </div>
      <ChecklistGroupTabs groups={groups} active={currentGroup} onChange={setActiveGroup} />
      <ChecklistItemsTable items={items} onSelect={setSelected} onComplete={(item) => mutations.complete.mutate(item.id)} onEvidence={evidenceFor} onVerify={verifyItem} onFail={failItem} />
      <div className="grid gap-4 xl:grid-cols-3">
        <ChecklistEvidenceUploadPanel evidence={data?.evidence ?? []} onQuickEvidence={() => items[0] && evidenceFor(items[0])} />
        <ChecklistVerificationPanel verifications={data?.verifications ?? []} />
        <ChecklistBlockersPanel blockers={data?.blockers ?? []} />
      </div>
      <AutoVerificationLinksPanel links={autoVerification.data ?? []} onSync={() => phase1.syncAutoVerifications.mutate()} busy={phase1.syncAutoVerifications.isPending} />
      <ChecklistItemDetailDrawer item={selected} evidence={data?.evidence ?? []} history={data?.history ?? []} onClose={() => setSelected(null)} />
    </div>
  );
}
