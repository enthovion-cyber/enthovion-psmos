import { useMemo, useState } from 'react';
import type { IncidentCreateValues, IncidentWizardStep } from '../types/incident-create.types';

export const incidentWizardSteps: IncidentWizardStep[] = [
  { id: 1, title: 'Report Type & Basic Info', description: 'Classification, title, reporter, restricted/confidential flags' },
  { id: 2, title: 'Location & Time', description: 'Site, unit, area, event date/time, operating context' },
  { id: 3, title: 'Event Description', description: 'Facts, activity, consequences, response signals' },
  { id: 4, title: 'People / Injury / Exposure', description: 'People involved, treatment, exposure, confidential notes' },
  { id: 5, title: 'Asset / Equipment / Chemical', description: 'Equipment registry, chemical/SDS, safeguards, release data' },
  { id: 6, title: 'Actual Severity', description: 'What actually happened' },
  { id: 7, title: 'Potential Severity / Risk Potential', description: 'What could reasonably have happened' },
  { id: 8, title: 'PSM / PSE / API RP 754', description: 'Process safety classification and threshold status' },
  { id: 9, title: 'Immediate Actions Taken', description: 'Immediate controls, safe state, restart blocking' },
  { id: 10, title: 'Initial Evidence / Attachments', description: 'Evidence metadata and secure upload references' },
  { id: 11, title: 'Investigation Priority & Follow-up', description: 'Backend-generated next steps' },
  { id: 12, title: 'Review & Submit', description: 'Final validation and submission' }
];

export function useIncidentCreateWizard(initial?: IncidentCreateValues) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<IncidentCreateValues>(initial ?? {});
  const [dirty, setDirty] = useState(false);
  const completed = useMemo(() => incidentWizardSteps.filter((s) => s.id < step).map((s) => s.id), [step]);
  const update = (patch: IncidentCreateValues) => { setValues((v) => ({ ...v, ...patch })); setDirty(true); };
  return { step, setStep, values, setValues, update, dirty, setDirty, steps: incidentWizardSteps, completed };
}
