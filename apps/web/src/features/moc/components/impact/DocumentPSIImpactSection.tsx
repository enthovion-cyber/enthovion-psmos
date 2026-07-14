'use client';
import type { UseFormReturn } from 'react-hook-form';
import { impactSections, type MOCImpactValues } from '../../schemas/moc-impact.schema';
import { ImpactSection } from './ImpactSection';
export function DocumentPSIImpactSection({ form, locked }: { form: UseFormReturn<MOCImpactValues>; locked?: boolean }) {
  return <ImpactSection config={impactSections.find((item) => item.area === 'documents')!} form={form} locked={locked} />;
}
