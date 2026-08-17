import { RegulatoryRegisterPage } from '@/features/regulatory/RegulatoryRegisterPage';
export default function Page({ params }: { params: { areaId: string } }) { return <RegulatoryRegisterPage view={`areas/${params.areaId}`} />; }
