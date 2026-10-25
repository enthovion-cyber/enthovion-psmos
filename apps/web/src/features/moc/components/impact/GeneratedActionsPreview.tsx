'use client';

import { Badge, DetailCard, EmptyState, MocButton } from '../moc-detail-ui';

const areaLabels: Record<string, string> = {
  equipment: 'Equipment',
  chemistry: 'Chemistry',
  procedure: 'Procedure',
  operating_limits: 'Operating Limits',
  safety_systems: 'Safety Systems',
  training: 'Training',
  documents: 'Documents / PSI',
  environmental: 'Environmental',
  quality: 'Quality / Production'
};

export function GeneratedActionsPreview({
  actions = [],
  blockers = { startup: [], closure: [] },
  onRegenerate,
  onApply,
  regenerating,
  applying,
  locked
}: {
  actions?: any[];
  blockers?: { startup?: any[]; closure?: any[] };
  onRegenerate?: () => void;
  onApply?: () => void;
  regenerating?: boolean;
  applying?: boolean;
  locked?: boolean;
}) {
  const grouped = actions.reduce<Record<string, any[]>>((acc, item) => {
    const key = item.impactArea ?? item.impact_area ?? 'other';
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});

  return (
    <DetailCard
      title="Downstream Action Spawner Preview"
      action={
        <div className="flex flex-wrap gap-2">
          <MocButton
            variant="secondary"
            disabled={locked || regenerating}
            onClick={onRegenerate}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Actions'}
          </MocButton>
          <MocButton
            variant="primary"
            disabled={locked || applying || !actions.length}
            onClick={onApply}
          >
            {applying ? 'Applying...' : 'Apply to Action Center'}
          </MocButton>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BlockerList title="Pre-Startup Timing Gate Blockers" items={blockers.startup ?? []} />
        <BlockerList title="MOC Closure Timing Gate Blockers" items={blockers.closure ?? []} />
      </div>

      {!actions.length ? (
        <EmptyState
          title="No generated required actions yet"
          detail="Save or regenerate the impact assessment to compute actions required for PSM compliance."
        />
      ) : null}

      <div className="space-y-4">
        {Object.entries(grouped).map(([area, items]) => (
          <section
            key={area}
            className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 transition-colors"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--psm-fg)]">
                {areaLabels[area] ?? area}
              </h3>
              <Badge tone="blue">{items.length} action(s)</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {items.map((item) => (
                <ActionCard key={`${item.ruleId ?? item.id}-${item.title}`} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DetailCard>
  );
}

function ActionCard({ item }: { item: any }) {
  const priorityTone =
    item.priority === 'SAFETY_CRITICAL' || item.priority === 'HIGH'
      ? 'red'
      : item.priority === 'MEDIUM'
      ? 'amber'
      : 'green';
  const statusToneVal =
    item.status === 'Completed'
      ? 'green'
      : item.status === 'No Longer Required'
      ? 'slate'
      : item.status === 'In Progress'
      ? 'amber'
      : 'blue';

  return (
    <article className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-xs transition-colors">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-bold text-[var(--psm-fg)]">{item.title}</h4>
          <p className="mt-1 leading-relaxed text-[var(--psm-muted)]">{item.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Badge tone={priorityTone as any}>{item.priority}</Badge>
          <Badge tone={statusToneVal as any}>{item.status}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--psm-muted)]">
        <span>Source: <strong className="text-[var(--psm-fg)]">{item.sourceImpactAnswer ?? 'Direct'}</strong></span>
        <span>Module: <strong className="text-[var(--psm-fg)]">{item.linkedModule ?? 'Action Center'}</strong></span>
        <span>Due: <strong className="text-[var(--psm-fg)]">{item.dueDate ?? 'Unscheduled'}</strong></span>
        <span>Startup Gate: <strong className="text-[var(--psm-fg)]">{item.requiredBeforeStartup ? 'Yes (Hard Gate)' : 'No'}</strong></span>
        <span>Closure Gate: <strong className="text-[var(--psm-fg)]">{item.requiredBeforeClosure ? 'Yes' : 'No'}</strong></span>
      </div>
    </article>
  );
}

function BlockerList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 transition-colors">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-fg)]">{title}</h4>
        <Badge tone={items.length ? 'red' : 'green'}>{items.length}</Badge>
      </div>
      {items.length ? (
        <ul className="space-y-1.5 text-xs">
          {items.slice(0, 4).map((item, index) => (
            <li key={`${item.title}-${index}`} className="flex items-center justify-between text-[var(--psm-fg)]">
              <span className="truncate">{item.title}</span>
              <span className="ml-2 font-mono text-[10px] text-[var(--psm-muted)]">({item.status})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--psm-muted)]">No active blockers for this gate.</p>
      )}
    </div>
  );
}
