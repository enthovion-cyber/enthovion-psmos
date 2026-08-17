import type { ReactNode } from 'react';
import { RegulatoryCard } from '../../shared/RegulatoryUi';

export function RegulatoryActionDialogShell({ title, children }: { title: string; children: ReactNode }) {
  return <RegulatoryCard title={title}>{children}</RegulatoryCard>;
}
