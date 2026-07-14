import type { Metadata } from 'next';
import { MarketingLayout } from '@/features/marketing/layout/MarketingLayout';

export const metadata: Metadata = {
  title: 'Enthovion PSM OS | Process Safety Management Software',
  description: 'AI-assisted process safety management software for MOC, PSSR, HAZOP/PHA, LOPA/SIL, incident investigation, actions, documents, and audit-ready industrial workflows.',
  keywords: ['Process Safety Management software', 'PSM OS', 'MOC software', 'PSSR software', 'HAZOP software', 'LOPA SIL software', 'Incident investigation software', 'Chemical engineering safety software'],
  openGraph: {
    title: 'Enthovion PSM OS | Process Safety Management Software',
    description: 'AI-assisted process safety management software for MOC, PSSR, HAZOP/PHA, LOPA/SIL, incident investigation, actions, documents, and audit-ready industrial workflows.',
    siteName: 'Enthovion PSM OS'
  }
};

export default function PublicMarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
