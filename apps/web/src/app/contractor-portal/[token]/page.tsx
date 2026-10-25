import { ContractorPortalPage } from '@/features/contractor-safety/portal/ContractorPortalPage';

export const metadata = {
  title: 'Contractor Self-Service Safety Portal | PSM OS',
  description: 'External contractor portal for uploading Certificates of Insurance, OSHA 300 logs, and safety manuals.'
};

export default function Page() {
  return <ContractorPortalPage />;
}
