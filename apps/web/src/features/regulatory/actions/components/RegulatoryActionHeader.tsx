import type { ReactNode } from 'react';
import { RegulatoryHeader } from '../../RegulatoryHeader';

export function RegulatoryActionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <RegulatoryHeader title={title} subtitle={subtitle} action={actions} />;
}
