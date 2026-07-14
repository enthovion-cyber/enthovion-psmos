'use client';

import Link from 'next/link';

export function AuthErrorState({ title = 'Access issue', message, actionHref = '/login', actionLabel = 'Back to login' }: { title?: string; message: string; actionHref?: string; actionLabel?: string }) {
  return (
    <section className="psm-panel w-full max-w-lg rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">{message}</p>
      <Link href={actionHref} className="psm-button psm-button-primary mt-5">{actionLabel}</Link>
    </section>
  );
}
