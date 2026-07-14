export function SignatureDeclaration({ text }: { text?: string | null }) {
  return (
    <div className="rounded-lg border border-info/30 bg-info/10 p-3 text-sm text-[var(--psm-text)]">
      {text ?? 'I confirm that I have reviewed the information above and approve this action using my electronic signature.'}
    </div>
  );
}
