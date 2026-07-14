"use client";

export function HazopNodeHierarchyTab({ form, hierarchy, owners, canOverride, onChange }: any) {
  const item = (label: string, value: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-slate-400">{label} *</span>
      <input className="input bg-white/[.03] text-slate-300" value={value || "Not set in study context"} readOnly={!canOverride} onChange={(event) => onChange(label.toLowerCase() + "Id", event.target.value)} />
    </label>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {item("Site", hierarchy?.site?.name ?? hierarchy?.site?.id)}
      {item("Complex", hierarchy?.complex?.name ?? hierarchy?.complex?.id)}
      {item("Unit", hierarchy?.unit?.name ?? hierarchy?.unit?.id)}
      {item("Area", hierarchy?.area?.name ?? hierarchy?.area?.id)}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-slate-400">Owner</span>
        <select className="input" value={form.ownerId ?? ""} onChange={(event) => onChange("ownerId", event.target.value)}>
          <option value="">Unassigned</option>
          {owners.map((user: any) => <option key={user.id} value={user.id}>{user.displayName ?? user.email} {user.discipline ? `- ${user.discipline}` : ""}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-slate-400">Status</span>
        <select className="input" value={form.status ?? "Draft"} onChange={(event) => onChange("status", event.target.value)}>
          {["Draft", "Under Review", "Approved", "Archived"].map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <div className="lg:col-span-2 rounded-lg border border-white/10 bg-white/[.03] p-3 text-xs text-slate-400">
        Site, complex, unit, and area are locked to the active HAZOP study context. Study admin override is only available when the backend grants the matching scope.
      </div>
    </div>
  );
}
