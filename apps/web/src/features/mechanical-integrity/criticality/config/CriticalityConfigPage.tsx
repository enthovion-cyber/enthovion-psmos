'use client';

import { useState } from 'react';
import { useCriticalityConfig } from '../../hooks/useCriticalityConfig';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';

export function CriticalityConfigPage() {
  const query = useCriticalityConfig();
  const active = query.data?.active;
  const [name, setName] = useState('');
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Criticality configuration could not be loaded.</div>;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h1 className="text-xl font-semibold">Criticality Configuration</h1>
        <p className="text-sm text-muted-foreground">Matrix, consequence/likelihood dimensions, category thresholds, review frequency, approval rules, and scheduler mappings are backend-owned.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Active Configuration</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <div>Name: <span className="font-medium">{active?.config_name}</span></div>
            <div>Scope: <span className="font-medium">{active?.scope}</span></div>
            <div>Matrix: <span className="font-medium">{active?.matrix_size} x {active?.matrix_size}</span></div>
            <div>Score method: <span className="font-medium">{active?.score_method}</span></div>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Create Site / Company Configuration</h2>
          <input className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Configuration name" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={!name || query.save.isPending} onClick={() => query.save.mutate({ configName: name })}>{query.save.isPending ? 'Saving...' : 'Create Config'}</button>
        </section>
      </div>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Dimensions and Thresholds</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(active?.consequence_dimensions_json ?? [], null, 2)}</pre>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(active?.likelihood_dimensions_json ?? [], null, 2)}</pre>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(active?.category_thresholds_json ?? [], null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
