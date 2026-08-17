import Link from 'next/link';

export function MiNotFoundState({ message = 'Equipment was not found or is outside your company/site access scope.' }: { message?: string }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8">
      <h1 className="text-xl font-semibold">Equipment unavailable</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--psm-muted)]">{message}</p>
      <Link href="/mechanical-integrity/equipment" className="psm-button psm-button-secondary mt-5 inline-flex">Back to Equipment Registry</Link>
    </section>
  );
}
