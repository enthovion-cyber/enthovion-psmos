import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { RestartBlockedBadge } from '../shared/RestartBlockedBadge';
import { SiteSafetyBadge } from '../shared/SiteSafetyBadge';

export function ImmediateActionsHeader({ data, onAdd, onVerifySiteSafe, onLinkEvidence, onConvertCapa, onRequestReview, onCreateAction, onSaveChanges, onRefresh, saving, message }: any) {
  const action = (key: string) => data.actions?.find((item: any) => item.key === key);
  const button = (key: string, label: string, onClick: () => void, primary = false) => {
    const item = action(key);
    return <button className={primary ? buttonPrimary : buttonSecondary} disabled={saving || !item?.enabled} title={item?.disabledReason ?? ''} onClick={onClick}>{label}</button>;
  };
  return <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black">Immediate Actions</h2>
          <SiteSafetyBadge value={data.siteSafetyStatus?.siteSafetyStatus} />
          <RestartBlockedBadge value={data.header?.restartBlocked} />
        </div>
        <p className="mt-1 text-xs text-slate-500">Incident {data.header?.incidentNumber} · {data.header?.title} · {data.header?.status} · Last updated {formatDate(data.header?.lastUpdated)}</p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <HeaderFact label="Area safe" value={data.header?.areaSafeNow ?? 'Unknown'} />
          <HeaderFact label="Emergency response" value={data.header?.emergencyResponseActivated ? 'Yes' : 'No'} />
          <HeaderFact label="Action status" value={data.header?.immediateActionStatus} />
          <HeaderFact label="Verification" value={data.header?.verificationStatus} />
          <HeaderFact label="Total actions" value={data.header?.totalImmediateActions} />
          <HeaderFact label="Open actions" value={data.header?.openImmediateActions} />
          <HeaderFact label="Overdue actions" value={data.header?.overdueImmediateActions} />
          <HeaderFact label="Temporary expired" value={data.header?.temporaryControlsExpired} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
        {button('add-action', 'Add Immediate Action', onAdd, true)}
        {button('verify-site-safe', 'Verify Site Safe', onVerifySiteSafe)}
        {button('link-evidence', 'Link Evidence', onLinkEvidence)}
        {button('convert-capa', 'Convert to CAPA', onConvertCapa)}
        {button('request-review', 'Request Review', onRequestReview)}
        {button('create-action', 'Create Action', onCreateAction)}
        {button('save-changes', 'Save Changes', onSaveChanges)}
        <button className={buttonSecondary} disabled={saving} onClick={onRefresh}>Refresh</button>
      </div>
    </div>
    {data.siteSafetyStatus?.areaSafeNow === 'No' || data.siteSafetyStatus?.unsafeConditionRemains ? <div className="mt-3 rounded-lg border border-red-400/25 bg-red-500/10 p-3 text-xs font-bold text-red-700 dark:text-red-200">Unsafe condition remains. Review/close is blocked until the site safety blocker is resolved or assigned.</div> : null}
    {message ? <div className="mt-3 rounded-lg border border-blue-300/30 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
  </section>;
}

function HeaderFact({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-slate-200 px-2 py-1.5 dark:border-cyan-300/10"><div className="text-[10px] uppercase text-slate-500">{label}</div><div className="font-black">{String(value ?? '-')}</div></div>;
}
