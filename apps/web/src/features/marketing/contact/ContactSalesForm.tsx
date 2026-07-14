'use client';

import { useState } from 'react';

export function ContactSalesForm({ plan = 'enterprise' }: { plan?: string | undefined }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm font-semibold text-emerald-600 dark:text-emerald-300">Thanks. Your sales request has been prepared. Connect this form to the CRM/email endpoint when available.</div>;
  }
  return (
    <form className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-[var(--psm-shadow-soft)]" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" required />
        <Field label="Work email" type="email" required />
        <Field label="Company" required />
        <Field label="Plan interest" defaultValue={plan} />
      </div>
      <label className="mt-4 block text-sm">
        <span className="mb-2 block font-bold">What should we help with?</span>
        <textarea className="psm-input min-h-28 w-full p-3" placeholder="Tell us about sites, modules, onboarding, SSO, or enterprise governance needs." />
      </label>
      <button className="psm-button psm-button-primary mt-5" type="submit">Request sales contact</button>
    </form>
  );
}

function Field({ label, type = 'text', required = false, defaultValue = '' }: { label: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-bold">{label}</span>
      <input className="psm-input w-full px-3" type={type} required={required} defaultValue={defaultValue} />
    </label>
  );
}
