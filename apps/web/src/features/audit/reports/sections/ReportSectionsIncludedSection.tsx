export function ReportSectionsIncludedSection({ value, set }: { value: Record<string, unknown>; set: (key: string, value: unknown) => void }) {
  const selected = new Set(Array.isArray(value.sections) ? (value.sections as string[]) : ["executive_summary","source_snapshot","findings_capa","evidence_manifest","scoring_standards","approval_history"]);
  const toggle = (section: string) => {
    const next = new Set(selected);
    next.has(section) ? next.delete(section) : next.add(section);
    set("sections", Array.from(next).map((key) => ({ key, title: key.replaceAll("_", " "), included: true })));
  };
  return <div className="grid gap-3 md:grid-cols-3">{["executive_summary","source_snapshot","findings_capa","evidence_manifest","scoring_standards","standards_traceability","approval_history","access_download_log","appendices"].map((section) => <label key={section} className="flex items-center gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input type="checkbox" defaultChecked={selected.has(section)} onChange={() => toggle(section)} />{section.replaceAll("_", " ")}</label>)}</div>;
}
