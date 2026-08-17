import { RegulatoryRegisterPage } from '@/features/regulatory/RegulatoryRegisterPage';
export default function Page({ params }: { params: { siteId: string } }) { return <RegulatoryRegisterPage view={`sites/${params.siteId}`} />; }
