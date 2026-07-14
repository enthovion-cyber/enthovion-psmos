'use client';

import type { Equipment } from '@/services/equipment.service';
import { QRCodeDisplay } from './QRCodeDisplay';
import { EquipmentField } from './EquipmentField';
import { Camera, MapPin } from 'lucide-react';

export function EquipmentHeader({ equipment }: { equipment: Equipment }) {
  const photoUrl = typeof equipment.metadata?.photoUrl === 'string' ? equipment.metadata.photoUrl : null;
  const location = [
    equipment.companyName,
    equipment.site?.name,
    equipment.unit?.name,
    equipment.area?.name,
    equipment.systemName
  ].filter(Boolean);
  return (
    <section className="psm-card overflow-hidden">
      <div className="flex flex-col gap-5 p-5 xl:flex-row">
        <div className="relative h-52 w-full overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[linear-gradient(135deg,var(--psm-surface-3),var(--psm-surface-2))] xl:h-44 xl:w-80">
          {photoUrl ? <img src={photoUrl} alt={equipment.name} className="h-full w-full object-cover" /> : (
            <div className="grid h-full place-items-center text-sm text-[var(--psm-muted)]">
              <div className="text-center">
                <Camera className="mx-auto mb-2" size={26} />
                No equipment photo
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
            <span className="h-2 w-2 rounded-full bg-success" /> {equipment.status.replaceAll('_', ' ')}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{equipment.tag}</h1>
            <span className="psm-badge psm-badge-muted">{equipment.type.toUpperCase()}</span>
            <span className={`psm-badge ${equipment.criticality === 'LOW' ? 'psm-badge-success' : equipment.criticality === 'MEDIUM' ? 'psm-badge-warning' : 'psm-badge-danger'}`}>{equipment.criticality.replaceAll('_', ' ')}</span>
          </div>
          <p className="mt-2 text-xl text-[var(--psm-text)]">{equipment.name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <MapPin size={14} className="text-[var(--psm-muted)]" />
            {location.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-2">
                <span className="rounded-md bg-[var(--psm-surface-2)] px-2 py-1 text-[var(--psm-muted)]">{item}</span>
                {index < location.length - 1 ? <span className="text-[var(--psm-muted)]">›</span> : null}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-4 border-t border-[var(--psm-line)] pt-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <EquipmentField label="Equipment Type" value={`${equipment.type}${equipment.subtype ? ` - ${equipment.subtype}` : ''}`} />
            <EquipmentField label="Manufacturer" value={equipment.manufacturer} />
            <EquipmentField label="Model" value={equipment.model} />
            <EquipmentField label="Serial Number" value={equipment.serialNumber} />
            <EquipmentField label="Commission Date" value={equipment.commissionDate ? new Date(equipment.commissionDate).toLocaleDateString() : undefined} />
            <EquipmentField label="Fabrication Year" value={equipment.fabricationYear} />
          </div>
        </div>
        <div className="shrink-0 self-start"><QRCodeDisplay value={equipment.qrCodePayload} /></div>
      </div>
    </section>
  );
}
