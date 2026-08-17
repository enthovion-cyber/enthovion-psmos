const cards = [
  ['Total relief devices', 'totalReliefDevices'],
  ['Active', 'activeReliefDevices'],
  ['Safety-critical', 'safetyCritical'],
  ['Protected equipment', 'protectedEquipmentCount'],
  ['Missing protection', 'equipmentMissingReliefProtection'],
  ['Due next 30 days', 'testsDueNext30Days'],
  ['Due next 90 days', 'testsDueNext90Days'],
  ['Overdue', 'overdueTests'],
  ['Critical overdue', 'criticalEquipmentPsvOverdue'],
  ['Failed tests', 'failedTests'],
  ['Pop failed', 'popTestFailed'],
  ['Leak failed', 'leakTestFailed'],
  ['Cert missing/expiring', 'certificatesMissingOrExpiring'],
  ['Out of service', 'removedOutOfService'],
  ['Impairments/bypasses', 'activeImpairmentsBypasses'],
  ['MOC required', 'mocRequired'],
  ['Startup blocked', 'startupBlocked']
] as const;

export function ReliefDeviceSummaryCards({ summary }: { summary?: any }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      {cards.map(([label, key]) => (
        <div key={key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <p className="text-xs text-[var(--psm-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold">{Number(summary?.[key] ?? 0)}</p>
        </div>
      ))}
    </section>
  );
}
