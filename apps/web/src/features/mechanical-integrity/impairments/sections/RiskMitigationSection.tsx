import type { MiImpairmentLookups } from '../../types/impairment.types';
import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { BoolField, Field, inputClass } from './SectionField';

export function RiskMitigationSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: MiImpairmentLookups | undefined; onChange: (value: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <SectionCard title="3. Risk & Mitigation" description="High/Critical impairments require mitigation and approval before activation unless emergency policy permits override.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Risk level"><select className={inputClass} value={value.riskLevel ?? 'Medium'} onChange={(e) => set('riskLevel', e.target.value)}>{lookups?.riskLevels?.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Risk assessment summary"><textarea className={inputClass} rows={3} value={value.riskAssessmentSummary ?? ''} onChange={(e) => set('riskAssessmentSummary', e.target.value)} /></Field>
        <Field label="Temporary mitigation summary"><textarea className={inputClass} rows={3} value={value.temporaryMitigationSummary ?? ''} onChange={(e) => set('temporaryMitigationSummary', e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ['mitigationRequired','Mitigation required'], ['operatorMonitoringRequired','Operator monitoring'], ['temporaryAlarmOrProtection','Temporary alarm/protection'], ['extraRoundsRequired','Extra operator rounds'],
          ['reducedOperatingEnvelope','Reduced operating envelope'], ['reducedInventoryPressureTemperature','Reduced inventory/pressure/temp'], ['standbyEquipmentRequired','Standby equipment'], ['fireGasWatchRequired','Fire/gas watch'],
          ['manualControlRequired','Manual control'], ['emergencyReadinessRequired','Emergency readiness'], ['controlRoomCommunicationRequired','Control room communication'], ['shiftHandoverRequired','Shift handover'], ['managementNotificationRequired','Management notification']
        ] as Array<[string, string]>).map(([key, label]) => <BoolField key={key} label={label} checked={!!value[key]} onChange={(next) => set(key, next)} />)}
      </div>
    </SectionCard>
  );
}
