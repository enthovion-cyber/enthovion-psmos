export function SignatureTypedInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input className="psm-input w-full px-3 text-sm" placeholder="Type full legal signature" value={value} onChange={(event) => onChange(event.target.value)} />;
}
