export const attendanceStatuses = ['Present', 'Absent', 'Partial', 'Late', 'Left Early', 'Excused', 'No Show', 'Not Required'] as const;

export function validateTrainingAttendance(value: Record<string, any>) {
  const missing = [];
  if (!value.workerId && !value.worker_id) missing.push('workerId');
  if (!value.attendanceStatus && !value.attendance_status) missing.push('attendanceStatus');
  if (!attendanceStatuses.includes((value.attendanceStatus ?? value.attendance_status) as any)) missing.push('validAttendanceStatus');
  return missing;
}
