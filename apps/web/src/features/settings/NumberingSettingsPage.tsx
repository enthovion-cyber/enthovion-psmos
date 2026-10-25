'use client';

import { useState } from 'react';
import { Hash, Save, Check, RefreshCw, Layers } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useMutationToast } from '@/providers/ToastProvider';

type NumberingRule = {
  id: string;
  module_key: string;
  prefix: string;
  include_site_code: boolean;
  include_year: boolean;
  digits: number;
  current_sequence: number;
  sample_preview: string;
};

const moduleTitles: Record<string, string> = {
  ptw: 'Permit to Work (PTW)',
  moc: 'Management of Change (MOC)',
  actions: 'Action Center (Unified CAPA)',
  incidents: 'Incident Investigation',
  documents: 'Document Control',
  equipment: 'Equipment Registry',
  pssr: 'Pre-Startup Safety Review (PSSR)'
};

export function NumberingSettingsPage() {
  const queryClient = useQueryClient();
  const toast = useMutationToast();

  const { data: rules = [], isLoading } = useQuery<NumberingRule[]>({
    queryKey: ['settings', 'numbering'],
    queryFn: async () => {
      const res = await api.get('/foundation/settings/numbering');
      return res.data?.data ?? res.data ?? [];
    }
  });

  const [editingRule, setEditingRule] = useState<Partial<NumberingRule> | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (rule: Partial<NumberingRule>) => {
      const res = await api.put(`/foundation/settings/numbering/${rule.module_key}`, {
        prefix: rule.prefix,
        include_site_code: rule.include_site_code,
        include_year: rule.include_year,
        digits: rule.digits
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Numbering rule updated');
      queryClient.invalidateQueries({ queryKey: ['settings', 'numbering'] });
      setEditingRule(null);
    },
    onError: (err: any) => {
      toast.error('Failed to update numbering rule', err.message);
    }
  });

  function computePreview(prefix: string, incSite: boolean, incYear: boolean, digits: number) {
    const sitePart = incSite ? 'JUB-' : '';
    const yearPart = incYear ? `${new Date().getFullYear()}-` : '';
    const seqPart = '1'.padStart(digits, '0');
    return `${prefix.toUpperCase()}-${sitePart}${yearPart}${seqPart}`;
  }

  return (
    <div className="space-y-6">
      <section className="psm-card p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 text-info">
            <Hash size={18} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Auto-Numbering Sequences & Prefixes</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">
              Configure standardized numbering formats across all PSM OS modules (PTW, MOC, CAPA, Incidents, PSSR, and Documents).
            </p>
          </div>
        </div>
      </section>

      <div className="psm-card overflow-hidden">
        <div className="border-b border-[var(--psm-line)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            Module Numbering Specifications
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="psm-table w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
              <tr>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Prefix</th>
                <th className="px-5 py-3">Format Rules</th>
                <th className="px-5 py-3">Digit Padding</th>
                <th className="px-5 py-3">Live Generated Sample</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[var(--psm-muted)]">
                    Loading numbering formats...
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const isEditing = editingRule?.module_key === rule.module_key;
                  const currentPrefix = isEditing ? editingRule.prefix ?? rule.prefix : rule.prefix;
                  const currentSite = isEditing ? editingRule.include_site_code ?? rule.include_site_code : rule.include_site_code;
                  const currentYear = isEditing ? editingRule.include_year ?? rule.include_year : rule.include_year;
                  const currentDigits = isEditing ? editingRule.digits ?? rule.digits : rule.digits;
                  const preview = computePreview(currentPrefix, currentSite, currentYear, currentDigits);

                  return (
                    <tr key={rule.module_key} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                      <td className="px-5 py-4 font-semibold">
                        {moduleTitles[rule.module_key] || rule.module_key.toUpperCase()}
                      </td>

                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingRule.prefix ?? ''}
                            onChange={(e) => setEditingRule({ ...editingRule, prefix: e.target.value.toUpperCase() })}
                            className="psm-input h-8 w-24 px-2 font-mono text-xs uppercase"
                          />
                        ) : (
                          <span className="font-mono font-bold text-info">{rule.prefix}</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {isEditing ? (
                          <div className="space-y-1">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingRule.include_site_code}
                                onChange={(e) => setEditingRule({ ...editingRule, include_site_code: e.target.checked })}
                              />
                              <span>Include Site Code</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingRule.include_year}
                                onChange={(e) => setEditingRule({ ...editingRule, include_year: e.target.checked })}
                              />
                              <span>Include 4-digit Year</span>
                            </label>
                          </div>
                        ) : (
                          <span className="text-[var(--psm-muted)]">
                            {[rule.include_site_code ? 'Site Code' : null, rule.include_year ? 'Year' : null].filter(Boolean).join(' + ') || 'Sequential only'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min={3}
                            max={8}
                            value={editingRule.digits ?? 4}
                            onChange={(e) => setEditingRule({ ...editingRule, digits: Number(e.target.value) })}
                            className="psm-input h-8 w-16 px-2 text-xs"
                          />
                        ) : (
                          <span className="font-mono text-xs">{rule.digits} digits</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-[var(--psm-surface-3)] px-2.5 py-1 font-mono text-xs font-bold text-success border border-success/30">
                          {preview}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingRule(null)}
                              className="psm-button psm-button-secondary text-xs h-8 px-2"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveMutation.mutate(editingRule)}
                              disabled={saveMutation.isPending}
                              className="psm-button psm-button-primary text-xs h-8 px-2.5"
                            >
                              <Save size={13} /> Save
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingRule({ ...rule })}
                            className="text-xs font-semibold text-info hover:underline"
                          >
                            Configure
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
