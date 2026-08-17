import { RegulatoryRegisterPage } from '@/features/regulatory/RegulatoryRegisterPage';
export default function Page({ params }: { params: { equipmentId: string } }) { return <RegulatoryRegisterPage view={`equipment/${params.equipmentId}`} />; }
