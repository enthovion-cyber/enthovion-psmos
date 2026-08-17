import { RegulatoryRegisterPage } from '@/features/regulatory/RegulatoryRegisterPage';
export default function Page({ params }: { params: { unitId: string } }) { return <RegulatoryRegisterPage view={`units/${params.unitId}`} />; }
