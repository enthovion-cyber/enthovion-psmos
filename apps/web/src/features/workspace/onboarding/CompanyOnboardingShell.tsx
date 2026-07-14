'use client';

import { useState } from 'react';
import type { FoundationInput } from '@/services/foundation.service';
import { CompanyWorkspaceStep } from './CompanyWorkspaceStep';
import { CompanyProfileStep } from './CompanyProfileStep';
import { CompanyDomainStep } from './CompanyDomainStep';
import { SitesStep } from './SitesStep';
import { OrganizationStructureStep } from './OrganizationStructureStep';
import { ReviewCreateWorkspaceStep } from './ReviewCreateWorkspaceStep';
import { OnboardingProgress } from './OnboardingProgress';

export function CompanyOnboardingShell({ initialStep = 0 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<FoundationInput>({ name: '', status: 'ACTIVE' });
  const steps = [
    <CompanyWorkspaceStep key="workspace" draft={draft} setDraft={setDraft} />,
    <CompanyProfileStep key="profile" draft={draft} setDraft={setDraft} />,
    <CompanyDomainStep key="domain" draft={draft} setDraft={setDraft} />,
    <SitesStep key="sites" draft={draft} setDraft={setDraft} />,
    <OrganizationStructureStep key="organization" draft={draft} setDraft={setDraft} />,
    <ReviewCreateWorkspaceStep key="review" draft={draft} />
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="psm-card p-5">
        <h1 className="text-2xl font-semibold">Create Company Workspace</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Build the Company to Site to Department to Unit to Area hierarchy used for tenant and site isolation.</p>
      </section>
      <OnboardingProgress active={step} />
      {steps[step]}
      <div className="flex justify-between">
        <button className="psm-button psm-button-ghost" disabled={step === 0} title={step === 0 ? 'Already at first step' : 'Go back'} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
        <button className="psm-button psm-button-primary" disabled={step === steps.length - 1 || !draft.name} title={!draft.name ? 'Company name is required' : 'Continue'} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Continue</button>
      </div>
    </div>
  );
}
