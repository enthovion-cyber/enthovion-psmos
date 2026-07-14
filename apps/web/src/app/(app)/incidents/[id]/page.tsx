import { IncidentDetailPage } from '@/features/incidents/components/detail/IncidentDetailPage';

export default function IncidentDetailRoute({ params }: { params: { id: string } }) {
  return <IncidentDetailPage id={params.id} />;
}
