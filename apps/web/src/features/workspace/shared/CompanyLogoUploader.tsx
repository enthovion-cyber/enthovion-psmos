export function CompanyLogoUploader({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  return <Field label="Logo URL" value={value ?? ''} onChange={onChange} placeholder="https://..." />;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{label}</span><input className="psm-input h-10 w-full px-3" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}
