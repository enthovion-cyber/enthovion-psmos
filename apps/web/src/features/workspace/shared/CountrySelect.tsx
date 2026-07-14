const countries = ['Saudi Arabia', 'Pakistan', 'United Arab Emirates', 'United States', 'United Kingdom'];

export function CountrySelect({ value, onChange, label = 'Country' }: { value?: string; onChange: (value: string) => void; label?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}</span>
      <select className="psm-input h-10 w-full px-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select country</option>
        {countries.map((country) => <option key={country} value={country}>{country}</option>)}
      </select>
    </label>
  );
}
