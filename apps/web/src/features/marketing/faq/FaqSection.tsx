import { faqItems } from '../home/marketing-content';

export function FaqSection() {
  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">FAQ</p>
        <h2 className="mt-3 text-4xl font-black tracking-normal">Questions industrial teams ask before starting.</h2>
        <div className="mt-8 divide-y divide-[var(--psm-line)] rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          {faqItems.map(([question, answer]) => (
            <details key={question} className="group p-5">
              <summary className="cursor-pointer text-base font-black">{question}</summary>
              <p className="mt-3 text-sm leading-7 text-[var(--psm-muted)]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
