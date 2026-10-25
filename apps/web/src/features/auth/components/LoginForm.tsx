'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { validateLogin } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { GoogleLoginButton } from './GoogleLoginButton';
import { AuthBrand } from './AuthBrand';

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const login = useLogin();
  const setSession = useAuthStore((state) => state.setSession);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Validation
    const errors = validateLogin(form);
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }
    setError(null);

    try {
      const result = await login.mutateAsync(form);
      setSession(result.accessToken, result.tenantId, result.refreshToken);
      
      const destination = !result.next || result.next === '/dashboard' ? '/executive' : result.next;
      router.push(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('disabled')) {
        router.push('/account-disabled');
      } else if (lowerMsg.includes('workspace')) {
        router.push('/access-denied');
      } else {
        setError(message);
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={submit}
        className="relative"
      >
        <div className="mb-9 lg:hidden"><AuthBrand compact /></div>
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-[var(--psm-primary)]"><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-[.14em]">Secure workspace</span></div>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] dark:text-slate-300">Access your Enthovion PSM OS workspace.</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="mb-2 block text-sm font-semibold"
            >
              Email address
            </label>
            <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} /><input id="email" name="email" type="email" required autoComplete="email" placeholder="name@company.com" className="psm-input w-full bg-white px-10 py-2.5 text-sm dark:border-[#355477] dark:bg-[#10213b]" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="mb-2 block text-sm font-semibold"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="psm-input w-full bg-white px-10 py-2.5 text-sm dark:border-[#355477] dark:bg-[#10213b]"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)] transition-colors hover:text-[var(--psm-text)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Options Row */}
        <div className="my-5 flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--psm-text)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--psm-line)] accent-[var(--psm-primary)]"
              checked={form.rememberMe}
              onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-[var(--action-primary)] transition-colors hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Error Alert */}
        {error ? (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
            <span className="shrink-0">•</span>
            <span>{error}</span>
          </div>
        ) : null}

        {/* Primary Action Button */}
        <button
          className="psm-button psm-button-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
          type="submit"
          disabled={login.isPending}
        >
          {login.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <><span>Sign in</span><ArrowRight size={17} /></>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-[var(--psm-line)]" />
          <span className="absolute bg-[var(--psm-surface)] px-3 text-xs font-medium text-[var(--psm-muted)]">
            or continue with
          </span>
        </div>

        {/* SSO Button */}
        <div className="w-full">
          <GoogleLoginButton />
        </div>

        {/* Footer Navigation Links */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs font-medium">
          <Link
            href="/signup"
            className="text-info transition-colors hover:underline"
          >
            Sign Up
          </Link>
          <span className="text-[var(--psm-line)]">|</span>
          <Link
            href="/auth/accept-invite"
            className="text-info transition-colors hover:underline"
          >
            Accept an invitation
          </Link>
        </div>
      </form>
    </div>
  );
}
