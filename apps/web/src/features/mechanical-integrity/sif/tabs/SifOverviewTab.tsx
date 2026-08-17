import { KeyValueGrid, MissingDataList, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function SifOverviewTab({ data }: { data: any }) {
  const sif = data?.sif ?? data?.record ?? {};
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SectionCard title="SIF Snapshot" description="Core SIF identification, SIL, status, equipment, and readiness.">
        <KeyValueGrid items={[
          ['Tag', sif.sifTag ?? sif.sif_tag],
          ['Name', sif.sifName ?? sif.sif_name],
          ['Type', sif.sifType ?? sif.sif_type],
          ['Target SIL', sif.targetSil ?? sif.target_sil],
          ['Status', sif.status],
          ['Safety critical', sif.safetyCritical ?? sif.safety_critical],
          ['PSM critical', sif.psmCritical ?? sif.psm_critical],
          ['Startup blocked', sif.startupBlocked ?? sif.startup_blocked],
          ['Equipment', sif.equipmentId ?? sif.equipment_id]
        ]} />
      </SectionCard>
      <SectionCard title="Readiness / Blockers" description="Backend-generated readiness blockers and warnings.">
        <MissingDataList items={data?.readiness?.missing_required_data_json ?? data?.readiness?.blockers_json} />
      </SectionCard>
      <SectionCard title="Cause & Effect" description="Trip setpoint, safe state, inputs, and final action.">
        <KeyValueGrid items={[
          ['Trip setpoint', data?.causeEffect?.trip_setpoint],
          ['Safe state', sif.safeState ?? sif.safe_state],
          ['Logic description', data?.causeEffect?.logic_description],
          ['Final action', data?.causeEffect?.final_action]
        ]} />
      </SectionCard>
      <SectionCard title="Architecture / SIL Data" description="Voting, RRF, PFDavg, proof-test interval, and verification status.">
        <KeyValueGrid items={[
          ['Architecture', data?.architecture?.architecture],
          ['Sensor voting', data?.architecture?.sensor_voting],
          ['Final element voting', data?.architecture?.final_element_voting],
          ['Achieved RRF', data?.silData?.achieved_rrf],
          ['Achieved PFDavg', data?.silData?.achieved_pfdavg],
          ['Verification status', data?.silData?.verification_status]
        ]} />
      </SectionCard>
    </div>
  );
}
