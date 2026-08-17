export function ReportApprovalAccessSection({ value, set }: { value: Record<string, unknown>; set: (key: string, value: unknown) => void }) {
  return <div className="grid gap-3 md:grid-cols-3">{["approvalRequired","approvedSnapshotRequired","restricted"].map((key) => <label key={key} className="flex items-center gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(value[key])} onChange={(e) => set(key, e.target.checked)} />{key.replace(/([A-Z])/g, " $1")}</label>)}</div>;
}
