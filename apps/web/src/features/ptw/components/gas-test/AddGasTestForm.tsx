import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import { useEffect, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { defaultGasTestValues, gasTestSchema, gasTestTypes, ventilationStatuses } from '../../schemas/gas-test.schema';
import type { GasTestValues } from '../../schemas/gas-test.schema';
import type { PermitGasTest } from '../../services/ptw-gas-test.service';

export function AddGasTestForm({ editing, saving, onCancel, onSubmit }: { 
  editing?: PermitGasTest | null; 
  saving?: boolean; 
  onCancel: () => void; 
  onSubmit: (values: GasTestValues) => void 
}) {
  const form = useForm<GasTestValues>({ 
    resolver: zodResolver(gasTestSchema), 
    defaultValues: defaultGasTestValues() 
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        testType: (editing.test_type as GasTestValues['testType']) ?? 'Initial',
        testLocation: editing.test_location ?? 'Permit work area',
        testedAt: editing.tested_at?.slice(0, 16),
        testerId: editing.tester_user_id ?? editing.tester_id ?? undefined,
        testerName: editing.tester_name ?? editing.tester_user_id ?? '',
        instrumentId: editing.instrument_id ?? '',
        instrumentSerialNumber: editing.instrument_serial_number ?? '',
        calibrationDate: editing.calibration_date ?? '',
        calibrationExpiryDate: editing.calibration_expiry_date ?? '',
        ventilationStatus: editing.ventilation_status ?? 'Natural Ventilation',
        weatherCondition: editing.weather_condition ?? '',
        remarks: editing.notes ?? '',
        o2: Number(editing.o2 ?? editing.readings?.find((item) => item.gas_code === 'O2')?.value ?? 20.9),
        lel: Number(editing.lel ?? editing.readings?.find((item) => item.gas_code === 'LEL')?.value ?? 0),
        h2s: valueFor(editing, 'H2S'),
        co: valueFor(editing, 'CO'),
        so2: valueFor(editing, 'SO2'),
        cl2: valueFor(editing, 'CL2'),
        nh3: valueFor(editing, 'NH3'),
        hf: valueFor(editing, 'HF'),
        customGasName: editing.custom_gas_name ?? '',
        customGasValue: editing.custom_gas_value !== undefined && editing.custom_gas_value !== null ? Number(editing.custom_gas_value) : undefined,
        customGasUnit: editing.custom_gas_unit ?? '',
        customGasThreshold: editing.custom_gas_threshold !== undefined && editing.custom_gas_threshold !== null ? Number(editing.custom_gas_threshold) : undefined
      });
    } else {
      form.reset(defaultGasTestValues());
    }
  }, [editing, form]);

  return (
    <section className="psm-card overflow-hidden">
      <div className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">{editing ? 'Edit Gas Test' : 'Add Gas Test'}</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">Backend validates thresholds, calibration, result status, retest interval, audit, and permit blockers.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="psm-button psm-button-secondary" onClick={onCancel}>
              <X size={15} /> Cancel
            </button>
            <button type="submit" form="gas-test-form" disabled={saving} className="psm-button psm-button-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Gas Test'}
            </button>
          </div>
        </div>
      </div>
      <form id="gas-test-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
        <Section title="Test Information">
          <Select label="Test Type" required {...form.register('testType')} error={form.formState.errors.testType?.message}>
            {gasTestTypes.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Field label="Test Location" required {...form.register('testLocation')} error={form.formState.errors.testLocation?.message} />
          <Field label="Test Date / Time" type="datetime-local" required {...form.register('testedAt')} error={form.formState.errors.testedAt?.message} />
          <Field label="Tester Name" required {...form.register('testerName')} error={form.formState.errors.testerName?.message} />
        </Section>
        
        <Section title="Instrument & Environment">
          <Field label="Instrument ID" required {...form.register('instrumentId')} error={form.formState.errors.instrumentId?.message} />
          <Field label="Instrument Serial Number" {...form.register('instrumentSerialNumber')} error={form.formState.errors.instrumentSerialNumber?.message} />
          <Field label="Calibration Date" type="date" required {...form.register('calibrationDate')} error={form.formState.errors.calibrationDate?.message} />
          <Field label="Calibration Expiry Date" type="date" required {...form.register('calibrationExpiryDate')} error={form.formState.errors.calibrationExpiryDate?.message} />
          <Select label="Ventilation Status" required {...form.register('ventilationStatus')} error={form.formState.errors.ventilationStatus?.message}>
            {ventilationStatuses.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Field label="Weather / Wind Condition" {...form.register('weatherCondition')} error={form.formState.errors.weatherCondition?.message} />
        </Section>
        
        <Section title="Gas Readings">
          <Field label="O2 %" type="number" step="0.01" required {...form.register('o2')} error={form.formState.errors.o2?.message} />
          <Field label="LEL %" type="number" step="0.01" required {...form.register('lel')} error={form.formState.errors.lel?.message} />
          <Field label="H2S ppm" type="number" step="0.01" {...form.register('h2s')} error={form.formState.errors.h2s?.message} />
          <Field label="CO ppm" type="number" step="0.01" {...form.register('co')} error={form.formState.errors.co?.message} />
          <Field label="SO2 ppm" type="number" step="0.01" {...form.register('so2')} error={form.formState.errors.so2?.message} />
          <Field label="Cl2 ppm" type="number" step="0.01" {...form.register('cl2')} error={form.formState.errors.cl2?.message} />
          <Field label="NH3 ppm" type="number" step="0.01" {...form.register('nh3')} error={form.formState.errors.nh3?.message} />
          <Field label="HF ppm" type="number" step="0.01" {...form.register('hf')} error={form.formState.errors.hf?.message} />
        </Section>
        
        <Section title="Custom Gas">
          <Field label="Custom Gas Name" {...form.register('customGasName')} error={form.formState.errors.customGasName?.message} />
          <Field label="Custom Gas Value" type="number" step="0.01" {...form.register('customGasValue')} error={form.formState.errors.customGasValue?.message} />
          <Field label="Custom Gas Unit" {...form.register('customGasUnit')} error={form.formState.errors.customGasUnit?.message} />
          <Field label="Custom Gas Threshold" type="number" step="0.01" {...form.register('customGasThreshold')} error={form.formState.errors.customGasThreshold?.message} />
        </Section>
        
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Remarks</span>
          <textarea className="psm-input mt-1 min-h-24 w-full" {...form.register('remarks')} />
        </label>
      </form>
    </section>
  );
}

function valueFor(test: PermitGasTest, code: string) {
  const value = test.readings?.find((item) => item.gas_code.toUpperCase() === code)?.value;
  return value === null || value === undefined ? undefined : Number(value);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 border-b border-[var(--psm-line)] pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{title}</h4>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </div>
  );
}

// Fixed using React.forwardRef to allow React Hook Form to accurately track the DOM reference
export const Field = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string | undefined }>(
  ({ label, required, error, ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-xs font-semibold text-[var(--psm-muted)]">
          {label}{required ? <span className="text-danger"> *</span> : null}
        </span>
        <input ref={ref} className="psm-input mt-1 w-full" {...props} />
        {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
      </label>
    );
  }
);
Field.displayName = 'Field';

// Fixed using React.forwardRef to pass down dropdown element references seamlessly
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean; error?: string | undefined }>(
  ({ label, required, error, children, ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-xs font-semibold text-[var(--psm-muted)]">
          {label}{required ? <span className="text-danger"> *</span> : null}
        </span>
        <select ref={ref} className="psm-input mt-1 w-full" {...props}>
          {children}
        </select>
        {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
      </label>
    );
  }
);
Select.displayName = 'Select';