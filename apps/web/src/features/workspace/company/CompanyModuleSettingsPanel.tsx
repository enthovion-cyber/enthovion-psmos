export function CompanyModuleSettingsPanel({ settings, onChange }: { settings: any; onChange: (settings: any) => void }) {
  return (
    <section className="psm-card p-5">
      <h2 className="text-lg font-semibold">Default Workspace Settings</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Default timezone" value={settings.timezone} onChange={(timezone) => onChange((current: any) => ({ ...current, timezone }))} />
        <Field label="Default currency" value={settings.currency} onChange={(currency) => onChange((current: any) => ({ ...current, currency }))} />
        <Field label="Date format" value={settings.dateFormat} onChange={(dateFormat) => onChange((current: any) => ({ ...current, dateFormat }))} />
        <Field label="Time format" value={settings.timeFormat} onChange={(timeFormat) => onChange((current: any) => ({ ...current, timeFormat }))} />
        <Field label="Language" value={settings.language} onChange={(language) => onChange((current: any) => ({ ...current, language }))} />
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{label}</span><input className="psm-input h-10 w-full px-3" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
