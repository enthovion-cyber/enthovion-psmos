"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  energyTypes,
  defaultIsolationPointValues,
  isolationPointSchema,
  requiredPositions,
  type IsolationPointValues,
} from "../../schemas/isolation.schema";
import type { PermitIsolationPoint } from "../../services/ptw-isolation.service";

export function IsolationPointForm({
  equipmentTag,
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  equipmentTag?: string | null | undefined;
  editing?: PermitIsolationPoint | null | undefined;
  onCancel: () => void;
  onSubmit: (values: IsolationPointValues) => void | Promise<void>;
  saving?: boolean | undefined;
}) {
  const form = useForm<IsolationPointValues>({
    resolver: zodResolver(isolationPointSchema),
    defaultValues: defaultIsolationPointValues(equipmentTag),
  });

  useEffect(() => {
    if (!editing) {
      form.reset(defaultIsolationPointValues(equipmentTag));
      return;
    }
    form.reset({
      energyType: editing.energy_type as IsolationPointValues["energyType"],
      equipmentId: editing.equipment_id ?? "",
      equipmentTag: editing.equipment_tag ?? equipmentTag ?? "",
      isolationPoint: editing.isolation_point_tag ?? editing.isolation_point,
      isolationPointTag: editing.isolation_point_tag ?? editing.isolation_point,
      isolationPointDescription:
        editing.isolation_point_description ?? editing.source_description ?? "",
      sourceDescription:
        editing.source_description ?? editing.isolation_point_description ?? "",
      valveTag: editing.valve_tag ?? "",
      breakerTag: editing.breaker_tag ?? "",
      blindSpadeNumber: editing.blind_spade_number ?? "",
      requiredPosition: (editing.required_position ||
        "Closed") as IsolationPointValues["requiredPosition"],
      normalPosition: editing.normal_position ?? "",
      currentPosition: editing.current_position ?? "",
      lockNumber: editing.lock_number ?? "",
      lockHolder: editing.lock_holder ?? "",
      lockHolderName: editing.lock_holder_name ?? editing.lock_holder ?? "",
      lockHolderUserId: editing.lock_holder_user_id ?? "",
      isolationMethod: editing.isolation_method ?? "Valve isolation",
      isolationStatus: (editing.isolation_status ??
        editing.status ??
        "Planned") as IsolationPointValues["isolationStatus"],
      verificationRequired: editing.verification_required ?? false,
      secondPersonVerificationRequired:
        editing.second_person_verification_required ?? false,
      notes: editing.notes ?? "",
    });
  }, [editing, equipmentTag, form]);

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="psm-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {editing ? "Edit Isolation Point" : "Add Isolation Point"}
          </h3>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Required fields are marked and validation follows the PTW isolation
            rules.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="psm-button psm-button-secondary"
        >
          Close
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Energy Type" error={errors.energyType?.message}>
          <select {...form.register("energyType")} className="psm-input">
            {energyTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Equipment Tag" error={errors.equipmentTag?.message}>
          <input {...form.register("equipmentTag")} className="psm-input" />
        </Field>
        <Field
          label="Isolation Point Tag"
          required
          error={errors.isolationPoint?.message}
        >
          <input {...form.register("isolationPoint")} className="psm-input" />
        </Field>
        <Field
          label="Description"
          error={errors.isolationPointDescription?.message}
        >
          <input
            {...form.register("isolationPointDescription")}
            className="psm-input"
          />
        </Field>
        <Field label="Valve Tag" error={errors.valveTag?.message}>
          <input {...form.register("valveTag")} className="psm-input" />
        </Field>
        <Field label="Breaker Tag" error={errors.breakerTag?.message}>
          <input {...form.register("breakerTag")} className="psm-input" />
        </Field>
        <Field
          label="Blind / Spade Number"
          error={errors.blindSpadeNumber?.message}
        >
          <input {...form.register("blindSpadeNumber")} className="psm-input" />
        </Field>
        <Field
          label="Required Position"
          required
          error={errors.requiredPosition?.message}
        >
          <select {...form.register("requiredPosition")} className="psm-input">
            {requiredPositions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Current Position" error={errors.currentPosition?.message}>
          <input {...form.register("currentPosition")} className="psm-input" />
        </Field>
        <Field label="Lock Number" error={errors.lockNumber?.message}>
          <input {...form.register("lockNumber")} className="psm-input" />
        </Field>
        <Field label="Lock Holder" error={errors.lockHolderName?.message}>
          <input {...form.register("lockHolderName")} className="psm-input" />
        </Field>
        <Field label="Isolation Method" error={errors.isolationMethod?.message}>
          <input {...form.register("isolationMethod")} className="psm-input" />
        </Field>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <input type="checkbox" {...form.register("verificationRequired")} />{" "}
          Verification Required
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            {...form.register("secondPersonVerificationRequired")}
          />{" "}
          Second-Person Verification Required
        </label>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" error={errors.notes?.message}>
            <textarea
              {...form.register("notes")}
              className="psm-input min-h-24"
            />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="psm-button psm-button-secondary"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          className="psm-button psm-button-primary disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : editing
              ? "Save Isolation Point"
              : "Add Isolation Point"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase text-[var(--psm-muted)]">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : null}
    </label>
  );
}
