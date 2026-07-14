import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitSignaturesPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Signatures" />;
}
