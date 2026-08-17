'use client';
import { AuditProgramFormPage } from '@/features/audit/programs/AuditProgramFormPage';
import { AuditErrorState, AuditLoadingState } from '@/features/audit/shared/AuditUi';
import { useAuditProgramDetail } from '@/features/audit/hooks/useAuditProgramDetail';
export default function Page({ params }: { params: { programId: string } }) {
  const query = useAuditProgramDetail(params.programId);
  if (query.isLoading) return <AuditLoadingState rows={8} />;
  if (query.isError || !query.data) return <AuditErrorState message={query.error ?? 'Program not found'} onRetry={() => query.refetch()} />;
  return <AuditProgramFormPage initialProgram={{ ...query.data.program, scopes: query.data.scopes, standards: query.data.standards, modules: query.data.modules, frequency: query.data.frequency ?? undefined, ...(query.data.integrationSettings ? { integrationSettings: query.data.integrationSettings } : {}) } as any} />;
}
