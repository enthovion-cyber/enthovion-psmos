'use client';

import { useState } from 'react';
import type { RegulatoryDetail } from '../types/regulatory.types';
import { RegulatoryButton, RegulatoryCard, formatRegulatoryError } from '../shared/RegulatoryUi';
import { RegulatoryScopeApplicabilitySection } from '../sections/RegulatoryScopeApplicabilitySection';
import { useRegulatoryItemMutations } from '../hooks/useRegulatoryItemMutations';
import { useRegulatoryLookups } from '../hooks/useRegulatoryLookups';

export function RegulatoryScopeTab({ detail }: { detail?: RegulatoryDetail | undefined }) {
  const item = detail?.item;
  const [form, setForm] = useState<Record<string, unknown>>(item ?? {});
  const lookups = useRegulatoryLookups();
  const mutations = useRegulatoryItemMutations(item?.id);
  const disabled = detail?.readOnly || !item?.id;
  async function save() {
    try {
      await mutations.update.mutateAsync(form);
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }
  return (
    <div className="space-y-5">
      <RegulatoryScopeApplicabilitySection form={form} setForm={setForm} lookups={lookups.data} />
      <RegulatoryCard title="Scope Save / Validation" subtitle="Backend enforces company/site access and scope isolation.">
        <RegulatoryButton disabled={disabled || mutations.update.isPending} title={disabled ? detail?.readOnlyReason ?? 'No item loaded.' : 'Save scope and applicability foundation.'} onClick={() => void save()}>{mutations.update.isPending ? 'Saving...' : 'Save Scope'}</RegulatoryButton>
      </RegulatoryCard>
    </div>
  );
}
