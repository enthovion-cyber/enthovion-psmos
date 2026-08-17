'use client';

import { TrainingCard } from '../../../shared/TrainingUi';
import { Field, SectionProps, Select } from './SessionIdentitySection';

export function SessionScheduleLocationSection({ form, update, context }: SectionProps) {
  return (
    <TrainingCard title="3. Schedule / Location" subtitle="Start/end time, timezone, location, capacity, cutoff, attendance method, and cancellation reason.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Start date/time" type="datetime-local" value={toLocal(form.startTime ?? form.start_time)} onChange={(v) => update({ startTime: v })} />
        <Field label="End date/time" type="datetime-local" value={toLocal(form.endTime ?? form.end_time)} onChange={(v) => update({ endTime: v })} />
        <Field label="Timezone" value={form.timezone ?? 'Asia/Karachi'} onChange={(v) => update({ timezone: v })} />
        <Field label="Training location" value={form.location} onChange={(v) => update({ location: v })} />
        <Field label="Online meeting link optional" value={form.onlineMeetingLink ?? form.online_meeting_link} onChange={(v) => update({ onlineMeetingLink: v })} />
        <Field label="Room / area" value={form.roomArea ?? form.room_area} onChange={(v) => update({ roomArea: v })} />
        <Field label="Capacity optional" type="number" value={form.capacity} onChange={(v) => update({ capacity: Number(v) || undefined })} />
        <Field label="Attendance cutoff time optional" type="datetime-local" value={toLocal(form.attendanceCutoffTime ?? form.attendance_cutoff_time)} onChange={(v) => update({ attendanceCutoffTime: v })} />
        <Select label="Attendance method" value={form.attendanceMethod ?? form.attendance_method ?? 'Manual attendance'} options={context?.lookups?.['attendance-methods']} onChange={(v) => update({ attendanceMethod: v })} />
        <Field label="Cancellation reason if cancelled" value={form.cancellationReason ?? form.cancellation_reason} onChange={(v) => update({ cancellationReason: v })} />
      </div>
    </TrainingCard>
  );
}

function toLocal(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 16);
}
