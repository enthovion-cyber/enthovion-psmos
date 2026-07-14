'use client';

import { ExternalLink } from 'lucide-react';
import { HazopMiniProcessDiagram } from './HazopMiniProcessDiagram';

export function HazopEquipmentProcessContext({ context, onNavigate }: { context: any; onNavigate: (tab?: string) => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">10. Equipment / Process Context</h3>
        <button onClick={() => onNavigate('Linked Records')} className="text-xs font-semibold text-primary">View records</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-[var(--psm-line)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Key Equipment ({context.equipment?.length ?? 0})</div>
            <span className="text-xs text-[var(--psm-muted)]">{context.processSection ?? 'Process section'}</span>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {(context.equipment ?? []).map((item: any) => (
              <a key={item.id ?? item.tag} href={`/equipment/${item.id}`} className="block rounded-lg border border-[var(--psm-line)] p-2 hover:bg-[var(--psm-surface-2)]">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold text-primary">{item.tag}</span><ExternalLink size={12} /></div>
                <div className="text-xs text-[var(--psm-muted)]">{item.name ?? '-'} / {item.type ?? '-'} / {item.criticality ?? 'Unrated'}</div>
                <div className="mt-1 text-[11px] text-[var(--psm-muted)]">{item.nodeCount ?? 0} nodes / {item.scenarioCount ?? 0} scenarios</div>
              </a>
            ))}
            {!(context.equipment ?? []).length ? <Empty text="No equipment linked to this HAZOP." /> : null}
          </div>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]">
            {(context.pidReferences ?? []).slice(0, 8).map((pid: string) => <span key={pid} className="rounded border border-[var(--psm-line)] px-2 py-1">{pid}</span>)}
          </div>
          <HazopMiniProcessDiagram equipment={context.diagramNodes ?? []} />
        </div>
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
