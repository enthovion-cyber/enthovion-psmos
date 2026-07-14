'use client';

import type { IplRegistryRecord } from '../../types/lopa-ipl-registry.types';
import { DetailRow, LibraryDrawer } from '../libraries/LibraryShared';
import { IplRegistryHistoryPanel } from './IplRegistryHistoryPanel';
import { IplRegistryLinksPanel } from './IplRegistryLinksPanel';
import { IplRegistryPfdRrfPanel } from './IplRegistryPfdRrfPanel';
import { IplRegistryStatusBadge } from './IplRegistryStatusBadge';
import { IplRegistryValidationPanel } from './IplRegistryValidationPanel';

export function IplRegistryDetailDrawer({ record, onClose }: { record: IplRegistryRecord | null; onClose: () => void }) {
  return (
    <LibraryDrawer open={!!record} onClose={onClose} title={record ? `${record.registry_number} · ${record.ipl_name}` : 'IPL Registry'}>
      {record ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <div className="mb-3 flex flex-wrap gap-2"><IplRegistryStatusBadge value={record.approval_status} /><IplRegistryStatusBadge value={record.validation_status} />{record.readOnly ? <IplRegistryStatusBadge value="Approved Readonly" /> : null}</div>
            <DetailRow label="IPL Type" value={record.ipl_type} />
            <DetailRow label="Description" value={record.description} />
            <DetailRow label="Service" value={record.service_application} />
            <DetailRow label="Protected Equipment" value={record.protected_equipment} />
            <DetailRow label="Safe State" value={record.safe_state} />
            <DetailRow label="Demand Source" value={record.demand_source} />
            <DetailRow label="Revision" value={`Rev ${record.revision}`} />
            <DetailRow label="Usage" value={`${record.usage_count ?? 0} future/study references`} />
          </section>
          <IplRegistryPfdRrfPanel record={record} />
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <h3 className="text-sm font-black text-white">Proof Test / Maintenance</h3>
            <DetailRow label="Interval" value={record.proof_test_interval} />
            <DetailRow label="Due Date" value={record.proof_test_due_date} />
            <DetailRow label="Basis" value={record.proof_test_basis} />
            <DetailRow label="Inspection" value={record.inspection_requirement} />
            <DetailRow label="Maintenance" value={record.maintenance_requirement} />
          </section>
          <IplRegistryValidationPanel items={record.validationItems} />
          <IplRegistryLinksPanel record={record} />
          <IplRegistryHistoryPanel history={record.history} />
        </div>
      ) : null}
    </LibraryDrawer>
  );
}
