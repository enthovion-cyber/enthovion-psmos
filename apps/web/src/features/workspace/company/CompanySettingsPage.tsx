'use client';

import { useState } from 'react';
import { Globe2, Save, ShieldCheck } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useCompanyDomainMutations, useCompanyDomains } from '../hooks/useCompanyDomains';
import { useCompanySettings, useCompanySettingsMutation } from '../hooks/useCompanySettings';
import { CompanyDomainPanel } from './CompanyDomainPanel';
import { CompanyModuleSettingsPanel } from './CompanyModuleSettingsPanel';
import { CompanyProfileCard } from './CompanyProfileCard';
import { CompanySecuritySettingsPanel } from './CompanySecuritySettingsPanel';
import { CompanyAuditPanel } from './CompanyAuditPanel';

export function CompanySettingsPage() {
  const settingsQuery = useCompanySettings();
  const domainsQuery = useCompanyDomains();
  const settingsMutation = useCompanySettingsMutation();
  const domainMutations = useCompanyDomainMutations();
  const toast = useMutationToast();
  const [domain, setDomain] = useState('');
  const [settings, setSettings] = useState({ currency: '', timezone: '', dateFormat: '', timeFormat: '', language: '', requireMfa: false, requireESignature: false, allowGoogleLogin: false, allowDomainAutoJoin: false });

  const loaded = settingsQuery.data;
  const company = loaded?.company;
  const current = loaded?.settings;
  const form = {
    currency: settings.currency || current?.defaultCurrency || '',
    timezone: settings.timezone || current?.defaultTimezone || '',
    dateFormat: settings.dateFormat || current?.dateFormat || '',
    timeFormat: settings.timeFormat || current?.timeFormat || '',
    language: settings.language || current?.language || '',
    requireMfa: settings.requireMfa || Boolean(current?.requireMfa),
    requireESignature: settings.requireESignature || Boolean(current?.requireESignature),
    allowGoogleLogin: settings.allowGoogleLogin || Boolean(current?.allowGoogleLogin),
    allowDomainAutoJoin: settings.allowDomainAutoJoin || Boolean(current?.allowDomainAutoJoin)
  };

  async function saveSettings() {
    try {
      await settingsMutation.mutateAsync(form);
      toast.success('Company settings updated');
    } catch (error) {
      toast.error('Settings update failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function addDomain() {
    if (!domain.trim()) return;
    try {
      await domainMutations.create.mutateAsync({ name: domain, domain, verificationMethod: 'DNS_TXT' });
      setDomain('');
      toast.success('Domain added');
    } catch (error) {
      toast.error('Domain save failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  if (settingsQuery.isLoading) return <div className="psm-card p-6 text-sm text-[var(--psm-muted)]">Loading company workspace...</div>;
  if (settingsQuery.isError) return <div className="psm-card p-6 text-sm text-danger">Unable to load company settings.</div>;

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-info">Company Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold">{company?.displayName ?? company?.name ?? 'Company Settings'}</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Profile, domain, security, module defaults, and audit readiness for tenant/site isolation.</p>
          </div>
          <button className="psm-button psm-button-primary" onClick={saveSettings} disabled={settingsMutation.isPending} title={settingsMutation.isPending ? 'Saving company settings' : 'Save company settings'}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
        <CompanyProfileCard company={company} />
        <CompanySecuritySettingsPanel settings={form} onChange={setSettings} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <CompanyDomainPanel domains={domainsQuery.data ?? []} domain={domain} onDomainChange={setDomain} onAdd={addDomain} onVerify={(id) => domainMutations.verify.mutate(id)} loading={domainsQuery.isLoading || domainMutations.create.isPending || domainMutations.verify.isPending} />
        <CompanyModuleSettingsPanel settings={form} onChange={setSettings} />
      </div>
      <CompanyAuditPanel />
    </div>
  );
}

export function CompanySettingsSummary({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Globe2 | typeof ShieldCheck }) {
  return <div className="rounded-xl border border-[var(--psm-line)] p-4"><Icon className="text-info" size={18} /><div className="mt-3 text-xs uppercase tracking-wide text-[var(--psm-muted)]">{title}</div><div className="mt-1 font-semibold">{value}</div></div>;
}
