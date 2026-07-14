'use client';

import { Badge } from '../shared/IncidentStatusBadge';
import { BarrierHeaderFacts } from './BarrierPanelPrimitives';
import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';

export function BarrierSafeguardHeader({ data, saving, message, onAdd, onImportHazop, onImportLopa, onRequestReview, onCreateFollowup, onSaveChanges, onRefresh }: any) {
  const disabledReason = (key: string) => data.actions?.find((action: any) => action.key === key)?.disabledReason;
  const enabled = (key: string) => data.actions?.find((action: any) => action.key === key)?.enabled !== false;
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black">Barrier / Safeguard Failure</h2>
          <Badge value={data.header?.analysisStatus ?? 'Not Started'} />
          <Badge value={data.header?.reviewStatus ?? 'Not Requested'} />
          {data.permissions?.readOnly ? <Badge value="Read-only" /> : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">Backend-generated barrier analysis, IPL credit checks, failed safeguard evidence, RCA linkage, and follow-up readiness.</p>
        {message ? <div className="mt-2 rounded-lg border border-blue-400/20 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
        <div className="mt-3"><BarrierHeaderFacts header={data.header} /></div>
      </div>
      <div className="flex flex-wrap content-start gap-2 lg:max-w-xs">
        <button className={buttonPrimary} disabled={!enabled('add-barrier') || saving} title={disabledReason('add-barrier') ?? ''} onClick={onAdd}>Add Barrier</button>
        <button className={buttonSecondary} disabled={!enabled('import-hazop') || saving} title={disabledReason('import-hazop') ?? ''} onClick={onImportHazop}>Import HAZOP</button>
        <button className={buttonSecondary} disabled={!enabled('import-lopa') || saving} title={disabledReason('import-lopa') ?? ''} onClick={onImportLopa}>Import LOPA/IPL</button>
        <button className={buttonSecondary} disabled={!enabled('create-followup') || saving} title={disabledReason('create-followup') ?? ''} onClick={onCreateFollowup}>Create Action</button>
        <button className={buttonSecondary} disabled={!enabled('request-review') || saving} title={disabledReason('request-review') ?? ''} onClick={onRequestReview}>Request Review</button>
        <button className={buttonSecondary} disabled={!enabled('save-changes') || saving} title={disabledReason('save-changes') ?? ''} onClick={onSaveChanges}>Save Changes</button>
        <button className={buttonSecondary} onClick={onRefresh}>Refresh</button>
      </div>
    </div>
  </section>;
}
