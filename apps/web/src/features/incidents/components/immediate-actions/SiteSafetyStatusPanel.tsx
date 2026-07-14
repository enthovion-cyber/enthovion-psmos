import { InfoRows, TabPanel, formatDate } from '../shared/IncidentTabPrimitives';

export function SiteSafetyStatusPanel({ data }: any) {
  return <TabPanel title="Site Safety Status">
    <div className="grid gap-3">
      {data?.unsafeCondition ? <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-2 text-xs font-bold text-red-700 dark:text-red-200">Unsafe condition remains. This is a critical review/close blocker.</div> : null}
      <InfoRows rows={[
        ['Area safe now', data?.areaSafeNow],
        ['Safety status', data?.siteSafetyStatus],
        ['Unsafe condition remains', data?.unsafeConditionRemains ? 'Yes' : 'No'],
        ['Unsafe condition description', data?.unsafeConditionDescription],
        ['Site access restricted', data?.siteAccessRestricted ? 'Yes' : 'No'],
        ['Barricade/cordon active', data?.barricadeCordonActive ? 'Yes' : 'No'],
        ['Equipment isolated', data?.equipmentIsolated ? 'Yes' : 'No'],
        ['Energy isolation completed', data?.energyIsolationCompleted ? 'Yes' : 'No'],
        ['Release stopped', data?.releaseStopped ? 'Yes' : 'No'],
        ['Fire extinguished', data?.fireExtinguished],
        ['Spill contained', data?.spillContained],
        ['Atmosphere tested', data?.atmosphereTested],
        ['Permit suspended', data?.permitSuspended],
        ['Restart blocked', data?.restartBlocked ? 'Yes' : 'No'],
        ['Restart block reason', data?.restartBlockReason],
        ['Verified by', data?.verifiedBy],
        ['Verified at', formatDate(data?.verifiedAt)],
        ['Verification evidence', data?.verificationEvidence],
        ['Notes', data?.notes]
      ]} />
    </div>
  </TabPanel>;
}
