import { PsiExportPackageDetailPage } from '@/features/psi/reports/PsiExportPackageDetailPage';
export default function Page({ params }: { params: { packageId: string } }) { return <PsiExportPackageDetailPage packageId={params.packageId} />; }
