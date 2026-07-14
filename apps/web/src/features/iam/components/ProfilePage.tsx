'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Building2, Camera, Save, ShieldCheck, PenLine, MailCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { PermissionModuleAccordion } from '@/features/permissions/components/PermissionModuleAccordion';
import { SignaturePreview } from '@/features/signatures/components/SignaturePreview';
import { SignatureStatusBadge } from '@/features/signatures/components/SignatureStatusBadge';
import { useMySignatureProfile } from '@/features/signatures/hooks/useSignatures';
import { useIamMutations, useMe, useMyEffectivePermissions, useProfileInvitations } from '../hooks/useIam';

export function ProfilePage() {
  const meQuery = useMe();
  const signatureProfile = useMySignatureProfile();
  const permissionsQuery = useMyEffectivePermissions();
  const invitationsQuery = useProfileInvitations();
  const mutations = useIamMutations();
  const toast = useMutationToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const me = meQuery.data;
  const [form, setForm] = useState({
    displayName: '',
    title: '',
    department: '',
    phone: '',
    mobile: '',
    timezone: '',
    locale: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (!me) return;
    setForm({
      displayName: me.displayName ?? '',
      title: me.title ?? '',
      department: me.department ?? '',
      phone: me.profile?.phone ?? '',
      mobile: me.profile?.mobile ?? '',
      timezone: me.profile?.timezone ?? '',
      locale: me.profile?.locale ?? '',
      bio: me.profile?.bio ?? '',
      avatarUrl: me.profile?.avatarUrl ?? ''
    });
  }, [me]);

  async function save() {
    try {
      await mutations.updateProfile.mutateAsync(form);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Profile update failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function uploadAvatar(file: File) {
    try {
      const avatarUrl = await resizeAvatar(file);
      setForm((current) => ({ ...current, avatarUrl }));
    } catch {
      toast.error('Profile image upload failed', 'Select a valid image file.');
    }
  }

  if (meQuery.isLoading) return <div className="psm-card p-5">Loading profile...</div>;
  if (!me) return <div className="psm-card p-5 text-danger">Unable to load profile.</div>;

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-white">
            {form.avatarUrl ? <img src={form.avatarUrl} alt={form.displayName} className="h-full w-full object-cover" /> : initials(form.displayName)}
            <span className="absolute inset-x-0 bottom-0 grid h-8 place-items-center bg-black/45 text-white"><Camera size={16} /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); event.currentTarget.value = ''; }} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">{me.displayName}</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{me.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="psm-badge psm-badge-success">{me.status}</span>
              {me.title ? <span className="psm-badge psm-badge-muted">{me.title}</span> : null}
              {me.department ? <span className="psm-badge psm-badge-muted">{me.department}</span> : null}
            </div>
          </div>
          <button onClick={save} disabled={mutations.updateProfile.isPending} className="psm-button psm-button-primary"><Save size={16} /> Save Profile</button>
        </div>
      </section>

      <section className="psm-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Editable Profile Details</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Display Name" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Field label="Mobile" value={form.mobile} onChange={(value) => setForm({ ...form, mobile: value })} />
          <Field label="Timezone" value={form.timezone} onChange={(value) => setForm({ ...form, timezone: value })} />
          <Field label="Locale" value={form.locale} onChange={(value) => setForm({ ...form, locale: value })} />
          <label className="text-sm md:col-span-2 xl:col-span-4">
            <span className="mb-2 block text-[var(--psm-muted)]">Bio</span>
            <textarea className="psm-input min-h-24 w-full p-3" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </label>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Company & Sites" icon={<Building2 size={18} />}>
          <Info label="Company" value={me.tenant?.name ?? 'Not assigned'} />
          {(me.userSites ?? []).map((access) => (
            <Info key={access.site?.id ?? access.site?.name ?? 'site'} label="Site Access" value={access.site ? `${access.site.name} (${access.site.code})` : 'Site'} />
          ))}
        </Panel>
        <Panel title="Roles" icon={<ShieldCheck size={18} />}>
          {(me.userRoles ?? []).map((assignment) => assignment.role ? <Info key={assignment.role.id} label={assignment.role.name} value={assignment.role.key} /> : null)}
        </Panel>
      </div>

      <section className="psm-card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <MailCheck size={18} />
            Pending Invitations
          </div>
          <span className="text-xs text-[var(--psm-muted)]">{(invitationsQuery.data ?? []).filter((item) => item.status === 'Pending').length} pending</span>
        </div>
        {invitationsQuery.isLoading ? (
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">Loading invitations...</div>
        ) : invitationsQuery.isError ? (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Unable to load invitations. Confirm the team invitation migrations have been applied and refresh the profile.</div>
        ) : (invitationsQuery.data ?? []).length ? (
          <div className="grid gap-3">
            {(invitationsQuery.data ?? []).map((invitation) => {
              const pending = invitation.status === 'Pending' && !invitation.expired;
              const declinedReason = invitation.decline_reason ? `Reason: ${invitation.decline_reason}` : null;
              const href = invitation.recordUrl ?? (invitation.study?.id ? `/hazop/${invitation.study.id}` : '/hazop');
              const moduleLabel = invitation.sourceModule ?? 'HAZOP';
              return (
                <div key={invitation.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={href} className="text-sm font-semibold text-info hover:underline">
                          {invitation.studyNumber ?? `${moduleLabel} Record`} - {invitation.studyTitle ?? 'Team invitation'}
                        </a>
                        <span className="rounded-full border border-[var(--psm-line)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--psm-muted)]">{moduleLabel}</span>
                        <span className={badgeClass(invitation.status)}>{invitation.expired ? 'Expired' : invitation.status}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-[var(--psm-muted)] md:grid-cols-2 xl:grid-cols-4">
                        <Info label="Study Role" value={invitation.studyRole ?? 'Team Member'} />
                        <Info label="Discipline" value={invitation.discipline ?? 'Not specified'} />
                        <Info label="Attendance Required" value={invitation.requiredAttendance ? 'Yes' : 'No'} />
                        <Info label="Sign-off Required" value={invitation.signoffRequired ? 'Yes' : 'No'} />
                        <Info label="Invited By" value={invitation.invitedBy?.displayName ?? invitation.invitedBy?.email ?? 'System'} />
                        <Info label="Expiry Date" value={invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : 'Not set'} />
                      </div>
                      {declinedReason ? <p className="mt-3 text-xs text-warning">{declinedReason}</p> : null}
                    </div>
                    {pending ? (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          className="psm-button psm-button-primary min-h-9 px-3 text-sm"
                          disabled={mutations.acceptProfileInvitation.isPending}
                          onClick={() => runInvitationAction(() => mutations.acceptProfileInvitation.mutateAsync(invitation.id), 'Invitation accepted')}
                        >
                          <CheckCircle2 size={15} /> Accept
                        </button>
                        <button
                          className="psm-button psm-button-secondary min-h-9 px-3 text-sm"
                          disabled={mutations.declineProfileInvitation.isPending}
                          onClick={() => {
                            const reason = window.prompt('Decline reason (optional)') ?? undefined;
                            runInvitationAction(() => mutations.declineProfileInvitation.mutateAsync({ id: invitation.id, ...(reason ? { reason } : {}) }), 'Invitation declined');
                          }}
                        >
                          <XCircle size={15} /> Decline
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">No pending invitations.</div>
        )}
      </section>

      <section className="psm-card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <PenLine size={18} />
            Electronic Signature
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SignatureStatusBadge status={signatureProfile.data?.status ?? 'Not Created'} />
            <a href="/settings/signature" className="psm-button psm-button-primary min-h-9 px-3 text-sm">Change Signature</a>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <SignaturePreview profile={signatureProfile.data ?? { full_name: form.displayName, signature_method: 'Type', signature_text: form.displayName, initials: initials(form.displayName) }} />
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm">
            <div className="font-semibold">Reusable across PSM OS</div>
            <p className="mt-2 text-[var(--psm-muted)]">This saved signature is used by PTW handover, PTW signatures, MOC approvals, PSSR authorization, and future controlled approvals. Signing still requires password or signature PIN verification.</p>
          </div>
        </div>
      </section>

      <section className="psm-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">My Effective Permissions</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Only permissions currently allowed for your active company and site are shown. Admin-only denied or unassigned permissions are hidden.</p>
        </div>
        {permissionsQuery.isLoading ? (
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">Loading permissions...</div>
        ) : permissionsQuery.isError ? (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Unable to load effective permissions.</div>
        ) : (
          <PermissionModuleAccordion modules={permissionsQuery.data?.permissionModules ?? permissionsQuery.data?.modules} mode="profile" readOnly showSearch showCounts hideEmptyModules />
        )}
      </section>
    </div>
  );

  async function runInvitationAction(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error('Invitation update failed', error instanceof Error ? error.message : 'Request failed');
    }
  }
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}</span>
      <input className="psm-input w-full px-3" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">{icon}{title}</div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
      <div className="text-xs text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function initials(name: string) {
  return (name || 'User').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function badgeClass(status: string) {
  if (status === 'Accepted') return 'psm-badge psm-badge-success';
  if (status === 'Declined' || status === 'Expired' || status === 'Cancelled') return 'psm-badge psm-badge-danger';
  return 'psm-badge psm-badge-warning';
}

function resizeAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to load image'));
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
