'use client';

import { useState } from 'react';
import { AddEditPersonDrawer } from '../people-injury/AddEditPersonDrawer';
import { ConfidentialMedicalNotesPanel } from '../people-injury/ConfidentialMedicalNotesPanel';
import { ContractorVisitorPublicPanel } from '../people-injury/ContractorVisitorPublicPanel';
import { ExposureDetailsPanel } from '../people-injury/ExposureDetailsPanel';
import { InjuryDetailsPanel } from '../people-injury/InjuryDetailsPanel';
import { LostTimeRestrictedWorkPanel } from '../people-injury/LostTimeRestrictedWorkPanel';
import { PeopleInjuryChangeHistoryPanel } from '../people-injury/PeopleInjuryChangeHistoryPanel';
import { PeopleInjuryHeader } from '../people-injury/PeopleInjuryHeader';
import { PeopleInjuryReadinessPanel } from '../people-injury/PeopleInjuryReadinessPanel';
import { PeopleInjuryReviewPanel } from '../people-injury/PeopleInjuryReviewPanel';
import { PeopleInvolvedRegister } from '../people-injury/PeopleInvolvedRegister';
import { PeopleSummaryCards } from '../people-injury/PeopleSummaryCards';
import { PpeControlsPanel } from '../people-injury/PpeControlsPanel';
import { TreatmentMedicalOutcomePanel } from '../people-injury/TreatmentMedicalOutcomePanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentPeople, useIncidentPeopleMutations } from '../../hooks/useIncidentPeople';

export function PeopleInjuryExposureTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentPeople(incidentId);
  const mutations = useIncidentPeopleMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending || mutations.requestReview.isPending || mutations.approveReview.isPending || mutations.rejectReview.isPending;

  if (isLoading) return <TabStatePanel title="Loading People / Injury / Exposure" message="Loading real people, injury, exposure, medical protection, review, and readiness data." />;
  if (error) return <TabStatePanel title="Could not load People / Injury / Exposure" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No People / Injury / Exposure data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this incident.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({}); setDrawerOpen(true); };
  const edit = (row: any) => { setForm(fromPersonRow(row)); setDrawerOpen(true); };
  const save = async () => {
    setMessage(null);
    try {
      if (form.id) await mutations.update.mutateAsync({ personId: form.id, values: form });
      else await mutations.create.mutateAsync(form);
      setDrawerOpen(false);
      setMessage('People / injury / exposure record saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Delete this person/injury/exposure record?')) return;
    try { await mutations.remove.mutateAsync(id); setMessage('Record deleted.'); } catch (event) { setMessage(errorText(event)); }
  };
  const requestReview = async () => {
    try { await mutations.requestReview.mutateAsync({ reason: 'People / Injury / Exposure review requested' }); setMessage('Review requested.'); } catch (event) { setMessage(errorText(event)); }
  };
  const approve = async () => {
    try { await mutations.approveReview.mutateAsync({ reason: 'People / Injury / Exposure approved' }); setMessage('Review approved.'); } catch (event) { setMessage(errorText(event)); }
  };
  const reject = async () => {
    const reason = window.prompt('Reason for rejection');
    if (!reason) return;
    try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Review rejected.'); } catch (event) { setMessage(errorText(event)); }
  };

  return <div className="grid gap-4">
    <PeopleInjuryHeader data={data} saving={saving} message={message} onAdd={add} onRequestReview={requestReview} onRefresh={() => refetch()} />
    <PeopleSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
      <PeopleInvolvedRegister rows={data.peopleRegister ?? []} onEdit={edit} onDelete={remove} canDelete={data.permissions?.canDelete} />
      <PeopleInjuryReadinessPanel readiness={data.readiness} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <InjuryDetailsPanel data={data.injuryDetails} />
      <ExposureDetailsPanel data={data.exposureDetails} />
      <PpeControlsPanel data={data.ppeControls} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <TreatmentMedicalOutcomePanel data={data.treatmentMedicalOutcome} />
      <LostTimeRestrictedWorkPanel data={data.lostTimeRestrictedWork} />
      <ContractorVisitorPublicPanel data={data.contractorVisitorPublic} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <ConfidentialMedicalNotesPanel data={data.confidentialMedicalNotes} />
      <PeopleInjuryReviewPanel review={data.review} onApprove={approve} onReject={reject} />
      <PeopleInjuryChangeHistoryPanel rows={data.changeHistory ?? []} />
    </div>
    <AddEditPersonDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={save} />
  </div>;
}

function fromPersonRow(row: any) {
  return {
    id: row.id,
    personName: row.person_name,
    personType: row.person_type,
    jobRole: row.job_role,
    contractorCompany: row.contractor_company,
    injuryOccurred: !!row.injury_occurred,
    illnessOccurred: !!row.illness_occurred,
    exposureOccurred: !!row.exposure_occurred,
    injuryType: row.injury_type,
    bodyPart: row.body_part,
    treatmentType: row.treatment_type,
    lostTimePotential: !!row.lost_time_potential,
    lostTimeDays: row.lost_time_days,
    restrictedWorkDays: row.restricted_work_days,
    medicalTreatmentRequired: !!row.medical_treatment_required,
    hospitalization: !!row.hospitalization,
    fatality: !!row.fatality,
    ppeUsed: !!row.ppe_used,
    ppeIssueSuspected: !!row.ppe_issue_suspected,
    exposureRoute: row.exposure_route,
    chemicalExposure: !!row.chemical_exposure,
    confidentialNotes: row.confidential_notes
  };
}
