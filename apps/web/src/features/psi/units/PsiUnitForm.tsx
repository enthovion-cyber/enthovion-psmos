'use client';

import { useEffect, useState } from 'react';
import type { PsiUnit } from '../types/psi-unit.types';
import { usePsiUnitFormLookups } from '../hooks/usePsiUnitFormLookups';
import { PsiButton } from '../shared/PsiUi';
import { HazardsSummarySection } from './sections/HazardsSummarySection';
import { LinkedEquipmentSection } from './sections/LinkedEquipmentSection';
import { OwnershipReviewSection } from './sections/OwnershipReviewSection';
import { ProcessDescriptionSection } from './sections/ProcessDescriptionSection';
import { UnitIdentitySection } from './sections/UnitIdentitySection';
import { UnitLocationScopeSection } from './sections/UnitLocationScopeSection';

export function PsiUnitForm({
  initial,
  lookups,
  equipment = [],
  onSubmit,
  isSaving
}: {
  initial?: Partial<PsiUnit> | undefined;
  lookups?: Record<string, string[]> | undefined;
  equipment?: Array<Record<string, any>> | undefined;
  onSubmit: (value: Record<string, any>) => void;
  isSaving?: boolean | undefined;
}) {
  const [value, setValue] = useState<Record<string, any>>(initial ?? {});
  const [errors, setErrors] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const formLookups = usePsiUnitFormLookups({
    siteId: value.site_id,
    departmentId: value.department_id,
    areaId: value.area_id,
    userSearch,
    equipmentSearch
  });

  // Safely extract users array from lookup response
  const rawUserData = Array.isArray(formLookups?.users?.data)
    ? formLookups.users.data
    : Array.isArray(formLookups?.users)
    ? formLookups.users
    : [];

  const userOptions = mergeUsers(rawUserData, selectedProfileOptions(value));

  useEffect(() => {
    const safeEquipment = Array.isArray(equipment) ? equipment : [];
    setValue({
      ...(initial ?? {}),
      linkedEquipment: safeEquipment.map((link) => ({
        id: link.id,
        equipment_id: link.equipment_id,
        relationship_type: link.relationship_type,
        critical_to_unit: link.critical_to_unit,
        primary_equipment: link.primary_equipment,
        relationship_note: link.relationship_note,
        equipment: link.equipment
      }))
    });
  }, [initial?.id, Array.isArray(equipment) ? equipment.length : 0]);

  const patch = (next: Record<string, any>) => setValue((current) => ({ ...current, ...next }));

  const submit = () => {
    const missing = [];
    if (!value.unit_name) missing.push('Unit name');
    if (!value.unit_code) missing.push('Unit code');
    if (!value.site_id) missing.push('Site');
    setErrors(missing);
    if (!missing.length) onSubmit(value);
  };

  return (
    <div className="space-y-5">
      {errors.length ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Missing required fields: {errors.join(', ')}
        </div>
      ) : null}

      <UnitIdentitySection value={value} lookups={lookups} onChange={patch} />

      <UnitLocationScopeSection
        value={value}
        onChange={patch}
        sites={Array.isArray(formLookups?.sites?.data) ? formLookups.sites.data : []}
        departments={Array.isArray(formLookups?.departments?.data) ? formLookups.departments.data : []}
        areas={Array.isArray(formLookups?.areas?.data) ? formLookups.areas.data : []}
        loading={
          Boolean(formLookups?.sites?.isLoading) ||
          Boolean(formLookups?.departments?.isLoading) ||
          Boolean(formLookups?.areas?.isLoading)
        }
      />

      <ProcessDescriptionSection value={value} onChange={patch} />

      <HazardsSummarySection value={value} onChange={patch} />

      <OwnershipReviewSection
        value={value}
        onChange={patch}
        users={userOptions}
        userSearch={userSearch}
        onUserSearch={setUserSearch}
        loading={Boolean(formLookups?.users?.isLoading)}
      />

      <LinkedEquipmentSection
        equipment={Array.isArray(value.linkedEquipment) ? value.linkedEquipment : []}
        equipmentOptions={Array.isArray(formLookups?.equipment?.data) ? formLookups.equipment.data : []}
        equipmentSearch={equipmentSearch}
        onEquipmentSearch={setEquipmentSearch}
        onChange={(linkedEquipment) => patch({ linkedEquipment })}
        loading={Boolean(formLookups?.equipment?.isLoading)}
      />

      <section className="sticky bottom-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">7. Review & Save</p>
            <p className="text-sm text-[var(--psm-muted)]">
              Backend validates site access, unit-code uniqueness, status rules, and audit/history.
            </p>
          </div>
          <PsiButton
            onClick={submit}
            disabled={Boolean(isSaving)}
            title={isSaving ? 'Saving process unit profile' : undefined}
          >
            {isSaving ? 'Saving...' : 'Save Process Unit'}
          </PsiButton>
        </div>
      </section>
    </div>
  );
}

function selectedProfileOptions(value: Record<string, any>) {
  if (!value || typeof value !== 'object') return [];

  const profileKeys = [
    'owner',
    'processEngineer',
    'operationsOwner',
    'hseOwner',
    'documentController',
    'mechanicalMiContact',
    'electricalInstrumentContact',
    'reliefSpecialist'
  ];

  return profileKeys
    .map((key) => value[key])
    .filter((profile): profile is Record<string, any> => Boolean(profile?.id))
    .map((profile) => ({
      id: profile.id,
      displayName: profile.displayName ?? profile.name ?? null,
      email: profile.email ?? null,
      title: profile.title ?? null,
      department: profile.department ?? null,
      status: profile.status ?? null,
      label: `${profile.displayName ?? profile.name ?? profile.email ?? profile.id}${
        profile.email ? ` - ${profile.email}` : ''
      }`
    }));
}

function mergeUsers(users: any, selected: any) {
  const safeUsers = Array.isArray(users) ? users : [];
  const safeSelected = Array.isArray(selected) ? selected : [];

  const byId = new Map<string, Record<string, any>>();

  [...safeSelected, ...safeUsers].forEach((user) => {
    if (user?.id) {
      const key = String(user.id);
      byId.set(key, { ...byId.get(key), ...user });
    }
  });

  return Array.from(byId.values());
}