import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

interface OptionItem {
  id: string | number;
  label?: string;
  name?: string;
}

interface ScopeProps {
  value: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  sites?: OptionItem[];
  departments?: OptionItem[];
  areas?: OptionItem[];
  loading?: boolean;
}

export function UnitLocationScopeSection({
  value,
  onChange,
  sites = [],
  departments = [],
  areas = [],
  loading
}: ScopeProps) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ [event.target.name]: event.target.value });
  };

  const selectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value: selectedVal } = event.target;
    if (name === 'site_id') {
      onChange({ site_id: selectedVal, department_id: '', area_id: '' });
    } else if (name === 'department_id') {
      onChange({ department_id: selectedVal, area_id: '' });
    } else {
      onChange({ [name]: selectedVal });
    }
  };

  // Safe checks ensuring arrays are passed down
  const safeSites = Array.isArray(sites) ? sites : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeAreas = Array.isArray(areas) ? areas : [];

  return (
    <PsiCard
      title="2. Location / Scope"
      subtitle="Company/site scope is enforced by backend; linked items must remain in the same company/site."
    >
      {loading ? (
        <p className="mb-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs text-[var(--psm-muted)]">
          Loading scoped site, department, and area options...
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          name="site_id"
          label="Site"
          value={value.site_id}
          onChange={selectChange}
          options={safeSites}
          required
          emptyLabel={safeSites.length ? 'Select site' : 'No accessible sites found'}
        />
        <Select
          name="department_id"
          label="Department"
          value={value.department_id}
          onChange={selectChange}
          options={safeDepartments}
          emptyLabel={value.site_id ? 'Select department' : 'Select site first'}
        />
        <Select
          name="area_id"
          label="Area"
          value={value.area_id}
          onChange={selectChange}
          options={safeAreas}
          emptyLabel={value.site_id ? 'Select area' : 'Select site first'}
        />
        <Field
          name="building_location"
          label="Building/location"
          value={value.building_location}
          onChange={change}
        />
        <Text
          name="battery_limits"
          label="Battery limits"
          value={value.battery_limits}
          onChange={change}
        />
        <Text
          name="upstream_units_json"
          label="Upstream units"
          value={value.upstream_units_json}
          onChange={change}
        />
        <Text
          name="downstream_units_json"
          label="Downstream units"
          value={value.downstream_units_json}
          onChange={change}
        />
        <Text
          name="utilities_connected_json"
          label="Utilities connected"
          value={value.utilities_connected_json}
          onChange={change}
        />
        <Text
          name="interfaces_json"
          label="Interfaces with other units"
          value={value.interfaces_json}
          onChange={change}
        />
      </div>
    </PsiCard>
  );
}

function Select({ label, required, options, emptyLabel, ...props }: any) {
  // Defensive normalization to prevent runtime .map crashes
  const list = Array.isArray(options) ? options : [];

  return (
    <label className="space-y-1 text-sm font-semibold">
      {label}
      {required ? ' *' : ''}
      <select
        {...props}
        value={props.value ?? ''}
        className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"
      >
        <option value="">{emptyLabel ?? 'Select'}</option>
        {list.map((option: any, index: number) => {
          const optValue = option?.id ?? option?.value ?? index;
          const optLabel = option?.label ?? option?.name ?? optValue;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Field({ label, required, ...props }: any) {
  return (
    <label className="space-y-1 text-sm font-semibold">
      {label}
      {required ? ' *' : ''}
      <input
        {...props}
        value={props.value ?? ''}
        className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"
      />
    </label>
  );
}

function Text({ label, ...props }: any) {
  return (
    <label className="space-y-1 text-sm font-semibold md:col-span-2">
      {label}
      <textarea
        {...props}
        value={Array.isArray(props.value) ? props.value.join(', ') : props.value ?? ''}
        rows={2}
        className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"
      />
    </label>
  );
}