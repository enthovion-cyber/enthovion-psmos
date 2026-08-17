import { RegulatoryJurisdictionDetailPage } from '@/features/regulatory/jurisdictions/RegulatoryJurisdictionDetailPage';
export default function Page({ params }: { params: { jurisdictionId: string } }) { return <RegulatoryJurisdictionDetailPage jurisdictionId={params.jurisdictionId} section="register-items" />; }
