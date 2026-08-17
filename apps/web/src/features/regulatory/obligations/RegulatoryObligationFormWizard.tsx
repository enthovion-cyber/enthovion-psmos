import type { ReactNode } from 'react';

export function RegulatoryObligationFormWizard({ steps, currentStep, onStepChange, children }: { steps: readonly string[]; currentStep: number; onStepChange: (step: number) => void; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((label, index) => (
          <button key={label} type="button" onClick={() => onStepChange(index)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${currentStep === index ? 'border-primary bg-primary text-white' : 'border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)]'}`}>
            {index + 1}. {label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
