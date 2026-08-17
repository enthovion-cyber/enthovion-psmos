import type { MiDetailTabKey } from '../types/equipment-detail.types';

const tabPairs: Array<[MiDetailTabKey, string]> = [
  ['overview','Overview'], ['technical-data','Technical Data'], ['cml-tml','CML / TML Registry'], ['criticality','Criticality / Risk Ranking'], ['inspection-plan','Inspection Plan / ITP'], ['inspection-records','Inspection Records / UT Readings'], ['remaining-life','Remaining Life / Corrosion Rate'], ['preventive-maintenance','Preventive Maintenance'], ['calibration-testing','Calibration / Instrument Testing'], ['psv-relief','PSV / Relief Devices'], ['sis-sif-interlocks','SIS / SIF / Interlocks / Critical Alarms'], ['bypass-impairment','Bypass / Impairment Log'], ['deficiencies','Deficiencies / Deviations'], ['work-orders-actions','Work Orders / Actions'], ['fitness-readiness','Fitness-for-Service / Readiness'], ['linked-records','Linked Records'], ['documents-certificates','Documents / Certificates'], ['review-approval','Review & Approval'], ['history','History'], ['reports-export','Reports / Export']
];

const tabs: Array<{ key: MiDetailTabKey; label: string }> = tabPairs.map(([key, label]) => ({ key, label }));

export function EquipmentDetailTabs({ active, onChange }: { active: MiDetailTabKey; onChange: (tab: MiDetailTabKey) => void }) {
  return (
    <div className="sticky top-[116px] z-10 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 shadow-sm">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => <button key={tab.key} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active === tab.key ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`} onClick={() => onChange(tab.key)}>{tab.label}</button>)}
      </div>
    </div>
  );
}
