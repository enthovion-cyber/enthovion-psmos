'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { readStoredMarketingIntent } from '@/features/marketing/utils/cta-routing';
import { SignupProgressStepper } from './SignupProgressStepper';
import { SignupPlanCard } from './SignupPlanCard';
import { useSignupPlans } from '../hooks/useSignupStatus';
import { useStartCheckout, useStartTrial } from '../hooks/useSignup';

export function ChoosePlanPage() {
  const params = useSearchParams();
  const sessionId = params.get('sessionId') ?? undefined;
  const stored = typeof window !== 'undefined' ? readStoredMarketingIntent() : { intent: null, plan: null };
  const intendedPlan = params.get('plan') ?? stored.plan ?? undefined;
  const intendedIntent = params.get('intent') ?? stored.intent ?? undefined;
  const plans = useSignupPlans();
  const startTrial = useStartTrial();
  const startCheckout = useStartCheckout();
  const [notice, setNotice] = useState<string | null>(null);
  const [autoTrialStarted, setAutoTrialStarted] = useState(false);
  const busy = startTrial.isPending || startCheckout.isPending;
  const selectedPlan = useMemo(() => plans.data?.plans.find((plan) => plan.code === intendedPlan), [plans.data?.plans, intendedPlan]);

  async function trial() {
    setNotice(null);
    const result = await startTrial.mutateAsync(sessionId ? { sessionId } : {});
    window.location.href = result.next ?? '/signup/success';
  }

  async function checkout(planCode: string) {
    setNotice(null);
    const result = await startCheckout.mutateAsync({ planCode, ...(sessionId ? { sessionId } : {}) });
    if (result.success) window.location.href = '/signup/success';
    else setNotice(result.message ?? 'Checkout is unavailable. Start a trial or contact sales.');
  }

  useEffect(() => {
    if (autoTrialStarted || busy || !plans.data?.plans.length) return;
    if (intendedIntent === 'trial' || intendedPlan === 'trial') {
      setAutoTrialStarted(true);
      void trial();
    }
  }, [autoTrialStarted, busy, plans.data?.plans.length, intendedIntent, intendedPlan]);

  return (
    <section className="psm-panel w-full max-w-5xl rounded-xl p-6 shadow-psm">
      <SignupProgressStepper current="plan" />
      <h1 className="text-2xl font-semibold">Choose a plan</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Plans and prices are loaded from billing configuration. No checkout values are hardcoded in the UI.</p>
      {selectedPlan ? <div className="mt-4 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">Selected plan preserved: {selectedPlan.name}</div> : intendedPlan ? <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">Selected plan code preserved: {intendedPlan}</div> : null}
      {plans.isLoading ? <div className="mt-6 rounded-lg bg-[var(--psm-surface-2)] p-5 text-sm text-[var(--psm-muted)]">Loading plans...</div> : null}
      {plans.error ? <div className="mt-6 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">Unable to load billing plans.</div> : null}
      {notice ? <div className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">{notice}</div> : null}
      {!plans.isLoading && !plans.data?.plans.length ? (
        <div className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-5 text-sm text-warning">
          Billing plans are not configured yet. Ask an administrator to configure public plans, or continue after setup.
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.data?.plans.map((plan) => (
          <SignupPlanCard key={plan.id} plan={plan} busy={busy} onTrial={() => void trial()} onCheckout={() => void checkout(plan.code)} />
        ))}
      </div>
    </section>
  );
}
