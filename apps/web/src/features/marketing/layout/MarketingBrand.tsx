'use client';

import Link from 'next/link';

export function MarketingBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5 sm:gap-3 transition py-1 select-none"
      aria-label="Enthovion PSM OS home"
    >
      {/* Official 3D Hexagon Icon */}
      <img
        src="/enthovion-icon.png"
        alt="Enthovion logo mark"
        className={`shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 ${
          compact ? 'h-8 sm:h-9 w-auto' : 'h-10 sm:h-11 w-auto'
        }`}
      />

      {/* Brand Typography Lockup */}
      <div className="flex flex-col justify-center min-w-0 leading-none">
        {/* Line 1: ENTHOVION with integrated orange triangle atop the 'I' */}
        <div className="flex items-center text-[15px] sm:text-base font-black tracking-[0.07em] leading-none text-slate-900 dark:text-white transition-colors">
          <span>ENTHOV</span>
          {/* Custom 'I' with orange triangle atop stem, fitting cleanly within cap-height */}
          <span
            className="inline-flex flex-col items-center justify-between mx-[1px]"
            style={{ height: '0.78em', width: '0.45em' }}
            aria-hidden="true"
          >
            {/* Orange triangle pointing up */}
            <svg
              viewBox="0 0 10 9"
              className="w-full h-[32%] fill-[var(--psm-primary)] shrink-0"
              aria-hidden="true"
            >
              <polygon points="5,0 10,9 0,9" />
            </svg>
            {/* Stem of the I */}
            <span
              className="w-[50%] rounded-[0.5px] bg-current shrink-0"
              style={{ height: '58%' }}
            />
          </span>
          <span className="sr-only">I</span>
          <span>ON</span>
        </div>

        {/* Line 2: PSM OS in bold 3D orange gradient */}
        <div className="mt-1 text-base sm:text-lg font-black tracking-tight leading-none bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-xs">
          PSM OS
        </div>
      </div>
    </Link>
  );
}
