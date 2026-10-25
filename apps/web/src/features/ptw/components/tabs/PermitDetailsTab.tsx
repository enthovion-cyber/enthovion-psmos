import { PTWSafetyPrecheckBanner } from '../details/PTWSafetyPrecheckBanner';
import type { ReactNode } from 'react';
import { PermitActionPanel } from '../PermitActionPanel';

export function PermitDetailsTab({
  permit,
  onCreateMoc,
  onSaveTemplate
}: {
  permit: any;
  onCreateMoc: () => void;
  onSaveTemplate: () => void;
}) {
  return (
    <div className="grid gap-3 lg:gap-3.5 xl:grid-cols-1 2xl:grid-cols-[1fr_270px]">
      <PTWSafetyPrecheckBanner permitId={permit.id} />
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-slate-100">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Permit Details & Specifications
        </h2>

        {/* Work Description - Full Width Hero Display */}
        <div className="mb-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Work Description & Safety Scope
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {permit.work_description || 'No work description specified.'}
          </p>
        </div>

        {/* Technical Specification Grid */}
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Info label="Permit Type" value={permit.permit_type?.replaceAll('_', ' ')} />
          <Info label="Status" value={permit.status} />
          <Info label="Risk Level" value={permit.risk_level} />
          <Info label="Facility / Site" value={permit.site?.name ?? '-'} />
          <Info label="Operating Unit" value={permit.unit?.name ?? '-'} />
          <Info label="Operating Area" value={permit.area?.name ?? '-'} />
          <Info label="Specific Location" value={permit.location ?? permit.job_area ?? '-'} />
          <Info label="Target Equipment" value={`${permit.equipment_tag ?? '-'} ${permit.equipment_name ?? ''}`} />
          <Info label="Issuer" value={permit.issuer?.displayName ?? '-'} />
          <Info
            label="Planned Start"
            value={permit.planned_start_at ? new Date(permit.planned_start_at).toLocaleString() : '-'}
          />
          <Info
            label="Planned Expiry"
            value={permit.planned_end_at ? new Date(permit.planned_end_at).toLocaleString() : '-'}
          />
          <Info label="Max Personnel" value={permit.max_personnel ?? 'Standard crew'} />
        </div>
      </section>

      <PermitActionPanel permit={permit} onCreateMoc={onCreateMoc} onSaveTemplate={onSaveTemplate} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-2 shadow-xs">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</div>
    </div>
  );
}

