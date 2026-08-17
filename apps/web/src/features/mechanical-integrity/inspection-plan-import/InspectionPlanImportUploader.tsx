'use client';

export function InspectionPlanImportUploader({ onRows }: { onRows: (rows: Array<Record<string, unknown>>) => void }) {
  const parse = async (file: File) => {
    const text = await file.text();
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    if (!headerLine) {
      onRows([]);
      return;
    }
    const headers = headerLine.split(',').map((h) => h.trim());
    onRows(lines.map((line) => Object.fromEntries(line.split(',').map((cell, index) => [headers[index], cell.trim()]))));
  };
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-6"><input type="file" accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} className="text-sm text-[var(--psm-text)]" /><p className="mt-2 text-xs text-[var(--psm-muted)]">CSV imports validate equipment tag, plan type, method, schedule, rule name, and CML scope before commit.</p></div>;
}
