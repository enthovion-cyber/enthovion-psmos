import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export function SignupSuccessPage() {
  return (
    <section className="psm-panel w-full max-w-md rounded-xl p-6 text-center shadow-psm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success"><CheckCircle2 size={28} /></div>
      <h1 className="mt-4 text-2xl font-semibold">Workspace ready</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Your company workspace and administrator profile were created. Continue to the dashboard to finish setup.</p>
      <Link href="/dashboard" className="psm-button psm-button-primary mt-6 w-full">Open dashboard</Link>
    </section>
  );
}
