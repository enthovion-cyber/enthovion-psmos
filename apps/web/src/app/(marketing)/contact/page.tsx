import { ContactSalesPage } from '@/features/marketing/contact/ContactSalesPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ContactRoute(props: { searchParams?: Promise<{ plan?: string }> }) {
  const searchParams = await props.searchParams;
  return <ContactSalesPage plan={searchParams?.plan} />;
}
