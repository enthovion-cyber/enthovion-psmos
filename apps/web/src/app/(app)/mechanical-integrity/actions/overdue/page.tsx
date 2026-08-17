import { MiActionsPage } from '@/features/mechanical-integrity/actions/MiActionsPage';

export default function MechanicalIntegrityOverdueActionsPage() {
  return <MiActionsPage initialFilters={{ overdue: true }} />;
}
