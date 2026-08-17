import { RegulatoryCapaPackageDetailPage } from '@/features/regulatory/actions/RegulatoryCapaPackageDetailPage';
export default function Page({ params }: { params: { capaPackageId: string } }) { return <RegulatoryCapaPackageDetailPage capaPackageId={params.capaPackageId} tab="verification" />; }
