const steps = ['Workspace', 'Profile', 'Domain', 'Sites', 'Organization', 'Review'];

export function OnboardingProgress({ active = 0 }: { active?: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-6">
      {steps.map((step, index) => <div key={step} className={`rounded-xl border p-3 text-xs font-semibold ${index <= active ? 'border-info bg-info/10 text-info' : 'border-[var(--psm-line)] text-[var(--psm-muted)]'}`}>{index + 1}. {step}</div>)}
    </div>
  );
}
