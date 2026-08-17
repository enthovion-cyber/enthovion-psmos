'use client';

import { useState } from 'react';
import { useEquipmentLinkedRecords } from '../../hooks/useLinkedRecords';
import { useLinkedRecordMutations } from '../../hooks/useLinkedRecordMutations';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { AddLinkedRecordDialog } from '../../linked-records/AddLinkedRecordDialog';
import { LinkedRecordsMobileCards } from '../../linked-records/LinkedRecordsMobileCards';
import { LinkedRecordsSummaryCards } from '../../linked-records/LinkedRecordsSummaryCards';
import { LinkedRecordsTable } from '../../linked-records/LinkedRecordsTable';
import { LinkedRecordTimeline } from '../../linked-records/LinkedRecordTimeline';
import { RelationshipGraphPanel } from '../../linked-records/RelationshipGraphPanel';
import { PrimaryButton, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function LinkedRecordsTab({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentLinkedRecords(equipmentId);
  const mutations = useLinkedRecordMutations();
  const [dialog, setDialog] = useState(false);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load equipment linked records.</div>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-5"><SectionCard title="Equipment Link Summary" actions={<PrimaryButton onClick={() => setDialog(true)}>Add Link</PrimaryButton>}><LinkedRecordsSummaryCards summary={query.data?.summary} /></SectionCard><div className="grid gap-5 xl:grid-cols-2"><SectionCard title="Open Critical Links"><p className="text-sm text-[var(--psm-muted)]">{rows.filter((row) => row.readiness_impact).length} links affect readiness.</p></SectionCard><SectionCard title="Active MOC / PSSR / PTW / LOTO Links"><p className="text-sm text-[var(--psm-muted)]">{rows.filter((row) => /MOC|PSSR|PTW|LOTO/i.test(`${row.source_module} ${row.target_module}`)).length} active process-safety workflow links.</p></SectionCard></div><RelationshipGraphPanel rows={rows} /><LinkedRecordsMobileCards rows={rows} /><LinkedRecordsTable rows={rows} onRemove={(id) => mutations.remove.mutate(id)} /><LinkedRecordTimeline rows={rows} />{dialog ? <AddLinkedRecordDialog defaults={{ sourceModule: 'Equipment', sourceRecordId: equipmentId }} saving={mutations.create.isPending} onClose={() => setDialog(false)} onSubmit={(input) => mutations.create.mutate({ ...input, equipmentId }, { onSuccess: () => setDialog(false) })} /> : null}</div>;
}
