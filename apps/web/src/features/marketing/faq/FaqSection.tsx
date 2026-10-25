'use client';

import { faqItems } from '../home/marketing-content';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[var(--psm-bg)] transition-colors">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-primary)]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)]">
            <HelpCircle size={13} />
            <span>Industrial Implementation FAQ</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
            Frequently Asked Questions by Safety &amp; Engineering Teams.
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--psm-muted)] font-normal max-w-2xl mx-auto">
            Clear answers on compliance certifications, trial onboarding, multi-site scope isolation, and cybersecurity governance.
          </p>
        </div>

        <div className="mt-12 space-y-3.5">
          {faqItems.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={question}
                className="overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] transition-all duration-200 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 sm:p-6 text-left transition hover:bg-[var(--psm-surface-2)]/50"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[var(--psm-text)] pr-4">
                    {question}
                  </span>
                  <div className={`grid h-7 w-7 place-items-center rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-[var(--psm-surface-2)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--psm-primary)]' : 'text-[var(--psm-muted)]'}`}>
                    <ChevronDown size={16} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-5 pb-5 pt-3.5 sm:px-6 sm:pb-6 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] bg-[var(--psm-surface-2)]/25 animate-in fade-in duration-200 font-normal">
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
