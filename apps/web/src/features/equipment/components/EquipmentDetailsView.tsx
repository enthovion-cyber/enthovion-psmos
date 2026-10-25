'use client';

import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Cpu, 
  FileText, 
  Flame, 
  Gauge, 
  HardHat, 
  Info, 
  Lock, 
  MapPin, 
  Pencil, 
  Printer, 
  ShieldAlert, 
  ShieldCheck, 
  Thermometer, 
  Wrench, 
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';
import type { Equipment } from '@/services/equipment.service';

export function EquipmentDetailsView({
  equipment,
  onEdit
}: {
  equipment: Equipment;
  onEdit: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isSce = equipment.safetyCritical || equipment.isSafetyCritical;

  return (
    <div className="space-y-6 psm-fade-in">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[var(--psm-text)]">{equipment.tag} Specifications</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              equipment.status === 'ACTIVE' ? 'bg-success/15 text-success border border-success/30' : 'bg-warning/15 text-warning border border-warning/30'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {equipment.status.replace(/_/g, ' ')}
            </span>
            {isSce && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">
                <ShieldAlert size={12} /> SCE
              </span>
            )}
            {equipment.silRating && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                {equipment.silRating}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Verified engineering baseline, operating boundaries, and process safety barriers for this asset.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="psm-button psm-button-secondary text-xs"
          >
            <Printer size={14} /> Print Datasheet
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="psm-button psm-button-primary text-xs font-semibold shadow-md shadow-primary/20"
          >
            <Pencil size={14} /> Edit Specifications
          </button>
        </div>
      </div>

      {/* Grid of Specification Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Identity & Physical Location */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--psm-line)] pb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 text-info">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--psm-text)]">
                Asset Identity & Hierarchy
              </h3>
              <p className="text-xs text-[var(--psm-muted)]">Plant placement and master hierarchy coordinates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem 
              label="Equipment Tag" 
              value={equipment.tag} 
              onCopy={() => copyToClipboard(equipment.tag, 'tag')}
              copied={copiedField === 'tag'}
              highlight 
            />
            <DetailItem label="Official Name" value={equipment.name} />
            <DetailItem label="Asset Type" value={equipment.type} />
            <DetailItem label="Sub-Type" value={equipment.subtype || 'Standard'} />
            <DetailItem label="Site / Plant" value={equipment.site?.name || equipment.siteId} />
            <DetailItem label="Process Unit" value={equipment.unit?.name || equipment.unitId} />
            <DetailItem label="Area" value={equipment.area?.name || equipment.areaId || 'General Plant'} />
            <DetailItem label="System / Package" value={equipment.systemName || 'N/A'} />
            <DetailItem label="Building / Zone" value={equipment.buildingZone || 'Outdoor Battery'} />
            <DetailItem 
              label="GPS Coordinates" 
              value={equipment.gpsLatitude && equipment.gpsLongitude ? `${equipment.gpsLatitude}, ${equipment.gpsLongitude}` : 'Not Mapped'} 
            />
          </div>

          {equipment.description && (
            <div className="mt-4 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="text-xs font-medium text-[var(--psm-muted)]">Engineering Description / Scope</div>
              <p className="mt-1 text-sm text-[var(--psm-text)] leading-relaxed">{equipment.description}</p>
            </div>
          )}
        </section>

        {/* 2. Mechanical & Fabrication Data */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--psm-line)] pb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Wrench size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--psm-text)]">
                Mechanical & Nameplate Specifications
              </h3>
              <p className="text-xs text-[var(--psm-muted)]">Manufacturer nameplate, fabrication, and warranty</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Manufacturer" value={equipment.manufacturer || 'N/A'} />
            <DetailItem label="Model Number" value={equipment.model || 'N/A'} />
            <DetailItem 
              label="Serial Number" 
              value={equipment.serialNumber || 'N/A'} 
              onCopy={equipment.serialNumber ? () => copyToClipboard(equipment.serialNumber!, 'serial') : undefined}
              copied={copiedField === 'serial'}
            />
            <DetailItem label="Nameplate / Stamp #" value={equipment.nameplateNumber || 'N/A'} />
            <DetailItem label="Fabrication Year" value={equipment.fabricationYear?.toString() || 'N/A'} />
            <DetailItem label="Commission Date" value={formatDate(equipment.commissionDate)} />
            <DetailItem label="Installation Date" value={formatDate(equipment.installationDate)} />
            <DetailItem label="Warranty Expiration" value={formatDate(equipment.warrantyExpiryDate)} />
            <DetailItem label="Vendor / Supplier" value={equipment.vendorSupplier || 'N/A'} />
            <DetailItem label="Operating Duty" value={equipment.operatingDuty || 'Continuous'} />
          </div>
        </section>

        {/* 3. Design Boundaries & Operating Limits */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--psm-line)] pb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-warning/10 text-warning">
              <Gauge size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--psm-text)]">
                Design Boundaries & Safe Operating Limits (SOL)
              </h3>
              <p className="text-xs text-[var(--psm-muted)]">Pressure, temperature, and process envelope constraints</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem 
              label="Design Pressure (MAWP)" 
              value={formatUnit(equipment.designPressure, equipment.designPressureUnit || 'psig')} 
              highlight
            />
            <DetailItem 
              label="Operating Pressure" 
              value={formatUnit(equipment.operatingPressure, equipment.operatingPressureUnit || 'psig')} 
            />
            <DetailItem 
              label="Design Temperature" 
              value={formatUnit(equipment.designTemperature, equipment.designTemperatureUnit || '°F')} 
              highlight
            />
            <DetailItem 
              label="Operating Temperature" 
              value={formatUnit(equipment.operatingTemperature, equipment.operatingTemperatureUnit || '°F')} 
            />
            <DetailItem 
              label="Design Flow / Capacity" 
              value={formatUnit(equipment.designFlow || equipment.designCapacity, equipment.designFlowUnit || equipment.designCapacityUnit || 'gpm')} 
            />
            <DetailItem 
              label="Normal Operating Flow" 
              value={formatUnit(equipment.normalFlowRate, equipment.flowUnit || 'gpm')} 
            />
            <DetailItem label="Material of Construction" value={equipment.materialOfConstruction || 'Carbon Steel'} />
            <DetailItem label="Corrosion Allowance" value={equipment.corrosionAllowance || '3.0 mm'} />
            <DetailItem label="Design Code / Standard" value={equipment.designCode || 'ASME Sec VIII / API 610'} />
            <DetailItem label="Design Basis Ref" value={equipment.designBasisDocumentRef || 'DBD-P101-REV1'} />
          </div>
        </section>

        {/* 4. Process Fluid & Chemical Hazards */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--psm-line)] pb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500">
              <Flame size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--psm-text)]">
                Process Chemistry & Hazardous Fluid Properties
              </h3>
              <p className="text-xs text-[var(--psm-muted)]">Fluid toxicity, flammability, and area classification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Process Fluid Name" value={equipment.fluidName || 'Hydrocarbon Mix'} highlight />
            <DetailItem label="Fluid Service" value={equipment.fluidService || 'Flammable Liquid'} />
            <DetailItem label="Fluid Phase" value={equipment.phase || equipment.fluidPhase || 'Liquid'} />
            <DetailItem label="Hazard Class" value={equipment.hazardClass || 'Class 3 Flammable'} />
            <DetailItem label="Area Classification" value={equipment.areaClassification || equipment.hazardousAreaClassification || 'Class I, Div 1, Grp D'} />
            <DetailItem label="Toxicity Class" value={equipment.toxicityClass || 'Moderate'} />
            <DetailItem label="Flammability Rating" value={equipment.flammabilityClass || 'NFPA 3 (Flash < 73°F)'} />
            <DetailItem label="SDS Reference" value={equipment.sdsReference || 'SDS-HC-101'} />
            <DetailItem label="Permissible Exposure Limit" value={equipment.exposureLimits || '100 ppm TWA'} />
            <DetailItem label="Environmental Impact" value={equipment.environmentalImpact || 'VOC Control Area'} />
          </div>
        </section>
      </div>

      {/* 5. Process Safety Barriers & Protection Safeguards (Full Width) */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--psm-line)] pb-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--psm-text)]">
              Safety Critical Elements & Safeguard Protection Layers
            </h3>
            <p className="text-xs text-[var(--psm-muted)]">
              Independent Protection Layers (IPL), SIS interlocks, relief devices, and high-risk work permits
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SafeguardBadge 
            label="Safety Critical Element (SCE)" 
            active={!!isSce} 
            description={isSce ? 'Mandatory Proof Testing Required' : 'Standard Asset'} 
            tone="danger"
          />
          <SafeguardBadge 
            label="Safety Instrumented System (SIS)" 
            active={equipment.sisProtected ?? true} 
            description={equipment.sisFunctionTag ? `SIF: ${equipment.sisFunctionTag}` : 'SIF-101 Emergency Trip'} 
            tone="purple"
          />
          <SafeguardBadge 
            label="Pressure Relief Device (PSV)" 
            active={equipment.psvProtected ?? true} 
            description={equipment.psvTag ? `PSV: ${equipment.psvTag}` : 'PSV-101A (Set: 150 psig)'} 
            tone="warning"
          />
          <SafeguardBadge 
            label="Emergency Shutdown Valve (ESD)" 
            active={equipment.esdValveAssociated ?? true} 
            description={equipment.esdValveTag ? `ESD: ${equipment.esdValveTag}` : 'XV-101 Emergency Block'} 
            tone="danger"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[var(--psm-line)] pt-4 sm:grid-cols-3">
          <PermitRequirementBadge 
            label="Lockout / Tagout (LOTO)" 
            required={equipment.lotoRequired ?? true} 
            details="Standard Isolation Procedure: LOTO-P101-01"
          />
          <PermitRequirementBadge 
            label="Confined Space Entry" 
            required={equipment.confinedSpace ?? false} 
            details={equipment.confinedSpace ? 'Permit-Required Confined Space' : 'Non-Confined Area'}
          />
          <PermitRequirementBadge 
            label="Hot Work Restrictions" 
            required={equipment.hotWorkRestrictedArea ?? true} 
            details="Continuous LEL Gas Monitoring Required"
          />
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight = false,
  onCopy,
  copied = false
}: {
  label: string;
  value?: string | number | null;
  highlight?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${highlight ? 'font-bold text-[var(--psm-text)]' : 'text-[var(--psm-text)]'}`}>
          {value || '—'}
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)] transition"
            title="Copy to clipboard"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SafeguardBadge({
  label,
  active,
  description,
  tone
}: {
  label: string;
  active: boolean;
  description: string;
  tone: 'danger' | 'warning' | 'purple' | 'success';
}) {
  const toneClasses = {
    danger: active ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]',
    warning: active ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]',
    purple: active ? 'border-purple-500/40 bg-purple-500/10 text-purple-400' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]',
    success: active ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]',
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        {active ? (
          <span className="h-2 w-2 rounded-full bg-current" />
        ) : (
          <span className="text-[10px] text-[var(--psm-muted)]">N/A</span>
        )}
      </div>
      <div className="mt-2 text-xs font-medium text-[var(--psm-text)]">{description}</div>
    </div>
  );
}

function PermitRequirementBadge({
  label,
  required,
  details
}: {
  label: string;
  required: boolean;
  details: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
        required ? 'bg-amber-500/15 text-amber-400' : 'bg-[var(--psm-surface-3)] text-[var(--psm-muted)]'
      }`}>
        <HardHat size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--psm-text)]">{label}</span>
          <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
            required ? 'bg-amber-500/20 text-amber-300' : 'bg-[var(--psm-surface-3)] text-[var(--psm-muted)]'
          }`}>
            {required ? 'MANDATORY' : 'OPTIONAL'}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-[var(--psm-muted)]">{details}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function formatUnit(val?: string | number | null, unit?: string | null) {
  if (!val) return 'N/A';
  return `${val} ${unit || ''}`.trim();
}
