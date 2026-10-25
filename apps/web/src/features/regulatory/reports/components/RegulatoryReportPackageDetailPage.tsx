'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RegulatoryHeader } from '../../RegulatoryHeader';
import { RegulatoryLayout } from '../../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../../shared/RegulatoryUi';
import { regulatoryReportService } from '../services/regulatory-report.service';

const tabs = ['overview', 'sources', 'evidence', 'manifest', 'files', 'history'];

export function RegulatoryReportPackageDetailPage() {
  const params = useParams<{ packageId: string; tab?: string }>(); const router = useRouter(); const client = useQueryClient(); const packageId = params.packageId;
  const [active, setActive] = useState(params.tab ?? 'overview');
  const query = useQuery({ queryKey: ['regulatory', 'reports', 'package', packageId], queryFn: () => regulatoryReportService.packageDetail(packageId), enabled: Boolean(packageId), refetchOnWindowFocus: false });
  const mutate = useMutation({ mutationFn: (action: 'prepare' | 'generate') => action === 'prepare' ? regulatoryReportService.preparePackage(packageId) : regulatoryReportService.generatePackageReport(packageId, { reportTitle: String((query.data as any)?.package?.package_title ?? ''), reportType: 'Regulatory Compliance Status Report', audience: 'Internal Compliance Team', exportFormat: 'JSON Manifest Foundation' }), onSuccess: (data) => { void client.invalidateQueries({ queryKey: ['regulatory', 'reports', 'package', packageId] }); const id = (data as any)?.report?.id; if (id) router.push(`/regulatory/reports/${id}`); } });
  if (query.isLoading) return <RegulatoryLayout current="Compliance Package"><RegulatoryLoadingState rows={6} /></RegulatoryLayout>;
  if (query.isError || !query.data) return <RegulatoryLayout current="Compliance Package"><RegulatoryErrorState message={query.error instanceof Error ? query.error.message : 'Unable to load compliance package.'} onRetry={() => void query.refetch()} /></RegulatoryLayout>;
  const detail = query.data as any; const pkg = detail.package ?? {};
  const tabData: Record<string, unknown> = { overview: detail.overview, sources: detail.sources, evidence: detail.evidence, manifest: detail.manifest, files: detail.files, history: detail.history };
  return <RegulatoryLayout current="Compliance Package"><div className="space-y-5"><RegulatoryHeader title={String(pkg.package_title ?? 'Regulatory compliance package')} subtitle={`${String(pkg.package_code ?? pkg.id ?? '')} · ${String(pkg.package_type ?? '')}`} onRefresh={() => void query.refetch()} action={<div className="flex gap-2"><RegulatoryButton variant="secondary" onClick={() => void mutate.mutate('prepare')} disabled={mutate.isPending}>Prepare manifest</RegulatoryButton><RegulatoryButton onClick={() => void mutate.mutate('generate')} disabled={mutate.isPending}>Generate report</RegulatoryButton></div>} /><nav className="flex gap-2 overflow-x-auto border-b border-[var(--psm-line)] pb-2">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActive(tab)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${active === tab ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{tab}</button>)}</nav><RegulatoryCard title={active}><pre className="max-h-[560px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(tabData[active] ?? { status: 'No data available.' }, null, 2)}</pre></RegulatoryCard>{mutate.isError ? <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{mutate.error instanceof Error ? mutate.error.message : 'Package action failed.'}</p> : null}</div></RegulatoryLayout>;
}
