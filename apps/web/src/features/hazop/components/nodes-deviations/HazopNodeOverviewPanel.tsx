import type { HazopNodeListItem } from "../../types/hazop-node.types";

export function HazopNodeOverviewPanel({ node }: { node: HazopNodeListItem & Record<string, any> }) {
  const equipment = node.equipment_link_snapshots ?? node.equipmentLinks ?? [];
  const documents = node.document_version_snapshots ?? node.documentLinks ?? [];
  const parameters = node.parameter_configurations ?? node.parameterRows ?? [];
  const fields = [
    ["Design intent", node.design_intent],
    ["Boundaries", node.boundary_limits ?? node.boundaries],
    ["Assumptions", node.assumptions],
    ["Exclusions", node.exclusions],
    ["Process conditions", node.process_conditions],
  ];
  return (
    <section className="space-y-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <div className="text-[11px] font-semibold uppercase text-[var(--psm-muted)]">{label}</div>
          <p className="mt-1 line-clamp-3 text-sm">{value || "Not captured"}</p>
        </div>
      ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <MiniList title="Equipment context" items={equipment.map((item: any) => [item.tag ?? item.equipmentTag ?? item.equipment_tag, item.name ?? item.equipmentName ?? item.equipment_name, item.type ?? item.equipmentType ?? item.equipment_type].filter(Boolean).join(" · "))} empty="No linked equipment" />
        <MiniList title="Pinned P&ID / documents" items={documents.map((item: any) => [item.document_number ?? item.documentNumber, item.title ?? item.document_title, item.revision ?? item.pinnedVersion].filter(Boolean).join(" · "))} empty="No pinned documents" />
        <MiniList title="Node parameters" items={parameters.map((item: any) => [item.parameterName ?? item.parameter_name, item.normalOperatingRange ?? item.normal_operating_range, item.unitOfMeasurement ?? item.unit_of_measurement].filter(Boolean).join(" · "))} empty="No configured parameters" />
      </div>
    </section>
  );
}

function MiniList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase text-slate-400">{title}</div>
      <div className="space-y-1">
        {items.length ? items.slice(0, 4).map((item) => <div key={item} className="truncate text-xs text-slate-200">{item}</div>) : <div className="text-xs text-slate-500">{empty}</div>}
      </div>
    </div>
  );
}
