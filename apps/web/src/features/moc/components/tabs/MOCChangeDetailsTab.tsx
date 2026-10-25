'use client';

import { useState } from 'react';
import { useMOCMutation } from '../../hooks/useMOCMutations';
import { changeCategories, changeTypes, priorities } from '../../schemas/moc.schema';
import { DetailCard, Field, detailInput, detailTextarea, EmptyState, MocButton, Badge } from '../moc-detail-ui';

export function MOCChangeDetailsTab({ moc }: { moc: any }) {
  const mutations = useMOCMutation(moc.id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: moc.title ?? '',
    description: moc.description ?? '',
    changeType: moc.change_type ?? 'Permanent Process Change',
    changeCategory: moc.change_category ?? 'Process',
    priority: moc.priority ?? 'Medium',
    departmentId: moc.department_id ?? '',
    unitId: moc.unit_id ?? '',
    areaId: moc.area_id ?? '',
    locationDescription: moc.location_description ?? '',
    affectedSystem: moc.affected_system ?? '',
    requestedStartDate: moc.requested_start_date ?? '',
    targetImplementationDate: moc.target_implementation_date ?? '',
    changeDescription: moc.change_description ?? {}
  });

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const setDesc = (key: string, value: string) =>
    setForm((current) => ({ ...current, changeDescription: { ...current.changeDescription, [key]: value } }));

  return (
    <div className="space-y-6 w-full">
      {/* Master Metadata Form Card */}
      <DetailCard
        title="MOC Master Data"
        action={
          <MocButton
            variant={editing ? 'primary' : 'secondary'}
            onClick={() =>
              editing
                ? mutations.update.mutate(form, { onSuccess: () => setEditing(false) })
                : setEditing(true)
            }
          >
            {editing ? 'Save Changes' : 'Edit Details'}
          </MocButton>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="MOC Number">
            <input className={detailInput} value={moc.moc_number} disabled />
          </Field>
          <Field label="Current Status">
            <input className={detailInput} value={moc.status} disabled />
          </Field>
          <Field label="Change Priority">
            <select
              className={detailInput}
              disabled={!editing}
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
            >
              {priorities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Change Type">
            <select
              className={detailInput}
              disabled={!editing}
              value={form.changeType}
              onChange={(e) => set('changeType', e.target.value)}
            >
              {changeTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Change Category">
            <select
              className={detailInput}
              disabled={!editing}
              value={form.changeCategory}
              onChange={(e) => set('changeCategory', e.target.value)}
            >
              {changeCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Affected System / Service">
            <input
              className={detailInput}
              disabled={!editing}
              value={form.affectedSystem ?? ''}
              onChange={(e) => set('affectedSystem', e.target.value)}
            />
          </Field>
          <Field label="Requested Start Date">
            <input
              className={detailInput}
              disabled={!editing}
              type="date"
              value={form.requestedStartDate ?? ''}
              onChange={(e) => set('requestedStartDate', e.target.value)}
            />
          </Field>
          <Field label="Target Implementation Date">
            <input
              className={detailInput}
              disabled={!editing}
              type="date"
              value={form.targetImplementationDate ?? ''}
              onChange={(e) => set('targetImplementationDate', e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Title / Purpose">
              <input
                className={detailInput}
                disabled={!editing}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="High-Level Scope Description">
              <textarea
                className={detailTextarea}
                disabled={!editing}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Physical Location Description">
              <textarea
                className={detailTextarea}
                disabled={!editing}
                value={form.locationDescription ?? ''}
                onChange={(e) => set('locationDescription', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </DetailCard>

      {/* Affected Equipment */}
      <DetailCard title="Affected Equipment Assets">
        {moc.equipment?.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moc.equipment.map((item: any) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[var(--psm-fg)]">
                      {item.equipment?.tag}
                    </span>
                    <Badge tone={item.role === 'PRIMARY' ? 'blue' : 'slate'}>{item.role}</Badge>
                  </div>
                  <p className="mt-1 text-[var(--psm-muted)] font-medium">
                    {item.equipment?.name} · {item.equipment?.type}
                  </p>
                </div>
                <p className="mt-2 text-[10px] text-[var(--psm-muted)]">
                  Criticality: <strong>{item.equipment?.criticality ?? '-'}</strong> · System: <strong>{item.equipment?.system ?? '-'}</strong>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No affected equipment linked"
            detail="Specify affected assets in the Engineering Package or initial creation wizard."
          />
        )}
      </DetailCard>

      {/* Structured Technical Scope Questions */}
      <DetailCard title="Detailed Technical Change Scope">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ['currentCondition', 'Current Baseline Condition'],
            ['proposedChange', 'Proposed Modification'],
            ['reasonForChange', 'Reason for Change'],
            ['problemStatement', 'Problem Statement'],
            ['businessJustification', 'Business Justification'],
            ['safetyJustification', 'Process Safety Justification'],
            ['expectedBenefit', 'Expected Benefit & Deliverables'],
            ['preChangeState', 'Pre-Change Technical State'],
            ['postChangeState', 'Post-Change Verification State'],
            ['scopeBoundaries', 'Scope Boundaries'],
            ['notIncluded', 'Out of Scope / Exclusions'],
            ['implementationPlanSummary', 'Implementation Plan Summary']
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <textarea
                className={detailTextarea}
                disabled={!editing}
                value={(form.changeDescription as any)?.[key] ?? ''}
                onChange={(e) => setDesc(key, e.target.value)}
                placeholder={`Enter details for ${label.toLowerCase()}...`}
              />
            </Field>
          ))}
        </div>
      </DetailCard>
    </div>
  );
}
