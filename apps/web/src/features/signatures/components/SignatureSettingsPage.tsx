'use client';

import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useMe } from '@/features/iam/hooks/useIam';
import { useMySignatureProfile, useSignatureMutations, useSignatureProfileVersions } from '../hooks/useSignatures';
import { InitialsPreviewCard } from './InitialsPreviewCard';
import { SignatureDrawPad } from './SignatureDrawPad';
import { SignatureMethodSelector } from './SignatureMethodSelector';
import { SignaturePreview } from './SignaturePreview';
import { SignatureStatusBadge } from './SignatureStatusBadge';
import { SignatureTypedInput } from './SignatureTypedInput';
import { SignatureUploadInput } from './SignatureUploadInput';
import { SignatureVerificationPanel } from './SignatureVerificationPanel';

export function SignatureSettingsPage() {
  const profile = useMySignatureProfile();
  const meQuery = useMe();
  const me = meQuery.data;
  const versions = useSignatureProfileVersions();
  const mutations = useSignatureMutations();
  const toast = useMutationToast();
  const [form, setForm] = useState({ fullName: '', jobTitle: '', departmentName: '', signatureMethod: 'Type' as 'Draw' | 'Type' | 'Upload' | 'Initials', signatureText: '', signatureImageUrl: '', signatureVectorJson: null as Record<string, unknown> | null, initials: '' });
  const [pin, setPin] = useState({ pin: '', password: '', currentPin: '', newPin: '' });

  useEffect(() => {
    if (profile.data) {
    setForm({
      fullName: profile.data.full_name ?? '',
      jobTitle: profile.data.job_title ?? '',
      departmentName: profile.data.department_name ?? '',
      signatureMethod: profile.data.signature_method ?? 'Type',
      signatureText: profile.data.signature_text ?? '',
      signatureImageUrl: profile.data.signature_image_url ?? '',
      signatureVectorJson: profile.data.signature_vector_json ?? null,
      initials: profile.data.initials ?? ''
    });
      return;
    }
    if (!profile.isLoading && me) {
      setForm((current) => ({
        ...current,
        fullName: current.fullName || me.displayName || '',
        jobTitle: current.jobTitle || me.title || '',
        departmentName: current.departmentName || me.department || '',
        signatureText: current.signatureText || me.displayName || '',
        initials: current.initials || initials(me.displayName)
      }));
    }
  }, [profile.data, profile.isLoading, me]);

  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
    } catch (error) {
      toast.error('Signature action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  const payload = {
    fullName: form.fullName,
    jobTitle: form.jobTitle,
    departmentName: form.departmentName,
    signatureMethod: form.signatureMethod,
    signatureText: form.signatureText,
    signatureImageUrl: form.signatureImageUrl,
    initials: form.initials,
    styleConfig: { font: 'serif', color: 'currentColor' }
  };
  const profilePayload = form.signatureVectorJson ? { ...payload, signatureVectorJson: form.signatureVectorJson } : payload;

  return (
    <div className="space-y-5">
      <header className="psm-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Electronic Signature Settings</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Create one verified signature profile used across PTW, MOC, PSSR, approvals, training, and future modules.</p>
          </div>
          <SignatureStatusBadge status={profile.data?.status ?? 'Not Created'} />
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="psm-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-info" />
            <h2 className="font-semibold">Signature Profile</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <input className="psm-input px-3 text-sm" placeholder="Full legal name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            <input className="psm-input px-3 text-sm" placeholder="Job title" value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} />
            <input className="psm-input px-3 text-sm" placeholder="Department" value={form.departmentName} onChange={(event) => setForm({ ...form, departmentName: event.target.value })} />
          </div>
          <div className="mt-5">
            <SignatureMethodSelector value={form.signatureMethod} onChange={(signatureMethod) => setForm({ ...form, signatureMethod, signatureText: signatureMethod === 'Type' && !form.signatureText ? form.fullName : form.signatureText, initials: signatureMethod === 'Initials' && !form.initials ? initials(form.fullName) : form.initials })} />
          </div>
          <div className="mt-5">
            {form.signatureMethod === 'Type' ? <SignatureTypedInput value={form.signatureText} onChange={(signatureText) => setForm({ ...form, signatureText })} /> : null}
            {form.signatureMethod === 'Draw' ? <SignatureDrawPad value={form.signatureVectorJson} onChange={(signatureVectorJson) => setForm({ ...form, signatureVectorJson })} /> : null}
            {form.signatureMethod === 'Upload' ? <SignatureUploadInput value={form.signatureImageUrl} onChange={(signatureImageUrl) => setForm({ ...form, signatureImageUrl })} /> : null}
            {form.signatureMethod === 'Initials' ? <input className="psm-input w-full px-3 text-sm" placeholder="Initials" value={form.initials} onChange={(event) => setForm({ ...form, initials: event.target.value.toUpperCase().slice(0, 4) })} /> : null}
          </div>
          <div className="mt-5 flex justify-end">
            <button className="psm-button psm-button-primary" disabled={mutations.saveProfile.isPending || mutations.updateProfile.isPending} onClick={() => run(() => profile.data ? mutations.updateProfile.mutateAsync(profilePayload) : mutations.saveProfile.mutateAsync(profilePayload), 'Signature profile saved')}>
              Save Signature Profile
            </button>
          </div>
        </section>
        <div className="space-y-5">
          <SignaturePreview profile={{ full_name: form.fullName, signature_method: form.signatureMethod, signature_text: form.signatureText, signature_image_url: form.signatureImageUrl, initials: form.initials, signature_vector_json: form.signatureVectorJson }} />
          <InitialsPreviewCard initials={form.initials} />
          <SignatureVerificationPanel profile={profile.data} busy={mutations.verifyProfile.isPending || mutations.disableProfile.isPending} onVerify={() => run(() => mutations.verifyProfile.mutateAsync(), 'Signature profile verified')} onDisable={() => run(() => mutations.disableProfile.mutateAsync(), 'Signature profile disabled')} />
        </div>
      </div>

      <section className="psm-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-warning" />
          <h2 className="font-semibold">Signature PIN</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="psm-input px-3 text-sm" type="password" placeholder="New PIN 4-8 digits" value={pin.pin} onChange={(event) => setPin({ ...pin, pin: event.target.value })} />
          <input className="psm-input px-3 text-sm" type="password" placeholder="Password confirmation" value={pin.password} onChange={(event) => setPin({ ...pin, password: event.target.value })} />
          <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.setPin.mutateAsync(pin.password ? { pin: pin.pin, password: pin.password } : { pin: pin.pin }), 'Signature PIN saved')}>Set PIN</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <input className="psm-input px-3 text-sm" type="password" placeholder="Current PIN" value={pin.currentPin} onChange={(event) => setPin({ ...pin, currentPin: event.target.value })} />
          <input className="psm-input px-3 text-sm" type="password" placeholder="New PIN" value={pin.newPin} onChange={(event) => setPin({ ...pin, newPin: event.target.value })} />
          <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.changePin.mutateAsync({ currentPin: pin.currentPin, newPin: pin.newPin }), 'Signature PIN changed')}>Change PIN</button>
        </div>
      </section>

      <section className="psm-card p-5">
        <h2 className="font-semibold">Signature Profile Versions</h2>
        <div className="mt-4 grid gap-2">
          {(versions.data ?? []).map((version: any) => (
            <div key={version.id} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span>Version {version.version} · {version.signature_method}</span>
              <span className="text-[var(--psm-muted)]">{new Date(version.created_at).toLocaleString()}</span>
            </div>
          ))}
          {!versions.isLoading && !(versions.data ?? []).length ? <div className="text-sm text-[var(--psm-muted)]">No profile versions yet.</div> : null}
        </div>
      </section>
    </div>
  );
}

function initials(name?: string | null) {
  return (name || 'User').split(' ').map((part) => part[0]).join('').slice(0, 4).toUpperCase();
}
