'use client';

import { useApprovalRuleMutations, useApprovalRules } from '../../hooks/useApprovalRules';
import { ApprovalStatusBadge } from '../../shared/ApprovalStatusBadge';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { ReviewButton, ReviewCard } from '../ReviewApprovalPrimitives';
import { ApprovalRuleForm } from './ApprovalRuleForm';

export function ApprovalRuleConfigPage() {
  const query = useApprovalRules();
  const mutations = useApprovalRuleMutations();
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load approval rules. Configure-rules permission may be required.</div>;
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h1 className="text-2xl font-bold">MI Approval Rule Configuration</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Configure source-module routing, risk/safety triggers, due durations, approval stages, and e-signature requirements. Workflow Engine remains the execution layer.</p>
      </header>
      <ApprovalRuleForm onSubmit={(input) => mutations.create.mutate(input)} />
      <ReviewCard title="Approval Rules" description="Active and archived routing policies.">
        <div className="space-y-2">
          {(query.data ?? []).map((rule) => (
            <div key={rule.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{rule.rule_name}</p>
                  <p className="text-sm text-[var(--psm-muted)]">{rule.source_module} - risk {rule.risk_level ?? 'any'} - {rule.approval_chain_json?.length ?? 0} stage(s)</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ApprovalStatusBadge status={rule.active ? 'Active' : 'Archived'} />
                  <ReviewButton disabled={!rule.active} title="Rule already archived." onClick={() => mutations.archive.mutate(rule.id)}>Archive</ReviewButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ReviewCard>
    </div>
  );
}
