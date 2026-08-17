'use client';

import { useWorkOrderDetail, useWorkOrderMutations } from '../hooks/useWorkOrders';
import { KeyValueGrid, MissingDataList, SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { WorkOrderDetailHeader } from './WorkOrderDetailHeader';
import { WorkOrderExecutionForm } from './WorkOrderExecutionForm';
import { WorkOrderPartsPanel } from './WorkOrderPartsPanel';
import { WorkOrderTasksPanel } from './WorkOrderTasksPanel';
import { WorkOrderTimeline } from './WorkOrderTimeline';
import { WorkOrderVerificationForm } from './WorkOrderVerificationForm';

export function WorkOrderDetailPage({ workOrderId, mode }: { workOrderId: string; mode?: 'plan' | 'execute' | 'verify' | undefined }) {
  const query = useWorkOrderDetail(workOrderId);
  const mutations = useWorkOrderMutations(workOrderId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load work order detail.</div>;
  const busy = Object.values(mutations).some((mutation: any) => mutation.isPending);
  const row = query.data.workOrder;
  const actions = {
    submit: () => void mutations.submit.mutateAsync({}).then(() => query.refetch()),
    approve: () => void mutations.approve.mutateAsync({}).then(() => query.refetch()),
    start: () => void mutations.start.mutateAsync({}).then(() => query.refetch()).catch((error) => window.alert(error?.message ?? 'Start blocked.')),
    hold: () => {
      const reason = window.prompt('Hold reason');
      if (reason) void mutations.hold.mutateAsync({ reason }).then(() => query.refetch());
    },
    resume: () => void mutations.resume.mutateAsync({}).then(() => query.refetch()),
    close: () => void mutations.close.mutateAsync({}).then(() => query.refetch()).catch((error) => window.alert(error?.message ?? 'Close blocked by readiness rules.'))
  };
  return (
    <div className="space-y-5">
      <WorkOrderDetailHeader detail={query.data} busy={busy} actions={actions} />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionCard title="Work Order Basis" description="Source, work details, planning, PTW/LOTO, parts, risk, readiness, and links.">
            <KeyValueGrid items={[
              ['Equipment', row.equipment_tag ?? row.equipment_id],
              ['Source', `${cardValue(row.source_module ?? 'Manual')} ${cardValue(row.source_record_id, '')}`],
              ['Work type', row.work_order_type],
              ['Category', row.work_category],
              ['Risk level', row.risk_level],
              ['Owner', row.owner_user_id],
              ['Assigned to', row.assigned_user_id ?? row.assigned_team_id],
              ['Contractor/vendor', row.contractor_vendor],
              ['Planned start', row.planned_start_at],
              ['Planned finish', row.planned_finish_at],
              ['Due date', row.due_date],
              ['Required shutdown', row.required_shutdown],
              ['PTW linked', row.linked_ptw_id],
              ['LOTO linked', row.linked_loto_id],
              ['Parts status', row.parts_status],
              ['MOC required', row.moc_required],
              ['PSSR impact', row.pssr_impact],
              ['LOPA/SIL impact', row.lopa_sil_impact]
            ]} />
          </SectionCard>
          {mode === 'execute' ? <WorkOrderExecutionForm workOrderId={workOrderId} /> : null}
          {mode === 'verify' ? <WorkOrderVerificationForm workOrderId={workOrderId} /> : null}
          <WorkOrderTasksPanel tasks={query.data.tasks} />
          <WorkOrderPartsPanel parts={query.data.parts} />
        </div>
        <div className="space-y-5">
          <SectionCard title="Readiness / Blockers" description="Backend-generated blockers for start, close, PSSR/readiness, MOC, PTW/LOTO, parts, and verification."><MissingDataList items={[...query.data.readiness.blockers, ...query.data.readiness.warnings]} /></SectionCard>
          <SectionCard title="Linked Records / Actions"><p className="text-sm text-[var(--psm-muted)]">{query.data.linkedRecords?.length ?? 0} linked records · {query.data.actionLinks?.length ?? 0} action links</p></SectionCard>
          <WorkOrderTimeline events={query.data.history} />
        </div>
      </div>
    </div>
  );
}
