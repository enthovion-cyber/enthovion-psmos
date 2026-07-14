import Link from 'next/link';

type FooterColumn = {
  title: string;
  links: Array<[label: string, href: string]>;
};

const columns: FooterColumn[] = [
  { title: 'Product', links: [['Overview', '/'], ['Features', '/features'], ['Modules', '/#modules'], ['Pricing', '/pricing'], ['Security', '/security']] },
  { title: 'Modules', links: [['MOC', '/features#moc'], ['PSSR', '/features#pssr'], ['HAZOP/PHA', '/features#hazop'], ['LOPA/SIL', '/features#lopa'], ['Incident Investigation', '/features#incidents'], ['Mechanical Integrity', '/features#mi'], ['PTW', '/features#ptw'], ['Document Control', '/features#documents']] },
  { title: 'Company', links: [['About', '/#about'], ['Contact', '/contact'], ['Help Center', '/faq'], ['Documentation', '/#resources'], ['Roadmap', '/#roadmap']] },
  { title: 'Legal', links: [['Privacy Policy', '/#privacy'], ['Terms of Service', '/#terms'], ['Security', '/security'], ['Data Processing', '/#data-processing'], ['Cookie Policy', '/#cookies']] }
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_2fr] lg:px-8">
        <div>
          <div className="text-lg font-black">Enthovion PSM OS</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--psm-muted)]">AI-assisted Process Safety Management Operating System built for safer industrial operations.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-black">{column.title}</h3>
              <div className="mt-3 grid gap-2">
                {column.links.map(([label, href]) => <Link key={label} href={href} className="text-sm text-[var(--psm-muted)] hover:text-[var(--psm-text)]">{label}</Link>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--psm-line)] px-4 py-4 text-center text-xs text-[var(--psm-muted)]">
        © Enthovion PSM OS. Built for safer industrial operations.
      </div>
    </footer>
  );
}
