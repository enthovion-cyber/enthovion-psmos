'use client';

export function AttendanceStatusSelector({ value, onChange, disabled }: { value?: string | null; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <select disabled={disabled} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm disabled:opacity-60" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select status</option>
      {['Present', 'Absent', 'Partial', 'Late', 'Left Early', 'Excused', 'No Show', 'Not Required'].map((status) => <option key={status} value={status}>{status}</option>)}
    </select>
  );
}
