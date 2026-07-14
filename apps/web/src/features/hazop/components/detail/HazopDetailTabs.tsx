"use client";

export const hazopDetailTabs = ['Overview', 'Nodes & Deviations', 'Risk Ranking', 'Safeguards / IPL', 'Recommendations / Actions', 'Team & Sessions', 'Linked Records', 'Review & Sign-Off', 'History', 'Attachments'];

export function HazopDetailTabs({ activeTab, onChange }: { activeTab: string; onChange: (tab: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2">
      {hazopDetailTabs.map((tab) => (
        <button key={tab} onClick={() => onChange(tab)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)]'}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}
