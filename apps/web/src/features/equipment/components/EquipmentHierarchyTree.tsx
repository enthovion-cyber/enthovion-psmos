'use client';

import type { Equipment } from '@/services/equipment.service';
import Link from 'next/link';
import { GitBranch, Network, Layers, ChevronDown } from 'lucide-react';

function SimpleHierarchyRow({ 
  item, 
  isActive = false, 
  hasConnector = false 
}: { 
  item: Equipment; 
  isActive?: boolean; 
  hasConnector?: boolean;
}) {
  return (
    <div className="relative flex items-center group">
      {/* Visual Tree Connector Line for child elements */}
      {hasConnector && (
        <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-5 h-px border-t border-dashed border-[var(--psm-line)]" />
      )}

      <Link
        href={`/equipment/${item.id}`}
        className={`flex-1 flex items-center gap-3 rounded-lg p-2.5 text-sm transition-all duration-200 ${
          isActive
            ? 'border border-success/40 bg-success/5 text-white'
            : 'border border-transparent hover:bg-[var(--psm-surface-2)]/50 text-[var(--psm-text)]'
        }`}
      >
        {/* Mockup Node Icon */}
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          isActive 
            ? 'bg-success/20 text-success' 
            : 'bg-[var(--psm-surface-2)] border border-[var(--psm-line)] text-info'
        }`}>
          {isActive ? <ChevronDown size={14} className="text-success mr-0.5 mt-0.5" /> : <Layers size={14} />}
        </div>

        {/* Text Node Metadata */}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-semibold text-sm tracking-wide text-white group-hover:text-info transition-colors">
            {item.tag}
          </div>
          <div className="mt-0.5 text-xs text-[var(--psm-muted)] truncate">
            {item.name} {item.subtype ? `- ${item.subtype}` : ''}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function EquipmentHierarchyTree({ equipment }: { equipment: Equipment }) {
  const related = [
    ...(equipment.relationshipsFrom ?? []).map((rel) => ({ id: rel.id, type: rel.type, direction: 'Outgoing', item: rel.toEquipment, description: rel.description })),
    ...(equipment.relationshipsTo ?? []).map((rel) => ({ id: rel.id, type: rel.type, direction: 'Incoming', item: rel.fromEquipment, description: rel.description }))
  ];

  return (
    <div className="psm-card rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] overflow-hidden flex flex-col">
      
      {/* Clean Header */}
      <div className="p-4 border-b border-[var(--psm-line)] flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Equipment Hierarchy</h2>
        <span className="text-xs text-[var(--psm-muted)] font-medium">
          {equipment.children?.length ?? 0} child assets
        </span>
      </div>

      {/* Structural Tree Render Area */}
      <div className="p-4 flex-1">
        <div className="relative space-y-1">
          
          {/* Parent Asset (rendered directly above current if exists) */}
          {equipment.parent && (
            <div className="mb-2">
              <SimpleHierarchyRow item={equipment.parent} />
            </div>
          )}

          {/* Active Node (Current Asset Focus Container) */}
          <SimpleHierarchyRow item={equipment} isActive={true} />

          {/* Connected Children Block */}
          <div className="relative ml-6 mt-1 pl-4 space-y-1">
            {/* The vertical trunk line linking the children nodes */}
            {(equipment.children ?? []).length > 0 && (
              <div className="absolute left-0 top-0 bottom-6 w-px border-l border-dashed border-[var(--psm-line)]" />
            )}

            {(equipment.children ?? []).map((child) => (
              <SimpleHierarchyRow 
                key={child.id} 
                item={child} 
                hasConnector={true} 
              />
            ))}

            {(equipment.children ?? []).length === 0 && (
              <div className="text-xs text-[var(--psm-muted)] py-3 pl-2 italic">
                No child sub-assets registered.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Associated Relationships Panel Section */}
      {related.length > 0 && (
        <div className="border-t border-[var(--psm-line)] bg-[var(--psm-surface-2)]/20 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)] flex items-center gap-1.5">
            <Network size={12} /> Related Dependencies
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {related.map((rel) => (
              <div key={rel.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-xs">
                <div className="mb-1.5 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  <span className="inline-flex items-center gap-0.5"><GitBranch size={11} /> {rel.direction}</span>
                  <span>{rel.type.replaceAll('_', ' ')}</span>
                </div>
                <Link href={`/equipment/${rel.item.id}`} className="font-semibold text-white hover:text-info transition-colors">
                  {rel.item.tag} <span className="font-normal text-[var(--psm-muted)]">— {rel.item.name}</span>
                </Link>
                {rel.description && <p className="mt-1 opacity-80 line-clamp-1">{rel.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mockup Action Button Footer layer */}
      <div className="p-3 bg-[var(--psm-surface)] border-t border-[var(--psm-line)] text-center">
        <button 
          type="button" 
          className="w-full text-xs font-semibold text-info hover:underline bg-transparent border-0 cursor-pointer py-1"
          onClick={() => {}} /* Hook up global full tree visualizer triggers if any */
        >
          View Full Tree
        </button>
      </div>

    </div>
  );
}