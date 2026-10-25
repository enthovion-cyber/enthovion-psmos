'use client';

import { useMemo } from 'react';
import { Check, Shield, CheckCheck, X } from 'lucide-react';
import type { IamPermission } from '@/services/iam.service';

type Verb = 'view' | 'create' | 'edit' | 'approve' | 'delete';

type ModuleSpec = {
  key: string;
  name: string;
  description: string;
};

const PSM_MODULES: ModuleSpec[] = [
  { key: 'ptw', name: 'Permit to Work (PTW)', description: 'Hot work, confined space, and isolation authorization' },
  { key: 'moc', name: 'Management of Change (MOC)', description: 'Technical, equipment, and procedural change governance' },
  { key: 'pssr', name: 'Pre-Startup Safety Review (PSSR)', description: 'Hard gate verification before energizing equipment' },
  { key: 'hazop', name: 'HAZOP / PHA', description: 'Process Hazard Analysis, deviations, and safeguards' },
  { key: 'lopa', name: 'LOPA / SIL', description: 'Independent Protection Layers and target SIL ratings' },
  { key: 'incidents', name: 'Incident Investigation', description: 'Near-miss reporting, RCA, and corrective CAPAs' },
  { key: 'mechanical_integrity', name: 'Mechanical Integrity (MI)', description: 'ITPM inspections, proof tests, and SCE testing' },
  { key: 'psi', name: 'Process Safety Information (PSI)', description: 'P&IDs, relief designs, and safe operating limits' },
  { key: 'training', name: 'Training & Competency', description: 'Certification matrix and operator qualification gates' },
  { key: 'audit', name: 'Audit & Assurance', description: 'PSM compliance protocols, findings, and non-conformances' },
  { key: 'regulatory', name: 'Regulatory Register', description: 'Statutory compliance obligations mapped to sites' },
  { key: 'operating_procedures', name: 'Operating Procedures', description: 'SOPs, safe work practices, certification and execution (1910.119(f))' },
  { key: 'equipment', name: 'Equipment Registry', description: 'Asset master data, SCE classification, and 360 specs' },
  { key: 'documents', name: 'Document Control', description: 'Controlled SOPs, P&IDs, redlining, and lifecycle revisions' },
  { key: 'actions', name: 'Action Center (CAPA)', description: 'Universal corrective action tracking and verification' },
  { key: 'users', name: 'User Management', description: 'Plant personnel directory and site assignments' },
  { key: 'roles', name: 'Role & Permission Admin', description: 'RBAC policies and data scoping administration' }
];

export function RolePermissionMatrix({
  allPermissions = [],
  selectedIds = new Set(),
  onToggle
}: {
  allPermissions: IamPermission[];
  selectedIds: Set<string>;
  onToggle?: (permissionId: string) => void;
}) {
  // Map permission keys to permission objects
  const permissionByKey = useMemo(() => {
    const map = new Map<string, IamPermission>();
    for (const p of allPermissions) {
      map.set(p.key.toLowerCase(), p);
    }
    return map;
  }, [allPermissions]);

  function findPermission(moduleKey: string, verb: Verb): IamPermission | undefined {
    // Try standard patterns: ptw.view, ptw.create, ptw.edit, ptw.approve, ptw.delete
    const candidates = [
      `${moduleKey}.${verb}`,
      `${moduleKey}:${verb}`,
      `${moduleKey}.${verb === 'edit' ? 'update' : verb}`,
      `${moduleKey}.${verb === 'delete' ? 'archive' : verb}`,
      `${moduleKey}.${verb === 'view' ? 'read' : verb}`,
      `${moduleKey}.${verb === 'approve' ? 'sign' : verb}`
    ];
    for (const c of candidates) {
      const match = permissionByKey.get(c.toLowerCase());
      if (match) return match;
    }
    // Fallback: search key matching
    return allPermissions.find(
      (p) =>
        (p.moduleKey === moduleKey || p.key.startsWith(`${moduleKey}.`)) &&
        p.key.toLowerCase().includes(verb)
    );
  }

  function toggleAllForModule(moduleKey: string, enable: boolean) {
    if (!onToggle) return;
    const verbs: Verb[] = ['view', 'create', 'edit', 'approve', 'delete'];
    for (const v of verbs) {
      const perm = findPermission(moduleKey, v);
      if (perm) {
        const isSelected = selectedIds.has(perm.id);
        if (enable && !isSelected) onToggle(perm.id);
        if (!enable && isSelected) onToggle(perm.id);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[var(--psm-muted)] border-b border-[var(--psm-line)] pb-2">
        <span className="font-semibold uppercase tracking-wider">Granular 5-Verb Permission Matrix</span>
        <span>Standardized OSHA / CCPS Role Scoping</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
        <table className="psm-table w-full text-left text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wider text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3 min-w-[200px]">PSM Element</th>
              <th className="px-3 py-3 text-center w-24">View</th>
              <th className="px-3 py-3 text-center w-24">Create</th>
              <th className="px-3 py-3 text-center w-24">Edit</th>
              <th className="px-3 py-3 text-center w-24">Approve</th>
              <th className="px-3 py-3 text-center w-24">Delete</th>
              <th className="px-3 py-3 text-right w-28">Batch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {PSM_MODULES.map((mod) => {
              const viewP = findPermission(mod.key, 'view');
              const createP = findPermission(mod.key, 'create');
              const editP = findPermission(mod.key, 'edit');
              const approveP = findPermission(mod.key, 'approve');
              const deleteP = findPermission(mod.key, 'delete');

              const verbs = [
                { verb: 'view' as Verb, perm: viewP },
                { verb: 'create' as Verb, perm: createP },
                { verb: 'edit' as Verb, perm: editP },
                { verb: 'approve' as Verb, perm: approveP },
                { verb: 'delete' as Verb, perm: deleteP }
              ];

              const totalAvailable = verbs.filter((v) => Boolean(v.perm)).length;
              const totalActive = verbs.filter((v) => v.perm && selectedIds.has(v.perm.id)).length;
              const allActive = totalAvailable > 0 && totalActive === totalAvailable;

              return (
                <tr key={mod.key} className="hover:bg-[var(--psm-surface-2)] transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white/90">{mod.name}</div>
                    <div className="text-[11px] text-[var(--psm-muted)] truncate max-w-xs">{mod.description}</div>
                  </td>

                  {verbs.map(({ verb, perm }) => {
                    if (!perm) {
                      return (
                        <td key={verb} className="px-3 py-3 text-center">
                          <span className="text-[11px] text-white/20 select-none">-</span>
                        </td>
                      );
                    }

                    const checked = selectedIds.has(perm.id);

                    return (
                      <td key={verb} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggle?.(perm.id)}
                          className={`mx-auto grid h-7 w-7 place-items-center rounded-lg border transition ${
                            checked
                              ? verb === 'approve'
                                ? 'bg-amber-500 border-amber-600 text-black shadow-sm font-bold'
                                : verb === 'delete'
                                ? 'bg-red-500 border-red-600 text-white shadow-sm'
                                : 'bg-primary border-primary text-white shadow-sm'
                              : 'border-[var(--psm-line)] bg-[var(--psm-surface-3)] text-transparent hover:border-white/40'
                          }`}
                          title={`${verb.toUpperCase()} ${mod.name}`}
                        >
                          <Check size={14} className={checked ? 'opacity-100' : 'opacity-0'} />
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => toggleAllForModule(mod.key, true)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-info hover:bg-info/10"
                        title="Grant all 5 verbs for module"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAllForModule(mod.key, false)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--psm-muted)] hover:bg-white/10"
                        title="Clear module permissions"
                      >
                        None
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
