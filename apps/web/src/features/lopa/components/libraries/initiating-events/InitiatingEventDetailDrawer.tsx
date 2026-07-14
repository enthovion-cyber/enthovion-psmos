'use client';

import type { InitiatingEventLibraryRecord } from '../../../types/lopa-library.types';
import { DetailRow, LibraryDrawer, LibraryScopeBadge, LibraryStatusBadge } from '../LibraryShared';

export function InitiatingEventDetailDrawer({ record, onClose }: { record?: InitiatingEventLibraryRecord | null; onClose: () => void }) {
  return (
    <LibraryDrawer open={Boolean(record)} onClose={onClose} title="Initiating Event Detail">
      {record ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase text-blue-300">{record.event_code}</div>
                <h3 className="mt-1 text-xl font-black text-white">{record.event_name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{record.description || 'No description provided.'}</p>
              </div>
              <div className="flex gap-2"><LibraryStatusBadge status={record.approval_status} /><LibraryScopeBadge scope={record.scope} /></div>
            </div>
          </section>
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <h4 className="text-sm font-black text-white">Frequency Basis</h4>
            <div className="mt-3">
              <DetailRow label="Category" value={record.event_category} />
              <DetailRow label="Failure mode" value={record.failure_mode} />
              <DetailRow label="Equipment type" value={record.equipment_type} />
              <DetailRow label="Base frequency" value={`${Number(record.base_frequency).toExponential(3)} ${record.frequency_unit}`} />
              <DetailRow label="Low / High" value={`${record.low_frequency ? Number(record.low_frequency).toExponential(3) : '-'} / ${record.high_frequency ? Number(record.high_frequency).toExponential(3) : '-'}`} />
              <DetailRow label="Confidence" value={record.confidence_level} />
            </div>
          </section>
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <h4 className="text-sm font-black text-white">Source / Reference</h4>
            <div className="mt-3">
              <DetailRow label="Source type" value={record.source_type} />
              <DetailRow label="Source reference" value={record.source_reference} />
              <DetailRow label="Standard reference" value={record.standard_reference} />
              <DetailRow label="Applicability" value={record.applicability_notes} />
              <DetailRow label="Exclusions" value={record.exclusion_notes} />
            </div>
          </section>
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <h4 className="text-sm font-black text-white">Governance</h4>
            <div className="mt-3">
              <DetailRow label="Revision" value={`Rev ${record.revision}`} />
              <DetailRow label="Site modifier" value={record.site_modifier_allowed ? `Allowed, default ${record.default_site_modifier}` : 'Not allowed'} />
              <DetailRow label="Justification required" value={record.engineering_justification_required ? 'Yes' : 'No'} />
              <DetailRow label="Engineering justification" value={record.engineering_justification} />
              <DetailRow label="Revision notes" value={record.revision_notes} />
              <DetailRow label="Active" value={record.active ? 'Yes' : 'No'} />
            </div>
          </section>
        </div>
      ) : null}
    </LibraryDrawer>
  );
}
