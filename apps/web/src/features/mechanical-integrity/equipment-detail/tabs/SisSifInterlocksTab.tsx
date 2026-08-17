'use client';

import { useState } from 'react';
import { CriticalAlarmRegistryPage } from '../../critical-alarms/CriticalAlarmRegistryPage';
import { InterlockRegistryPage } from '../../interlocks/InterlockRegistryPage';
import { SafeguardTestRegistryPage } from '../../safeguard-tests/SafeguardTestRegistryPage';
import { SifRegistryPage } from '../../sif/SifRegistryPage';

const tabs = ['SIFs', 'Interlocks', 'Critical Alarms', 'Safeguard Tests'] as const;

export function SisSifInterlocksTab({ equipmentId }: { equipmentId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('SIFs');
  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
        {tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-primary-foreground' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{item}</button>)}
      </nav>
      {tab === 'SIFs' ? <SifRegistryPage equipmentId={equipmentId} /> : null}
      {tab === 'Interlocks' ? <InterlockRegistryPage equipmentId={equipmentId} /> : null}
      {tab === 'Critical Alarms' ? <CriticalAlarmRegistryPage equipmentId={equipmentId} /> : null}
      {tab === 'Safeguard Tests' ? <SafeguardTestRegistryPage equipmentId={equipmentId} /> : null}
    </div>
  );
}
