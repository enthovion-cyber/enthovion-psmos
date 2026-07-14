'use client';

import Link from 'next/link';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useProfileAccount } from '../hooks/useAccountSecurity';

export function ProfileAccountPage() {
  const query = useProfileAccount();
  const profile = query.data;
  const roles = profile?.userRoles ?? [];
  const sites = profile?.userSites ?? [];

  if (query.isLoading) return <ProfileState title="Loading account..." />;
  if (query.isError) return <ProfileState title="Unable to load account" tone="danger" />;

  return (
    <main className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--psm-surface-2)] text-[var(--psm-accent)]">
              <UserRound size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Account</h1>
              <p className="text-sm text-[var(--psm-muted)]">{profile?.displayName ?? profile?.email ?? 'Current user'}</p>
            </div>
          </div>
          <Link className="psm-button psm-button-ghost" href="/profile/security">Security</Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="psm-card p-5">
          <h2 className="text-lg font-semibold">Profile Summary</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Name" value={profile?.displayName} />
            <Info label="Email" value={profile?.email} />
            <Info label="Job title" value={profile?.title} />
            <Info label="Department" value={profile?.department} />
            <Info label="Status" value={profile?.status} />
            <Info label="Phone" value={profile?.phone} />
          </div>
        </div>
        <div className="psm-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} /> Workspace Access</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Info label="Assigned roles" value={roles.length ? roles.map((row: any) => row.role?.name ?? row.role?.key ?? row.roleId).filter(Boolean).join(', ') : 'No roles assigned'} />
            <Info label="Site access" value={sites.length ? sites.map((row: any) => row.site?.name ?? row.siteId).filter(Boolean).join(', ') : 'No site access assigned'} />
            <p className="text-xs text-[var(--psm-muted)]">Roles and permissions are read-only here and are managed by authorized administrators.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 font-medium">{value || 'Not set'}</div>
    </div>
  );
}

function ProfileState({ title, tone = 'muted' }: { title: string; tone?: 'muted' | 'danger' }) {
  return <main className={`psm-card p-5 text-sm ${tone === 'danger' ? 'text-[var(--psm-danger)]' : 'text-[var(--psm-muted)]'}`}>{title}</main>;
}
