'use client';

export function HazopMiniProcessDiagram({ equipment }: { equipment: any[] }) {
  if (!equipment.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)]">No linked equipment available for process diagram.</div>;
  const width = 900;
  const y = 120;
  const spacing = Math.max(110, width / Math.max(equipment.length, 2));
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-black/10 p-3">
      <svg viewBox={`0 0 ${width} 220`} className="min-w-[680px]">
        <defs>
          <linearGradient id="hazopTank" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity=".7" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <path d={`M 40 ${y} H ${width - 70}`} stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="12 8" />
        {equipment.slice(0, 8).map((item, index) => {
          const x = 70 + index * spacing;
          const isPump = String(item.type ?? '').toLowerCase().includes('pump');
          return (
            <g key={item.id ?? item.tag} transform={`translate(${x} 0)`}>
              {isPump ? (
                <>
                  <circle cx="0" cy={y} r="30" fill="#0ea5e9" fillOpacity=".7" stroke="#67e8f9" />
                  <circle cx="0" cy={y} r="8" fill="#0f172a" />
                </>
              ) : (
                <>
                  <rect x="-24" y="58" width="48" height="92" rx="8" fill="url(#hazopTank)" stroke="#86efac" />
                  <path d="M -24 76 H 24" stroke="#bfdbfe" strokeOpacity=".6" />
                </>
              )}
              <text x="0" y="178" textAnchor="middle" fill="#dbeafe" fontSize="14" fontWeight="700">{item.tag ?? item.name}</text>
              <text x="0" y="196" textAnchor="middle" fill="#94a3b8" fontSize="11">{item.nodeCount ?? 0} nodes / {item.scenarioCount ?? 0} scenarios</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
