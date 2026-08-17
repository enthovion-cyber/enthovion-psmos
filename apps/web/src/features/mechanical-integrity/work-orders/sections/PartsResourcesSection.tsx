'use client';

import type { MiWorkOrderLookups } from '../../types/work-order.types';
import { Check, Field, Input, Select } from './WorkOrderFields';

export function PartsResourcesSection({ values, lookups, onChange }: { values: Record<string, any>; lookups?: MiWorkOrderLookups | undefined; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {['sparePartsList','materialList','toolsRequired','specialEquipment','estimatedCost','costCenter','purchaseRequestReference','externalCmmsReference'].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}
        <Field label="Parts status"><Select value={values.partsStatus} onChange={(value) => onChange('partsStatus', value)} options={lookups?.partsStatuses} /></Field>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{(['partsRequired','craneLiftingRequired','scaffoldingRequired','contractorRequired','vendorRequired'] as string[]).map((key) => <Check key={key} label={key.replace(/([A-Z])/g, ' $1')} checked={values[key]} onChange={(value) => onChange(key, value)} />)}</div>
    </div>
  );
}
