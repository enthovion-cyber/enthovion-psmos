import { AuditPlanFormPage } from '@/features/audit/plans/AuditPlanFormPage'; export default function Page({params}:{params:{planId:string}}){return <AuditPlanFormPage planId={params.planId}/>}
