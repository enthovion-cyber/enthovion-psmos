export function ReportFormatExportSection({ value, set }: { value: Record<string, unknown>; set: (key: string, value: unknown) => void }) {
  const formats = new Set(Array.isArray(value.formats) ? (value.formats as string[]) : ["PDF"]);
  const toggle = (format: string) => { const next = new Set(formats); next.has(format) ? next.delete(format) : next.add(format); set("formats", Array.from(next)); };
  return <div className="grid gap-3 md:grid-cols-6">{["PDF","DOCX","XLSX","CSV","JSON","ZIP"].map((format) => <label key={format} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input className="mr-2" type="checkbox" defaultChecked={formats.has(format)} onChange={() => toggle(format)} />{format}</label>)}</div>;
}
