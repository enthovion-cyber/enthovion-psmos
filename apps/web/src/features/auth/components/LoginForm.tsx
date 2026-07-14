'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { validateLogin } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { GoogleLoginButton } from './GoogleLoginButton';

export function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
  const setSession = useAuthStore((state) => state.setSession);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateLogin(form);
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }
    setError(null);
    try {
      const result = await login.mutateAsync(form);
      setSession(result.accessToken, result.tenantId, result.refreshToken);
      window.location.href = result.next ?? '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      if (message.toLowerCase().includes('disabled')) window.location.href = '/account-disabled';
      else if (message.toLowerCase().includes('workspace')) window.location.href = '/access-denied';
      else setError(message);
    }
  }

  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-info/20 text-info"><ShieldCheck size={20} /></div>
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-[var(--psm-muted)]">PSM OS secure workspace access</p>
        </div>
      </div>
      <label className="mb-4 block text-sm">
        <span className="mb-2 block text-[var(--psm-muted)]">Email</span>
        <input required className="psm-input w-full px-3" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-2 block text-[var(--psm-muted)]">Password</span>
        <input required className="psm-input w-full px-3" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      </label>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-[var(--psm-muted)]"><input type="checkbox" checked={form.rememberMe} onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })} /> Remember me</label>
        <Link href="/forgot-password" className="text-info hover:underline">Forgot password?</Link>
      </div>
      {error ? <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary w-full" type="submit" disabled={login.isPending}>Continue</button>
      <div className="my-4 border-t border-[var(--psm-line)]" />
      <GoogleLoginButton />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link href="/signup" className="text-info hover:underline">Sign Up</Link>
        <span className="text-[var(--psm-muted)]">|</span>
        <Link href="/auth/accept-invite" className="text-info hover:underline">Accept an invitation</Link>
      </div>
    </form>
  );
}
