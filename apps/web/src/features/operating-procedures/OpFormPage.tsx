'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOpLookups, useOpMutations } from './hooks/useOperatingProcedures';
import {
  OpButton,
  OpCard,
  OpError,
  OpField,
  OpHeader,
  OpLayout,
  OpLoading,
  formatOpError,
  opInput
} from './shared/OpUi';

export function OpFormPage() {
  const router = useRouter();
  const lookups = useOpLookups();
  const mutations = useOpMutations();

  const [form, setForm] = useState({
    title: '',
    typeCode: 'NORMAL_OPERATION',
    criticality: 'Medium',
    operatingMode: 'Normal',
    purpose: '',
    scopeSummary: '',
    unitCode: 'ALKY',
    isPsmCovered: true,
    isSafeWorkPractice: false,
    reviewFrequencyMonths: 12,
    language: 'en',
    notes: ''
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (lookups.isLoading) {
    return (
      <OpLayout current="New Procedure">
        <OpLoading rows={6} />
      </OpLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const selectedType = lookups.data?.types.find((t) => t.type_code === form.typeCode);
      const res = await mutations.create.mutateAsync({
        title: form.title,
        typeCode: form.typeCode,
        criticality: form.criticality,
        operatingMode: form.operatingMode,
        purpose: form.purpose || null,
        scopeSummary: form.scopeSummary || null,
        unitCode: form.unitCode || null,
        isPsmCovered: form.isPsmCovered,
        isSafeWorkPractice: selectedType?.is_safe_work_practice ?? form.isSafeWorkPractice,
        reviewFrequencyMonths: Number(form.reviewFrequencyMonths),
        language: form.language,
        regulatoryBasis: selectedType?.osha_reference ? [selectedType.osha_reference] : [],
        notes: form.notes || null
      });

      router.push(`/operating-procedures/${res.id}`);
    } catch (err: any) {
      setErrorMsg(formatOpError(err));
    }
  };

  return (
    <OpLayout current="New Procedure">
      <div className="max-w-4xl space-y-6">
        <OpHeader
          title="Create Operating Procedure / Safe Work Practice"
          subtitle="Initialize a new procedure compliant with OSHA 29 CFR 1910.119(f) standards."
          actions={
            <OpButton variant="secondary" onClick={() => router.back()}>
              Cancel
            </OpButton>
          }
        />

        {errorMsg ? <OpError error={errorMsg} /> : null}

        <form onSubmit={handleSubmit}>
          <OpCard title="Basic Information" subtitle="Define the procedure identification, type, and operating boundaries.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <OpField label="Procedure Title" required helper="Concise and standardized title describing the task or phase.">
                    <input
                      type="text"
                      required
                      placeholder="e.g., Alkylation Unit Reactor Startup & Feed Introduction"
                      className={opInput}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField label="Procedure Type" required helper="Select the operating phase or Safe Work Practice category.">
                    <select
                      className={opInput}
                      value={form.typeCode}
                      onChange={(e) => {
                        const tc = e.target.value;
                        const t = lookups.data?.types.find((item) => item.type_code === tc);
                        setForm({
                          ...form,
                          typeCode: tc,
                          isSafeWorkPractice: t?.is_safe_work_practice ?? false
                        });
                      }}
                    >
                      {(lookups.data?.types ?? []).map((t) => (
                        <option key={t.type_code} value={t.type_code}>
                          {t.type_name} ({t.phase_group})
                        </option>
                      ))}
                    </select>
                  </OpField>
                </div>

                <div>
                  <OpField label="Process Unit / Area Code" helper="Used for procedure numbering prefix (e.g. SOP-ALKY-0001).">
                    <input
                      type="text"
                      className={opInput}
                      placeholder="e.g. ALKY, CRU, BOILER"
                      value={form.unitCode}
                      onChange={(e) => setForm({ ...form, unitCode: e.target.value })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField label="Operating Mode">
                    <select
                      className={opInput}
                      value={form.operatingMode}
                      onChange={(e) => setForm({ ...form, operatingMode: e.target.value })}
                    >
                      {(lookups.data?.operatingModes ?? []).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </OpField>
                </div>

                <div>
                  <OpField label="Criticality Level">
                    <select
                      className={opInput}
                      value={form.criticality}
                      onChange={(e) => setForm({ ...form, criticality: e.target.value })}
                    >
                      <option value="High">High (Safety-Critical / Major Hazard)</option>
                      <option value="Medium">Medium (Standard PSM Covered)</option>
                      <option value="Low">Low (General Utility / Minor)</option>
                    </select>
                  </OpField>
                </div>

                <div>
                  <OpField label="Annual Review Frequency (Months)" helper="OSHA 1910.119(f)(3) mandates annual review (12 months).">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className={opInput}
                      value={form.reviewFrequencyMonths}
                      onChange={(e) => setForm({ ...form, reviewFrequencyMonths: Number(e.target.value) })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField label="Language">
                    <input
                      type="text"
                      className={opInput}
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                    />
                  </OpField>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]">
                  <input
                    type="checkbox"
                    checked={form.isPsmCovered}
                    onChange={(e) => setForm({ ...form, isPsmCovered: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--psm-line)] text-primary focus:ring-primary"
                  />
                  PSM-Covered Process Element
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]">
                  <input
                    type="checkbox"
                    checked={form.isSafeWorkPractice}
                    onChange={(e) => setForm({ ...form, isSafeWorkPractice: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--psm-line)] text-primary focus:ring-primary"
                  />
                  Safe Work Practice (SWP)
                </label>
              </div>

              <div className="pt-2">
                <OpField label="Purpose" helper="Brief explanation of why this procedure exists and what it accomplishes.">
                  <textarea
                    rows={3}
                    className={opInput}
                    placeholder="Describe the operational goal and safety intent..."
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  />
                </OpField>
              </div>

              <div>
                <OpField label="Scope Summary" helper="Equipment boundaries, units, roles, or conditions to which this procedure applies.">
                  <textarea
                    rows={3}
                    className={opInput}
                    placeholder="Specific batteries, systems, or equipment limits..."
                    value={form.scopeSummary}
                    onChange={(e) => setForm({ ...form, scopeSummary: e.target.value })}
                  />
                </OpField>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                <OpButton variant="secondary" onClick={() => router.back()}>
                  Cancel
                </OpButton>
                <OpButton type="submit" disabled={mutations.create.isPending}>
                  {mutations.create.isPending ? 'Creating...' : 'Create Procedure'}
                </OpButton>
              </div>
            </div>
          </OpCard>
        </form>
      </div>
    </OpLayout>
  );
}
