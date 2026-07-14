'use client';
export function IncidentSubmitSuccessDialog({ result, onOpen, onAnother }: { result?: any; onOpen: () => void; onAnother: () => void }) {
  if (!result) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="w-full max-w-lg rounded-xl border border-emerald-400/30 bg-white p-6 shadow-2xl dark:bg-[#071525]"><h2 className="text-xl font-bold text-slate-950 dark:text-white">Incident submitted</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Incident number <b>{result.incidentNumber}</b> was created and is now visible in the register.</p><div className="mt-5 flex flex-wrap justify-end gap-2"><button className="lopa-button-secondary" onClick={onAnother}>Create Another</button><button className="lopa-button-primary" onClick={onOpen}>Open Incident</button></div></div></div>;
}
