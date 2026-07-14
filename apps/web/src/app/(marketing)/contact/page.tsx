import { ContactSalesPage } from '@/features/marketing/contact/ContactSalesPage';

export default function ContactRoute({ searchParams }: { searchParams?: { plan?: string } }) {
  return <ContactSalesPage plan={searchParams?.plan} />;
}
