'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Save, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from './EnterpriseOverlay';
import type { CreateEquipmentInput, Equipment } from '@/services/equipment.service';
import { equipmentService } from '@/services/equipment.service';

const criticalityValues = ['LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'] as const;
const statusValues = ['ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'] as const;
const optionalNumber = z.preprocess((value) => value === '' || value === null ? undefined : value, z.coerce.number().optional());

const schema = z.object({
  siteId: z.string().min(1),
  unitId: z.string().min(1),
  areaId: z.string().optional(),
  parentId: z.string().optional(),
  tag: z.string().min(2).max(48),
  name: z.string().min(2).max(160),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  type: z.string().min(2),
  subtype: z.string().optional(),
  status: z.enum(statusValues),
  criticality: z.enum(criticalityValues),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  nameplateNumber: z.string().optional(),
  fabricationYear: optionalNumber,
  commissionDate: z.string().optional(),
  installationDate: z.string().optional(),
  vendorSupplier: z.string().optional(),
  warrantyExpiryDate: z.string().optional(),
  companyName: z.string().optional(),
  systemName: z.string().optional(),
  buildingZone: z.string().optional(),
  gpsLatitude: optionalNumber,
  gpsLongitude: optionalNumber,
  designPressure: z.string().optional(),
  designPressureUnit: z.string().optional(),
  designTemperature: z.string().optional(),
  designTemperatureUnit: z.string().optional(),
  designFlow: z.string().optional(),
  designFlowUnit: z.string().optional(),
  designCapacity: z.string().optional(),
  designCapacityUnit: z.string().optional(),
  materialOfConstruction: z.string().optional(),
  corrosionAllowance: z.string().optional(),
  designCode: z.string().optional(),
  designBasisDocumentRef: z.string().optional(),
  operatingPressure: z.string().optional(),
  operatingPressureUnit: z.string().optional(),
  operatingTemperature: z.string().optional(),
  operatingTemperatureUnit: z.string().optional(),
  normalFlowRate: z.string().optional(),
  flowUnit: z.string().optional(),
  normalCapacityLoad: z.string().optional(),
  capacityUnit: z.string().optional(),
  operatingMode: z.string().optional(),
  operatingDuty: z.string().optional(),
  phase: z.string().optional(),
  serviceType: z.string().optional(),
  fluidName: z.string().optional(),
  fluidService: z.string().optional(),
  fluidPhase: z.string().optional(),
  hazardClass: z.string().optional(),
  sdsReference: z.string().optional(),
  exposureLimits: z.string().optional(),
  toxicityClass: z.string().optional(),
  flammabilityClass: z.string().optional(),
  corrosivityClass: z.string().optional(),
  environmentalImpact: z.string().optional(),
  compositionNotes: z.string().optional(),
  processChemistryNotes: z.string().optional(),
  safetyCritical: z.coerce.boolean(),
  lotoRequired: z.coerce.boolean(),
  confinedSpace: z.coerce.boolean(),
  hotWorkRestrictedArea: z.coerce.boolean(),
  psvProtected: z.coerce.boolean(),
  psvTag: z.string().optional(),
  sisProtected: z.coerce.boolean(),
  sisFunctionTag: z.string().optional(),
  esdValveAssociated: z.coerce.boolean(),
  esdValveTag: z.string().optional(),
  alarmTags: z.string().optional(),
  interlockTags: z.string().optional(),
  hazardousAreaClassification: z.string().optional(),
  classification: z.string().optional(),
  mechanicalIntegrityCategory: z.string().optional(),
  inspectionCategory: z.string().optional(),
  rbiPriority: z.enum(criticalityValues).optional(),
  maintenancePriority: z.enum(criticalityValues).optional(),
  areaClassification: z.string().optional(),
  environmentalCriticality: z.enum(criticalityValues).optional(),
  productionCriticality: z.enum(criticalityValues).optional()
});

type EquipmentFormValues = z.infer<typeof schema>;

export function EquipmentForm({
  equipment,
  defaultValues,
  title,
  submitLabel = 'Save Equipment',
  onCancel,
  surface = 'page',
  onSave
}: {
  equipment?: Equipment;
  defaultValues?: Partial<CreateEquipmentInput>;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
  surface?: 'page' | 'modal';
  onSave?: (values: Partial<CreateEquipmentInput>) => void | Promise<void>;
}) {
  const [pendingSave, setPendingSave] = useState<EquipmentFormValues | null>(null);
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(equipment, defaultValues)
  });

  async function submit(values: EquipmentFormValues) {
    const entries = Object.entries(values)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value] as const)
      .filter(([, value]) => value !== '' && value !== undefined && !(typeof value === 'number' && Number.isNaN(value)));
    const cleaned = Object.fromEntries(entries) as Partial<CreateEquipmentInput> & { photoUrl?: string };
    const photoUrl = cleaned.photoUrl;
    delete cleaned.photoUrl;
    if (photoUrl) cleaned.metadata = { ...(equipment?.metadata ?? {}), photoUrl };
    if (onSave) await onSave(cleaned);
    else await equipmentService.create(cleaned as CreateEquipmentInput);
  }

  function requestSubmit(values: EquipmentFormValues) {
    if (equipment && form.formState.isDirty) setPendingSave(values);
    else void submit(values);
  }

  const stickyTop = surface === 'modal' ? 'top-0' : 'top-16';

  const formShell = surface === 'modal' ? 'bg-transparent' : 'psm-card p-5';
  const headerOffset = surface === 'modal' ? 'mb-5 -mx-5 -mt-5 px-5 py-4' : '-mx-5 -mt-5 mb-5 px-5 py-4';

  return (
    <form onSubmit={form.handleSubmit(requestSubmit)} className={formShell}>
      <div className={`sticky ${stickyTop} z-10 ${headerOffset} flex flex-col gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] lg:flex-row lg:items-center lg:justify-between`}>
        <div>
          <h1 className="text-2xl font-semibold">{title ?? (equipment ? 'Equipment Details' : 'New Equipment')}</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Required fields are marked. Validation runs before save and every save is audited by the API.</p>
          {form.formState.isDirty ? <div className="mt-3 inline-flex rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">Unsaved changes</div> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {onCancel ? <button type="button" onClick={onCancel} className="psm-button psm-button-secondary">Close</button> : null}
          <button type="button" disabled={!form.formState.isDirty} onClick={() => form.reset()} className="psm-button psm-button-secondary"><RotateCcw size={16} /> Cancel Changes</button>
          <button className="psm-button psm-button-primary" type="submit" disabled={form.formState.isSubmitting}><Save size={16} /> {form.formState.isSubmitting ? 'Saving...' : submitLabel}</button>
        </div>
      </div>
      <Section title="Identity">
        <Input name="tag" label="Equipment Tag" form={form} required />
        <Input name="name" label="Equipment Name" form={form} required />
        <Input name="photoUrl" label="Equipment Image / Photo URL" form={form} />
        <Input name="type" label="Equipment Type" form={form} required />
        <Input name="subtype" label="Equipment Sub-Type" form={form} />
        <Select name="status" label="Equipment Status" form={form} options={statusValues} />
        <Input name="manufacturer" label="Manufacturer" form={form} />
        <Input name="model" label="Model Number" form={form} />
        <Input name="serialNumber" label="Serial Number" form={form} />
        <Input name="nameplateNumber" label="Nameplate Number" form={form} />
        <Input name="fabricationYear" label="Fabrication Year" form={form} />
        <Input name="commissionDate" label="Commission Date" type="date" form={form} />
        <Input name="installationDate" label="Installation Date" type="date" form={form} />
        <Input name="vendorSupplier" label="Vendor / Supplier" form={form} />
        <Input name="warrantyExpiryDate" label="Warranty Expiry Date" type="date" form={form} />
        <TextArea name="description" label="Full Description" form={form} />
      </Section>
      <Section title="Location">
        <Input name="companyName" label="Company" form={form} />
        <Input name="siteId" label="Site ID" form={form} required />
        <Input name="unitId" label="Process Unit ID" form={form} required />
        <Input name="areaId" label="Area ID" form={form} />
        <Input name="systemName" label="System / Service" form={form} />
        <Input name="buildingZone" label="Building / Zone" form={form} />
        <Input name="gpsLatitude" label="GPS Latitude" form={form} />
        <Input name="gpsLongitude" label="GPS Longitude" form={form} />
      </Section>
      <Section title="Design Data">
        <Input name="designPressure" label="Design Pressure / MAWP" form={form} />
        <Input name="designPressureUnit" label="Design Pressure Unit" form={form} />
        <Input name="designTemperature" label="Design Temperature" form={form} />
        <Input name="designTemperatureUnit" label="Design Temperature Unit" form={form} />
        <Input name="designFlow" label="Design Flow" form={form} />
        <Input name="designFlowUnit" label="Design Flow Unit" form={form} />
        <Input name="designCapacity" label="Design Capacity" form={form} />
        <Input name="designCapacityUnit" label="Design Capacity Unit" form={form} />
        <Input name="materialOfConstruction" label="Material of Construction" form={form} />
        <Input name="corrosionAllowance" label="Corrosion Allowance" form={form} />
        <Input name="designCode" label="Design Code / Standard" form={form} />
        <Input name="designBasisDocumentRef" label="Design Basis Document Reference" form={form} />
      </Section>
      <Section title="Operating Data">
        <Input name="operatingPressure" label="Normal Operating Pressure" form={form} />
        <Input name="operatingPressureUnit" label="Operating Pressure Unit" form={form} />
        <Input name="operatingTemperature" label="Normal Operating Temperature" form={form} />
        <Input name="operatingTemperatureUnit" label="Operating Temperature Unit" form={form} />
        <Input name="normalFlowRate" label="Normal Flow Rate" form={form} />
        <Input name="flowUnit" label="Flow Unit" form={form} />
        <Input name="normalCapacityLoad" label="Normal Capacity / Load" form={form} />
        <Input name="capacityUnit" label="Capacity Unit" form={form} />
        <Input name="operatingMode" label="Operating Mode" form={form} />
        <Input name="operatingDuty" label="Operating Duty" form={form} />
      </Section>
      <Section title="Fluid And Hazard">
        <Input name="phase" label="Phase" form={form} />
        <Input name="serviceType" label="Service Type" form={form} />
        <Input name="fluidName" label="Fluid Name" form={form} />
        <Input name="fluidService" label="Fluid Service" form={form} />
        <Input name="fluidPhase" label="Fluid Phase" form={form} />
        <Input name="hazardClass" label="Hazard Class" form={form} />
        <Input name="sdsReference" label="SDS Reference" form={form} />
        <Input name="exposureLimits" label="Exposure Limits" form={form} />
        <Input name="toxicityClass" label="Toxicity Class" form={form} />
        <Input name="flammabilityClass" label="Flammability Class" form={form} />
        <Input name="corrosivityClass" label="Corrosivity Class" form={form} />
        <Input name="environmentalImpact" label="Environmental Impact" form={form} />
        <TextArea name="compositionNotes" label="Normal Composition / Mixture Notes" form={form} />
        <TextArea name="processChemistryNotes" label="Process Chemistry Notes" form={form} />
      </Section>
      <Section title="Safety And Protection">
        <Toggle name="safetyCritical" label="Safety Critical Element" form={form} />
        <Toggle name="lotoRequired" label="LOTO Required" form={form} />
        <Toggle name="confinedSpace" label="Confined Space" form={form} />
        <Toggle name="hotWorkRestrictedArea" label="Hot Work Restricted Area" form={form} />
        <Toggle name="psvProtected" label="PSV Protected" form={form} />
        <Input name="psvTag" label="PSV Tag" form={form} />
        <Toggle name="sisProtected" label="SIS Protected" form={form} />
        <Input name="sisFunctionTag" label="SIS Function Tag" form={form} />
        <Toggle name="esdValveAssociated" label="ESD Valve Associated" form={form} />
        <Input name="esdValveTag" label="ESD Valve Tag" form={form} />
        <Input name="alarmTags" label="Alarm Tags" form={form} />
        <Input name="interlockTags" label="Interlock Tags" form={form} />
      </Section>
      <Section title="Classification And Priorities">
        <Input name="hazardousAreaClassification" label="Hazardous Area Classification" form={form} />
        <Input name="classification" label="Equipment Classification" form={form} />
        <Input name="mechanicalIntegrityCategory" label="Mechanical Integrity Category" form={form} />
        <Input name="inspectionCategory" label="Inspection Category" form={form} />
        <Select name="criticality" label="Criticality" form={form} options={criticalityValues} />
        <Select name="rbiPriority" label="RBI Priority" form={form} options={criticalityValues} allowEmpty />
        <Select name="maintenancePriority" label="Maintenance Priority" form={form} options={criticalityValues} allowEmpty />
        <Input name="areaClassification" label="Area Classification" form={form} />
        <Select name="environmentalCriticality" label="Environmental Criticality" form={form} options={criticalityValues} allowEmpty />
        <Select name="productionCriticality" label="Production Criticality" form={form} options={criticalityValues} allowEmpty />
      </Section>
      {pendingSave ? (
        <ConfirmDialog
          title="Save equipment changes?"
          message="This will update the live equipment record and create an audit event for the changed fields."
          confirmLabel="Save Changes"
          tone="primary"
          onCancel={() => setPendingSave(null)}
          onConfirm={async () => {
            await submit(pendingSave);
            setPendingSave(null);
          }}
        />
      ) : null}
    </form>
  );
}

function buildDefaults(equipment?: Equipment, defaultValues?: Partial<CreateEquipmentInput>): EquipmentFormValues {
  const photoUrl = typeof equipment?.metadata?.photoUrl === 'string' ? equipment.metadata.photoUrl : '';
  return {
    siteId: defaultValues?.siteId ?? equipment?.siteId ?? '',
    unitId: defaultValues?.unitId ?? equipment?.unitId ?? '',
    areaId: defaultValues?.areaId ?? equipment?.areaId ?? '',
    parentId: defaultValues?.parentId ?? equipment?.parentId ?? '',
    tag: defaultValues?.tag ?? equipment?.tag ?? '',
    name: defaultValues?.name ?? equipment?.name ?? '',
    description: defaultValues?.description ?? equipment?.description ?? '',
    photoUrl,
    type: defaultValues?.type ?? equipment?.type ?? 'Pump',
    subtype: defaultValues?.subtype ?? equipment?.subtype ?? '',
    status: defaultValues?.status ?? equipment?.status ?? 'ACTIVE',
    criticality: defaultValues?.criticality ?? equipment?.criticality ?? 'MEDIUM',
    manufacturer: defaultValues?.manufacturer ?? equipment?.manufacturer ?? '',
    model: defaultValues?.model ?? equipment?.model ?? '',
    serialNumber: defaultValues?.serialNumber ?? equipment?.serialNumber ?? '',
    nameplateNumber: defaultValues?.nameplateNumber ?? equipment?.nameplateNumber ?? '',
    fabricationYear: defaultValues?.fabricationYear ?? equipment?.fabricationYear ?? undefined,
    commissionDate: defaultValues?.commissionDate ?? equipment?.commissionDate?.slice(0, 10) ?? '',
    installationDate: defaultValues?.installationDate ?? equipment?.installationDate?.slice(0, 10) ?? '',
    vendorSupplier: defaultValues?.vendorSupplier ?? equipment?.vendorSupplier ?? '',
    warrantyExpiryDate: defaultValues?.warrantyExpiryDate ?? equipment?.warrantyExpiryDate?.slice(0, 10) ?? '',
    companyName: defaultValues?.companyName ?? equipment?.companyName ?? '',
    systemName: defaultValues?.systemName ?? equipment?.systemName ?? '',
    buildingZone: defaultValues?.buildingZone ?? equipment?.buildingZone ?? '',
    gpsLatitude: typeof equipment?.gpsLatitude === 'number' ? equipment.gpsLatitude : equipment?.gpsLatitude ? Number(equipment.gpsLatitude) : undefined,
    gpsLongitude: typeof equipment?.gpsLongitude === 'number' ? equipment.gpsLongitude : equipment?.gpsLongitude ? Number(equipment.gpsLongitude) : undefined,
    designPressure: defaultValues?.designPressure ?? equipment?.designPressure ?? '',
    designPressureUnit: defaultValues?.designPressureUnit ?? equipment?.designPressureUnit ?? '',
    designTemperature: defaultValues?.designTemperature ?? equipment?.designTemperature ?? '',
    designTemperatureUnit: defaultValues?.designTemperatureUnit ?? equipment?.designTemperatureUnit ?? '',
    designFlow: defaultValues?.designFlow ?? equipment?.designFlow ?? '',
    designFlowUnit: defaultValues?.designFlowUnit ?? equipment?.designFlowUnit ?? '',
    designCapacity: defaultValues?.designCapacity ?? equipment?.designCapacity ?? '',
    designCapacityUnit: defaultValues?.designCapacityUnit ?? equipment?.designCapacityUnit ?? '',
    materialOfConstruction: defaultValues?.materialOfConstruction ?? equipment?.materialOfConstruction ?? '',
    corrosionAllowance: defaultValues?.corrosionAllowance ?? equipment?.corrosionAllowance ?? '',
    designCode: defaultValues?.designCode ?? equipment?.designCode ?? '',
    designBasisDocumentRef: defaultValues?.designBasisDocumentRef ?? equipment?.designBasisDocumentRef ?? '',
    operatingPressure: defaultValues?.operatingPressure ?? equipment?.operatingPressure ?? '',
    operatingPressureUnit: defaultValues?.operatingPressureUnit ?? equipment?.operatingPressureUnit ?? '',
    operatingTemperature: defaultValues?.operatingTemperature ?? equipment?.operatingTemperature ?? '',
    operatingTemperatureUnit: defaultValues?.operatingTemperatureUnit ?? equipment?.operatingTemperatureUnit ?? '',
    normalFlowRate: defaultValues?.normalFlowRate ?? equipment?.normalFlowRate ?? '',
    flowUnit: defaultValues?.flowUnit ?? equipment?.flowUnit ?? '',
    normalCapacityLoad: defaultValues?.normalCapacityLoad ?? equipment?.normalCapacityLoad ?? '',
    capacityUnit: defaultValues?.capacityUnit ?? equipment?.capacityUnit ?? '',
    operatingMode: defaultValues?.operatingMode ?? equipment?.operatingMode ?? '',
    operatingDuty: defaultValues?.operatingDuty ?? equipment?.operatingDuty ?? '',
    phase: defaultValues?.phase ?? equipment?.phase ?? '',
    serviceType: defaultValues?.serviceType ?? equipment?.serviceType ?? '',
    fluidName: defaultValues?.fluidName ?? equipment?.fluidName ?? '',
    fluidService: defaultValues?.fluidService ?? equipment?.fluidService ?? '',
    fluidPhase: defaultValues?.fluidPhase ?? equipment?.fluidPhase ?? '',
    hazardClass: defaultValues?.hazardClass ?? equipment?.hazardClass ?? '',
    sdsReference: defaultValues?.sdsReference ?? equipment?.sdsReference ?? '',
    exposureLimits: defaultValues?.exposureLimits ?? equipment?.exposureLimits ?? '',
    toxicityClass: defaultValues?.toxicityClass ?? equipment?.toxicityClass ?? '',
    flammabilityClass: defaultValues?.flammabilityClass ?? equipment?.flammabilityClass ?? '',
    corrosivityClass: defaultValues?.corrosivityClass ?? equipment?.corrosivityClass ?? '',
    environmentalImpact: defaultValues?.environmentalImpact ?? equipment?.environmentalImpact ?? '',
    compositionNotes: defaultValues?.compositionNotes ?? equipment?.compositionNotes ?? '',
    processChemistryNotes: defaultValues?.processChemistryNotes ?? equipment?.processChemistryNotes ?? '',
    safetyCritical: defaultValues?.safetyCritical ?? equipment?.safetyCritical ?? false,
    lotoRequired: defaultValues?.lotoRequired ?? equipment?.lotoRequired ?? false,
    confinedSpace: defaultValues?.confinedSpace ?? equipment?.confinedSpace ?? false,
    hotWorkRestrictedArea: defaultValues?.hotWorkRestrictedArea ?? equipment?.hotWorkRestrictedArea ?? false,
    psvProtected: defaultValues?.psvProtected ?? equipment?.psvProtected ?? false,
    psvTag: defaultValues?.psvTag ?? equipment?.psvTag ?? '',
    sisProtected: defaultValues?.sisProtected ?? equipment?.sisProtected ?? false,
    sisFunctionTag: defaultValues?.sisFunctionTag ?? equipment?.sisFunctionTag ?? '',
    esdValveAssociated: defaultValues?.esdValveAssociated ?? equipment?.esdValveAssociated ?? false,
    esdValveTag: defaultValues?.esdValveTag ?? equipment?.esdValveTag ?? '',
    alarmTags: defaultValues?.alarmTags ?? equipment?.alarmTags ?? '',
    interlockTags: defaultValues?.interlockTags ?? equipment?.interlockTags ?? '',
    hazardousAreaClassification: defaultValues?.hazardousAreaClassification ?? equipment?.hazardousAreaClassification ?? '',
    classification: defaultValues?.classification ?? equipment?.classification ?? '',
    mechanicalIntegrityCategory: defaultValues?.mechanicalIntegrityCategory ?? equipment?.mechanicalIntegrityCategory ?? '',
    inspectionCategory: defaultValues?.inspectionCategory ?? equipment?.inspectionCategory ?? '',
    rbiPriority: defaultValues?.rbiPriority ?? equipment?.rbiPriority ?? undefined,
    maintenancePriority: defaultValues?.maintenancePriority ?? equipment?.maintenancePriority ?? undefined,
    areaClassification: defaultValues?.areaClassification ?? equipment?.areaClassification ?? '',
    environmentalCriticality: defaultValues?.environmentalCriticality ?? equipment?.environmentalCriticality ?? undefined,
    productionCriticality: defaultValues?.productionCriticality ?? equipment?.productionCriticality ?? undefined
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 border-b border-[var(--psm-line)] pb-2 text-sm font-semibold uppercase tracking-wide text-[var(--psm-text)]">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function Input({ form, name, label, type = 'text', required = false }: { form: ReturnType<typeof useForm<EquipmentFormValues>>; name: keyof EquipmentFormValues; label: string; type?: string; required?: boolean }) {
  const error = form.formState.errors[name]?.message;
  return (
    <label className="text-sm">
      <span className="mb-2 block font-medium text-[var(--psm-muted)]">{label}{required ? <span className="text-danger"> *</span> : null}</span>
      <input type={type} {...form.register(name)} aria-invalid={Boolean(error)} className={`psm-input w-full px-3 text-sm ${error ? 'border-danger' : ''}`} />
      {error ? <span className="mt-1 block text-xs text-danger">{String(error)}</span> : null}
    </label>
  );
}

function TextArea({ form, name, label }: { form: ReturnType<typeof useForm<EquipmentFormValues>>; name: keyof EquipmentFormValues; label: string }) {
  const error = form.formState.errors[name]?.message;
  return (
    <label className="text-sm md:col-span-2 xl:col-span-3">
      <span className="mb-2 block font-medium text-[var(--psm-muted)]">{label}</span>
      <textarea {...form.register(name)} aria-invalid={Boolean(error)} className={`psm-input min-h-24 w-full p-3 text-sm ${error ? 'border-danger' : ''}`} />
      {error ? <span className="mt-1 block text-xs text-danger">{String(error)}</span> : null}
    </label>
  );
}

function Select({ form, name, label, options, allowEmpty = false }: { form: ReturnType<typeof useForm<EquipmentFormValues>>; name: keyof EquipmentFormValues; label: string; options: readonly string[]; allowEmpty?: boolean }) {
  const error = form.formState.errors[name]?.message;
  return (
    <label className="text-sm">
      <span className="mb-2 block font-medium text-[var(--psm-muted)]">{label}</span>
      <select {...form.register(name)} aria-invalid={Boolean(error)} className={`psm-input w-full px-3 text-sm ${error ? 'border-danger' : ''}`}>
        {allowEmpty ? <option value="">Not Set</option> : null}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error ? <span className="mt-1 block text-xs text-danger">{String(error)}</span> : null}
    </label>
  );
}

function Toggle({ form, name, label }: { form: ReturnType<typeof useForm<EquipmentFormValues>>; name: keyof EquipmentFormValues; label: string }) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]">
      <input type="checkbox" {...form.register(name)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}
