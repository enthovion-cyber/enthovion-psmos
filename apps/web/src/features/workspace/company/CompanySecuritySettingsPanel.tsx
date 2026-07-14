type Settings = { requireMfa: boolean; requireESignature: boolean; allowGoogleLogin: boolean; allowDomainAutoJoin: boolean };

export function CompanySecuritySettingsPanel({ settings, onChange }: { settings: Settings; onChange: (settings: any) => void }) {
  return (
    <section className="psm-card p-5">
      <h2 className="text-lg font-semibold">Security Settings</h2>
      <div className="mt-4 grid gap-3">
        <Toggle label="Require MFA" value={settings.requireMfa} onChange={(requireMfa) => onChange((current: Settings) => ({ ...current, requireMfa }))} />
        <Toggle label="Require e-signature" value={settings.requireESignature} onChange={(requireESignature) => onChange((current: Settings) => ({ ...current, requireESignature }))} />
        <Toggle label="Allow Google login later" value={settings.allowGoogleLogin} onChange={(allowGoogleLogin) => onChange((current: Settings) => ({ ...current, allowGoogleLogin }))} />
        <Toggle label="Allow domain auto-join later" value={settings.allowDomainAutoJoin} onChange={(allowDomainAutoJoin) => onChange((current: Settings) => ({ ...current, allowDomainAutoJoin }))} />
      </div>
    </section>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] p-3 text-sm"><span>{label}</span><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /></label>;
}
