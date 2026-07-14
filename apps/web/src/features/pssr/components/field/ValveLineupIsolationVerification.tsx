'use client';

import { PSSRCard } from '../pssr-ui';

export function ValveLineupIsolationVerification() {
  const items = ['Startup valve lineup completed', 'Manual valves in correct position', 'Blinds/spades removed or installed as required', 'Temporary jumpers removed', 'LOTO removed where required', 'Energy sources restored safely', 'Utilities available', 'Drains/vents correct', 'Bypass valves normal position', 'Control valves in correct mode'];
  return <PSSRCard title="Valve / Lineup / Isolation Verification"><div className="grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item} className="rounded-lg border border-amber-300/10 bg-amber-500/5 px-3 py-2 text-sm font-bold text-amber-50">{item}</div>)}</div></PSSRCard>;
}
