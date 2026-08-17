'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { RegulatoryEvidencePackageStatusBadge } from '../shared/RegulatoryEvidencePackageStatusBadge';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';
import { useRegulatoryEvidencePackages } from '../hooks/useRegulatoryEvidencePackages';
import { useRegulatoryEvidenceMutations } from '../hooks/useRegulatoryEvidenceMutations';

export function RegulatoryEvidencePackagePage({ mode = 'register', packageId, initialFilters }: { mode?: 'register' | 'new' | 'detail'; packageId?: string; initialFilters?: Record<string, unknown> }) {
  if (mode === 'new') return <NewPackage />;
  if (mode === 'detail' && packageId) return <PackageDetail packageId={packageId} />;
  const query = useRegulatoryEvidencePackages({ limit: 100, ...(initialFilters ?? {}) });
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const rows = query.data?.rows ?? [];
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title="Evidence Packages" subtitle="Prepare regulator, audit, internal assurance, and source-scoped evidence packages without exposing restricted evidence by default." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/evidence/packages/new">New Package</RegulatoryButton>} />{rows.length ? <RegulatoryCard title="Package Register">{rows.map((row) => <Link key={row.id} href={`/regulatory/evidence/packages/${row.id}`} className="mb-3 block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><b>{row.package_code ?? row.id}</b><div>{row.package_title}</div><div className="text-sm text-[var(--psm-muted)]">{row.package_type} · evidence {row.included_evidence_count ?? 0} · restricted {row.restricted_evidence_count ?? 0}</div></div><RegulatoryEvidencePackageStatusBadge status={row.package_status} /></div></Link>)}</RegulatoryCard> : <RegulatoryEmptyState title="No evidence packages" message="No evidence packages exist for this scope." />}</div></RegulatoryLayout>;
}

function NewPackage() {
  const mutations = useRegulatoryEvidenceMutations();
  const [form, setForm] = useState<Record<string, unknown>>({ packageType: 'Regulatory Item Evidence Package' });
  const [message, setMessage] = useState<string | null>(null);
  async function submit() {
    const row = await mutations.createPackage.mutateAsync(form);
    setMessage(`Created package ${row.package_code ?? row.id}`);
  }
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title="New Evidence Package" subtitle="Create a package foundation; prepare manifest from backend evidence data after saving." action={<RegulatoryButton onClick={submit} disabled={mutations.createPackage.isPending}>{mutations.createPackage.isPending ? 'Saving...' : 'Save Package'}</RegulatoryButton>} />{message ? <RegulatoryCard><p>{message}</p></RegulatoryCard> : null}<RegulatoryCard title="Package Scope"><div className="grid gap-3 md:grid-cols-2"><RegulatoryField label="Package title"><input className={regulatoryInputClass()} value={String(form.packageTitle ?? '')} onChange={(event) => setForm({ ...form, packageTitle: event.target.value })} /></RegulatoryField><RegulatoryField label="Package type"><input className={regulatoryInputClass()} value={String(form.packageType ?? '')} onChange={(event) => setForm({ ...form, packageType: event.target.value })} /></RegulatoryField><RegulatoryField label="Owner user ID"><input className={regulatoryInputClass()} value={String(form.ownerUserId ?? '')} onChange={(event) => setForm({ ...form, ownerUserId: event.target.value })} /></RegulatoryField><RegulatoryField label="Notes"><input className={regulatoryInputClass()} value={String(form.notes ?? '')} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></RegulatoryField></div></RegulatoryCard></div></RegulatoryLayout>;
}

function PackageDetail({ packageId }: { packageId: string }) {
  const query = useQuery({ queryKey: ['regulatory', 'evidence', 'package', packageId], queryFn: () => regulatoryEvidenceService.packageDetail(packageId) });
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={6} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const detail = query.data;
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title={detail?.package?.package_title ?? 'Evidence Package'} subtitle={detail?.package?.package_code ?? packageId} onRefresh={() => query.refetch()} action={<RegulatoryButton onClick={() => regulatoryEvidenceService.preparePackage(packageId).then(() => query.refetch())}>Prepare Manifest</RegulatoryButton>} /><RegulatoryCard title="Package Snapshot"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify(detail?.package ?? {}, null, 2)}</pre></RegulatoryCard><RegulatoryCard title="Package Items">{detail?.items?.length ? detail.items.map((item, index) => <pre key={String(item.id ?? index)} className="mb-3 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify(item, null, 2)}</pre>) : <p className="text-sm text-[var(--psm-muted)]">No evidence package items yet. Prepare the manifest to add eligible evidence.</p>}</RegulatoryCard></div></RegulatoryLayout>;
}
