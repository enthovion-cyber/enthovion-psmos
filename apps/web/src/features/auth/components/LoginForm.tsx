'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { validateLogin } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { GoogleLoginButton } from './GoogleLoginButton';

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
      
      const destination = result.next ?? '/dashboard';
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
        className="psm-panel relative overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface-1)] p-8 shadow-2xl backdrop-blur-md transition-all duration-200"
      >
        {/* Top Accent Line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-info/40 via-info to-info/40" />

        {/* Header Section */}
        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-info/20 bg-info/10 text-info shadow-inner">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--psm-foreground)]">
              Sign in
            </h1>
            <p className="text-sm font-medium text-[var(--psm-muted)]">
              PSM OS enterprise workspace access
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@company.com"
              className="psm-input w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3.5 py-2.5 text-sm transition-all focus:border-info focus:outline-none focus:ring-2 focus:ring-info/20"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]"
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
                className="psm-input w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] pl-3.5 pr-10 py-2.5 text-sm transition-all focus:border-info focus:outline-none focus:ring-2 focus:ring-info/20"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)] transition-colors hover:text-[var(--psm-foreground)] focus:outline-none"
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
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--psm-muted)] transition-colors hover:text-[var(--psm-foreground)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--psm-line)] accent-info"
              checked={form.rememberMe}
              onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-info transition-colors hover:underline hover:text-info/80"
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
          className="psm-button psm-button-primary flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
          type="submit"
          disabled={login.isPending}
        >
          {login.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-[var(--psm-line)]" />
          <span className="absolute bg-[var(--psm-surface-1)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            or
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