'use client';

import { AlertTriangle, CheckCircle2, Save, Send, X } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { missingRequirements } from '../hooks/useCreatePermit';
import type { PermitCreateValues } from '../schemas/permit.schema';
import { permitTypeOptions } from '../schemas/permit.schema';
import { StepPanel } from './PermitWizardFields';

export function PermitReviewSubmitStep({ onSaveDraft, onSubmitForApproval, onCancel, isSaving }: { onSaveDraft: () => void; onSubmitForApproval: () => void; onCancel: () => void; isSaving: boolean }) {
  const { control } = useFormContext<PermitCreateValues>();
  const values = useWatch({ control }) as PermitCreateValues;
  const missing = missingRequirements(values);
  const permitType = permitTypeOptions.find((item) => item.value === values.permitType)?.label ?? values.permitType;

  return (
    <StepPanel title="Step 9 - Review & Submit" subtitle="Full permit summary, Missing requirements checklist, Save Draft, Submit for Approval, and Cancel.">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Summary title="Permit type" value={permitType} />
          <Summary title="Title" value={values.title} />
          <Summary title="Location" value={[values.siteId, values.processUnit, values.area, values.locationDescription].filter(Boolean).join(' / ')} />
          <Summary title="Equipment" value={[values.equipmentTag, values.equipmentName, values.equipmentType].filter(Boolean).join(' - ')} />
          <Summary title="Risk level" value={values.riskLevel} tone={values.riskLevel === 'Critical' ? 'red' : values.riskLevel === 'High' ? 'amber' : 'green'} />
          <Summary title="Work description" value={values.detailedWorkDescription} />
          <Summary title="Type-specific requirements" value={typeSpecificSummary(values)} />
          <Summary title="Isolation plan" value={`${values.isolationRequired || values.permitType === 'ELECTRICAL_ISOLATION' ? 'Required' : 'Not required'} - ${values.isolationPoints.length} isolation point(s)`} />
          <Summary title="Gas test plan" value={`${values.gasTestRequired ? 'Required' : 'Not required'} - ${[values.gasO2 && 'O2', values.gasLEL && 'LEL', values.gasH2S && 'H2S', values.gasCO && 'CO', values.gasSO2 && 'SO2', values.gasCl2 && 'Cl2', values.gasNH3 && 'NH3', values.gasHF && 'HF', values.customGas].filter(Boolean).join(', ') || 'No gases selected'}`} />
          <Summary title="Workforce" value={`${values.workers.length} worker(s), Permit Holder: ${values.permitHolder || 'Not set'}, Performing Authority: ${values.performingAuthority || 'Not set'}`} />
          <Summary title="Attachments" value={`${values.attachments.length} attachment(s)`} />
        </div>
        <aside className="rounded-lg border border-cyan-300/10 bg-black/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            {missing.length ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            Missing requirements checklist
          </div>
          {missing.length ? (
            <ul className="space-y-2 text-sm text-amber-100">
              {missing.map((item) => <li key={item} className="rounded-md border border-amber-300/20 bg-amber-500/10 px-3 py-2">{item}</li>)}
            </ul>
          ) : (
            <div className="rounded-md border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">All required fields are complete. Submit will create permit and start workflow.</div>
          )}
          <div className="mt-5 grid gap-2">
            <button type="button" className="ptw-toolbar-button justify-center" onClick={onSaveDraft} disabled={isSaving}><Save size={15} /> Save Draft</button>
            <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500 disabled:opacity-50" onClick={onSubmitForApproval} disabled={isSaving}><Send className="mr-2 inline h-4 w-4" /> Submit for Approval</button>
            <button type="button" className="ptw-toolbar-button justify-center text-slate-200" onClick={onCancel} disabled={isSaving}><X size={15} /> Cancel</button>
          </div>
        </aside>
      </div>
    </StepPanel>
  );
}

function Summary({ title, value, tone }: { title: string; value?: string; tone?: 'green' | 'amber' | 'red' }) {
  const toneClass = tone === 'red' ? 'text-red-200' : tone === 'amber' ? 'text-amber-200' : tone === 'green' ? 'text-emerald-200' : 'text-slate-200';
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-black/10 p-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{value || 'Not provided'}</div>
    </div>
  );
}

function typeSpecificSummary(values: PermitCreateValues) {
  switch (values.permitType) {
    case 'HOT_WORK':
      return `Ignition Source Type: ${values.ignitionSourceType || 'Not set'}, Fire Watch Required: ${values.fireWatchRequired ? 'Yes' : 'No'}, LEL Requirement: ${values.lelRequirement || 'Not set'}`;
    case 'CONFINED_SPACE':
      return `Confined Space ID: ${values.confinedSpaceId || 'Not set'}, Entry Supervisor: ${values.entrySupervisor || 'Not set'}, Rescue Plan Required: ${values.rescuePlanRequired ? 'Yes' : 'No'}`;
    case 'ELECTRICAL_ISOLATION':
      return `Isolation Required: ${values.typeIsolationRequired ? 'Yes' : 'No'}, Isolation Authority: ${values.isolationAuthorityType || 'Not set'}, Energy Isolation Plan Required: ${values.energyIsolationPlanRequired ? 'Yes' : 'No'}`;
    case 'EXCAVATION':
      return `Excavation Depth: ${values.excavationDepth || 'Not set'}, Buried Services Checked: ${values.buriedServicesChecked ? 'Yes' : 'No'}, Shoring Required: ${values.shoringRequired ? 'Yes' : 'No'}`;
    case 'RADIOGRAPHY':
      return `Radiation Source: ${values.radiationSource || 'Not set'}, Exclusion Zone Radius: ${values.exclusionZoneRadius || 'Not set'}, Radiation Survey Required: ${values.radiationSurveyRequired ? 'Yes' : 'No'}`;
    case 'WORKING_AT_HEIGHT':
      return `Work Height: ${values.workHeight || 'Not set'}, Fall Protection Required: ${values.fallProtectionRequired ? 'Yes' : 'No'}, Anchor Point Verified: ${values.anchorPointVerified ? 'Yes' : 'No'}`;
    case 'LINE_BREAKING':
      return `Line / Equipment Number: ${values.lineEquipmentNumber || 'Not set'}, Depressurised: ${values.depressurisedConfirmed ? 'Yes' : 'No'}, Blind Installed: ${values.blindInstalled ? 'Yes' : 'No'}`;
    case 'SIMOPS':
      return `SIMOPS Coordinator: ${values.simopsCoordinator || 'Not set'}, Conflict Review Required: ${values.conflictReviewRequired ? 'Yes' : 'No'}, Control Measures: ${values.controlMeasures || 'Not set'}`;
    default:
      return 'Cold Work standard controls';
  }
}
