import { AuditTrendRunRegistryPage } from '@/features/audit/history/AuditTrendRunRegistryPage';
export default function Page() { return <AuditTrendRunRegistryPage title="Stale Trend Runs" filter={{ staleStatus: 'Stale' }} />; }
