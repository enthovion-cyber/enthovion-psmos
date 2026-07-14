'use client';

import { useState } from 'react';
import { AddEditChemicalDrawer } from '../asset-chemical/AddEditChemicalDrawer';
import { AddEditEquipmentDrawer } from '../asset-chemical/AddEditEquipmentDrawer';
import { AssetChemicalChangeHistoryPanel } from '../asset-chemical/AssetChemicalChangeHistoryPanel';
import { AssetChemicalHeader } from '../asset-chemical/AssetChemicalHeader';
import { AssetChemicalReadinessPanel } from '../asset-chemical/AssetChemicalReadinessPanel';
import { AssetChemicalReviewPanel } from '../asset-chemical/AssetChemicalReviewPanel';
import { AssetSummaryCards } from '../asset-chemical/AssetSummaryCards';
import { ChemicalMaterialRegister } from '../asset-chemical/ChemicalMaterialRegister';
import { EquipmentConditionPanel } from '../asset-chemical/EquipmentConditionPanel';
import { EquipmentInvolvedRegister } from '../asset-chemical/EquipmentInvolvedRegister';
import { FollowupRequirementsPanel } from '../asset-chemical/FollowupRequirementsPanel';
import { LossOfContainmentReleasePanel } from '../asset-chemical/LossOfContainmentReleasePanel';
import { MaintenanceInspectionSnapshotPanel } from '../asset-chemical/MaintenanceInspectionSnapshotPanel';
import { ProcessConditionsPanel } from '../asset-chemical/ProcessConditionsPanel';
import { SafeguardIplSisPsvAlarmPanel } from '../asset-chemical/SafeguardIplSisPsvAlarmPanel';
import { SdsHazardInformationPanel } from '../asset-chemical/SdsHazardInformationPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentAssetMutations, useIncidentAssets } from '../../hooks/useIncidentAssets';

export function AssetEquipmentChemicalTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentAssets(incidentId);
  const mutations = useIncidentAssetMutations(incidentId);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [chemicalOpen, setChemicalOpen] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<Record<string, any>>({});
  const [chemicalForm, setChemicalForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Asset / Equipment / Chemical" message="Loading real equipment, chemical, SDS, release, safeguard, review, and readiness data." />;
  if (error) return <TabStatePanel title="Could not load Asset / Equipment / Chemical" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Asset / Equipment / Chemical data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this incident.'} tone="danger" />;

  const setEquipment = (key: string, value: any) => setEquipmentForm((current) => ({ ...current, [key]: value }));
  const setChemical = (key: string, value: any) => setChemicalForm((current) => ({ ...current, [key]: value }));
  const saveEquipment = async () => {
    try {
      if (equipmentForm.id) await mutations.updateEquipment.mutateAsync({ rowId: equipmentForm.id, values: equipmentForm });
      else await mutations.createEquipment.mutateAsync(equipmentForm);
      setEquipmentOpen(false); setMessage('Equipment record saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const saveChemical = async () => {
    try {
      if (chemicalForm.id) await mutations.updateChemical.mutateAsync({ rowId: chemicalForm.id, values: chemicalForm });
      else await mutations.createChemical.mutateAsync(chemicalForm);
      setChemicalOpen(false); setMessage('Chemical/material record saved.');
    } catch (event) { setMessage(errorText(event)); }
  };
  const requestReview = async () => {
    try { await mutations.requestReview.mutateAsync({ reason: 'Asset / Equipment / Chemical review requested' }); setMessage('Review requested.'); } catch (event) { setMessage(errorText(event)); }
  };
  const approve = async () => {
    try { await mutations.approveReview.mutateAsync({ reason: 'Asset / Equipment / Chemical approved' }); setMessage('Review approved.'); } catch (event) { setMessage(errorText(event)); }
  };
  const reject = async () => {
    const reason = window.prompt('Reason for rejection');
    if (!reason) return;
    try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Review rejected.'); } catch (event) { setMessage(errorText(event)); }
  };

  return <div className="grid gap-4">
    <AssetChemicalHeader data={data} saving={saving} message={message} onAddEquipment={() => { setEquipmentForm({}); setEquipmentOpen(true); }} onAddChemical={() => { setChemicalForm({}); setChemicalOpen(true); }} onRequestReview={requestReview} onRefresh={() => refetch()} />
    <AssetSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
      <EquipmentInvolvedRegister rows={data.equipmentRegister ?? []} onEdit={(row: any) => { setEquipmentForm(fromEquipmentRow(row)); setEquipmentOpen(true); }} onDelete={(rowId: string) => mutations.deleteEquipment.mutate(rowId)} canDelete={data.permissions?.canDelete} />
      <AssetChemicalReadinessPanel readiness={data.readiness} />
    </div>
    <ChemicalMaterialRegister rows={data.chemicalRegister ?? []} onEdit={(row: any) => { setChemicalForm(fromChemicalRow(row)); setChemicalOpen(true); }} onDelete={(rowId: string) => mutations.deleteChemical.mutate(rowId)} canDelete={data.permissions?.canDelete} />
    <div className="grid gap-4 xl:grid-cols-3">
      <EquipmentConditionPanel data={data.equipmentCondition} />
      <MaintenanceInspectionSnapshotPanel data={data.maintenanceInspectionSnapshot} />
      <SafeguardIplSisPsvAlarmPanel data={data.safeguardIplSisPsvAlarm} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <SdsHazardInformationPanel data={data.sdsHazardInformation} />
      <LossOfContainmentReleasePanel data={data.lossOfContainmentRelease} />
      <ProcessConditionsPanel data={data.processConditions} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <FollowupRequirementsPanel rows={data.followupRequirements ?? []} />
      <AssetChemicalReviewPanel review={data.review} onApprove={approve} onReject={reject} />
      <AssetChemicalChangeHistoryPanel rows={data.changeHistory ?? []} />
    </div>
    <AddEditEquipmentDrawer open={equipmentOpen} form={equipmentForm} set={setEquipment} saving={saving} onClose={() => setEquipmentOpen(false)} onSave={saveEquipment} />
    <AddEditChemicalDrawer open={chemicalOpen} form={chemicalForm} set={setChemical} saving={saving} onClose={() => setChemicalOpen(false)} onSave={saveChemical} />
  </div>;
}

function fromEquipmentRow(row: any) {
  return {
    id: row.id,
    equipmentTag: row.equipment_tag_snapshot,
    equipmentName: row.equipment_name_snapshot,
    equipmentType: row.equipment_type_snapshot,
    equipmentStatus: row.equipment_status,
    equipmentLocation: row.equipment_location,
    conditionAtEvent: row.condition_at_event,
    operatingStatus: row.operating_status,
    failureMode: row.failure_mode,
    damageDescription: row.damage_description,
    maintenanceOverdueSuspected: !!row.maintenance_overdue_suspected,
    safeguardInvolved: !!row.safeguard_involved,
    safeguardFailed: !!row.safeguard_failed,
    iplInvolved: !!row.ipl_involved,
    sisSifInvolved: !!row.sis_sif_involved,
    psvReliefInvolved: !!row.psv_relief_involved,
    alarmInterlockInvolved: !!row.alarm_interlock_involved
  };
}

function fromChemicalRow(row: any) {
  return {
    id: row.id,
    chemicalName: row.chemical_name_snapshot,
    casNumber: row.cas_number_snapshot,
    sdsId: row.sds_id,
    sdsLink: row.sds_link,
    sdsAvailable: !!row.sds_available,
    hazardClassification: row.hazard_classification,
    materialState: row.material_state,
    estimatedQuantityInvolved: row.estimated_quantity_involved,
    releasedQuantity: row.released_quantity,
    releaseUnit: row.release_unit,
    releaseDuration: row.release_duration,
    containmentStatus: row.containment_status,
    processCondition: row.process_condition
  };
}
