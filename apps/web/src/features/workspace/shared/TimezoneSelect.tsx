const zones = ['UTC', 'Asia/Riyadh', 'Asia/Karachi', 'Europe/London', 'America/New_York'];

export function TimezoneSelect({ value, onChange, label = 'Timezone' }: { value?: string; onChange: (value: string) => void; label?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}</span>
      <select className="psm-input h-10 w-full px-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select timezone</option>
        {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
      </select>
    </label>
  );
}
