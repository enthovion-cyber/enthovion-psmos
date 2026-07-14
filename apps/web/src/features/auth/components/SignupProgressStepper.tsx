const steps = ['Account', 'Verify', 'Workspace', 'Plan'];

export function SignupProgressStepper({ current }: { current: 'account' | 'verify' | 'workspace' | 'plan' | 'success' }) {
  const index = current === 'account' ? 0 : current === 'verify' ? 1 : current === 'workspace' ? 2 : 3;
  return (
    <div className="mb-6 grid grid-cols-4 gap-2 text-xs">
      {steps.map((step, stepIndex) => (
        <div key={step} className={stepIndex <= index ? 'rounded-md bg-info/15 px-2 py-2 text-info' : 'rounded-md bg-[var(--psm-surface-2)] px-2 py-2 text-[var(--psm-muted)]'}>
          <div className="font-semibold">{step}</div>
        </div>
      ))}
    </div>
  );
}
