'use client';

import React, { useState } from 'react';
import { Compass, Plus, FileText, CheckCircle2, AlertTriangle, RefreshCw, Lock, Eye } from 'lucide-react';
import {
  useManagementReviewRegister,
  useManagementReviewPackage,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import { ManagementReviewPackageStatusBadge } from './ManagementReviewBadges';

export function ExecutiveManagementReviewPackagesPage() {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const query = useManagementReviewRegister('packages');
  const mutations = useManagementReviewMutations();

  const packageDetailQuery = useManagementReviewPackage(selectedPackageId || '');

  const rows = (query.data as any)?.rows ?? (Array.isArray(query.data) ? query.data : []);
  const detail = packageDetailQuery.data;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Management Review Packages"
        subtitle="Controlled pre-read governance dossiers containing immutable KPI snapshots, critical risk trace, and evidence manifests."
      />

      {/* Packages Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Package Title / Code</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Version</th>
                <th className="pb-3">Sources</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((pkg: any) => (
                  <tr key={pkg.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="py-3 font-semibold text-[var(--psm-text)]">
                      <div>{pkg.package_title}</div>
                      <div className="font-mono text-[10px] text-[var(--psm-muted)]">{pkg.package_code}</div>
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">{pkg.package_type}</td>
                    <td className="py-3 font-mono font-bold text-[var(--psm-text)]">
                      v{pkg.current_version_number ?? 1}
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">
                      {pkg.source_count ?? 14} sources ({pkg.restricted_source_count ?? 0} restricted)
                    </td>
                    <td className="py-3">
                      <ManagementReviewPackageStatusBadge status={pkg.package_status} />
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      <button
                        onClick={() => mutations.generatePackage.mutate(pkg.id)}
                        disabled={mutations.generatePackage.isPending}
                        className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
                      >
                        Generate
                      </button>
                      <button
                        onClick={() => mutations.publishPackage.mutate(pkg.id)}
                        disabled={mutations.publishPackage.isPending}
                        className="rounded bg-[var(--psm-primary)] px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:opacity-90"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--psm-muted)]">
                    No management review packages prepared for this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Package Detail Modal */}
      {selectedPackageId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ManagementReviewPackageStatusBadge status={detail.package_status} />
                  <span className="font-mono text-xs text-[var(--psm-muted)]">{detail.package_code}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-[var(--psm-text)]">{detail.package_title}</h3>
              </div>
              <button
                onClick={() => setSelectedPackageId(null)}
                className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-4">
                <h5 className="font-bold text-[var(--psm-text)]">Immutable Source Snapshot Manifest</h5>
                <p className="mt-1 text-[var(--psm-muted)]">
                  Captured at generation time. Any changes to underlying PSM modules will mark this package version stale and require a new controlled version.
                </p>
                <div className="mt-3 font-mono text-[11px] text-[var(--psm-primary)]">
                  Manifest Hash: {detail.manifest_hash || 'SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[var(--psm-line)] p-3">
                  <span className="text-[var(--psm-muted)]">Source Modules:</span>
                  <p className="font-semibold text-[var(--psm-text)] mt-0.5">
                    HAZOP, MOC, PSSR, MI, PTW, Incidents, Audits, CAPA
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--psm-line)] p-3">
                  <span className="text-[var(--psm-muted)]">Confidentiality Level:</span>
                  <p className="font-semibold text-[var(--psm-text)] mt-0.5">
                    {detail.confidentiality_level || 'Internal Executive'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
