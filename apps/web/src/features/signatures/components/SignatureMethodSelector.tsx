export function SignatureMethodSelector({ value, onChange }: { value: 'Draw' | 'Type' | 'Upload' | 'Initials'; onChange: (value: 'Draw' | 'Type' | 'Upload' | 'Initials') => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {(['Draw', 'Type', 'Upload', 'Initials'] as const).map((method) => (
        <button key={method} type="button" className={`rounded-lg border px-3 py-3 text-sm font-semibold ${value === method ? 'border-info bg-info/15 text-info' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-text)]'}`} onClick={() => onChange(method)}>
          {method}
        </button>
      ))}
    </div>
  );
}
