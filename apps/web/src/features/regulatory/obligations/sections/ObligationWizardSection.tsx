import type { ReactNode } from 'react';
import { RegulatoryCard } from '../../shared/RegulatoryUi';

export function ObligationWizardSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <RegulatoryCard title={title} subtitle={subtitle}>{children}</RegulatoryCard>;
}
