'use client';

import type { InvitationSummary } from '../types/invitation-auth.types';

export function InviteSummaryCard({ invitation }: { invitation?: InvitationSummary | null }) {
  if (!invitation) return <div className="rounded-lg border border-[var(--psm-line)] p-3 text-sm text-[var(--psm-muted)]">Enter an invitation token to load the invite summary.</div>;
  return (
    <section className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm">
      <div className="font-semibold">Invitation summary</div>
      <div className="mt-3 grid gap-2">
        <Info label="Invited email" value={invitation.email} />
        <Info label="Status" value={invitation.expired ? 'Expired' : invitation.status} />
        <Info label="Company" value={invitation.companyId ?? 'Assigned by admin'} />
        <Info label="Site" value={invitation.siteId ?? 'Assigned by admin'} />
        <Info label="Role" value={invitation.roleId ?? 'Assigned by admin'} />
        <Info label="Expiry" value={invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : 'Not available'} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><span className="text-[var(--psm-muted)]">{label}</span><span className="text-right font-medium">{value}</span></div>;
}
