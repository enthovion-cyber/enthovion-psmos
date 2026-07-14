'use client';

import type { ConditionalModifierLibraryRecord } from '../../../types/lopa-library.types';
import { DetailRow, LibraryDrawer, LibraryScopeBadge, LibraryStatusBadge } from '../LibraryShared';

export function ConditionalModifierDetailDrawer({ record, onClose }: { record?: ConditionalModifierLibraryRecord | null; onClose: () => void }) {
  return (
    <LibraryDrawer open={Boolean(record)} onClose={onClose} title="Conditional Modifier Detail">
      {record ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase text-blue-300">{record.modifier_code}</div>
                <h3 className="mt-1 text-xl font-black text-white">{record.modifier_name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{record.description || 'No description provided.'}</p>
              </div>
              <div className="flex gap-2"><LibraryStatusBadge status={record.approval_status} /><LibraryScopeBadge scope={record.scope} /></div>
            </div>
          </section>
          <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <h4 className="text-sm font-black text-white">Approved Range / Use</h4>
            <div className="mt-3">
              <DetailRow label="Modifier type" value={record.modifier_type} />
              <DetailRow label="Default value" value={`${record.default_value} ${record.unit || 'factor'}`} />
              <DetailRow label="Low / High" value={`${record.low_value ?? '-'} / ${record.high_value ?? '-'}`} />
              <DetailRow label="Confidence" value={record.confidence_level} />
              <DetailRow label="Context" value={record.application_context} />
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
              <DetailRow label="Override allowed" value={record.override_allowed ? 'Yes' : 'No'} />
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
