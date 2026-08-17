import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewEquipmentDeficiencyPage({ params }: { params: { id: string } }) {
  return <DeficiencyFormPage preset={{ equipmentId: params.id }} />;
}
