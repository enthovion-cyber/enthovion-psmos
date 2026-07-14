'use client';

import { Edit3, Eye, Mail, RefreshCw, Trash2, UserX } from 'lucide-react';
import type { HazopTeamMember } from '../../types/hazop-team.types';
import { HazopAttendanceBadge } from './HazopAttendanceBadge';
import { HazopRoleBadge } from './HazopRoleBadge';

interface HazopStudyTeamRegisterProps {
  rows: HazopTeamMember[];
  loading?: boolean;
  readonly?: boolean;
  canManage?: boolean;
  canRemove?: boolean;
  canInvite?: boolean;
  onOpen: (row: HazopTeamMember) => void;
  onEdit: (row: HazopTeamMember) => void;
  onRemove: (row: HazopTeamMember) => void;
  onDelete: (row: HazopTeamMember) => void;
  onInvite: (row: HazopTeamMember) => void;
}

export function HazopStudyTeamRegister({
  rows,
  loading,
  readonly,
  canManage,
  canRemove,
  canInvite,
  onOpen,
  onEdit,
  onRemove,
  onDelete,
  onInvite,
}: HazopStudyTeamRegisterProps) {
  
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">
        Loading study team...
      </div>
    );
  }

  const tableHeaders = [
    'Member',
    'Department',
    'Company / Contractor',
    'Discipline',
    'Study Role',
    'Permission',
    'Required',
    'Attendance Scope',
    'Sign-off',
    'Attendance',
    'Last Session',
    'Open Actions',
    'Status',
    'Actions',
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <h3 className="font-semibold">Study Team Register</h3>
        <span className="text-xs text-[var(--psm-muted)]">{rows.length} members</span>
      </div>

      {/* Table Container with Custom Scrollbar design */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--psm-line)] scrollbar-track-transparent hover:scrollbar-thumb-[var(--psm-muted)]">
        <table className="w-full min-w-[1580px] text-sm">
          <thead className="sticky top-0 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)] select-none">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="px-3 py-3 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {rows.map((row) => (
              <tr 
                key={row.id} 
                className="border-t border-[var(--psm-line)] transition-colors duration-150 hover:bg-[var(--psm-surface-2)]"
              >
                {/* Member */}
                <td className="px-3 py-3">
                  <button 
                    onClick={() => onOpen(row)} 
                    className="font-semibold text-primary hover:underline text-left"
                  >
                    {row.display_name ?? row.name}
                  </button>
                  <div className="text-xs text-[var(--psm-muted)]">{row.email ?? 'No email captured'}</div>
                </td>

                <td className="px-3 py-3">
                  {row.departmentName ?? row.department_id ?? '-'}
                  <div className="text-xs text-[var(--psm-muted)]">{row.user_id ? 'Company user' : 'External participant'}</div>
                </td>

                <td className="px-3 py-3">
                  {row.companyOrContractor ?? row.contractorCompanyName ?? row.company_name ?? 'Internal'}
                  <div className="text-xs text-[var(--psm-muted)]">{row.contractorCompanyName ? 'Contractor / vendor' : 'Operating company'}</div>
                </td>

                {/* Discipline */}
                <td className="px-3 py-3">{row.discipline}</td>

                {/* Study Role */}
                <td className="px-3 py-3">
                  <HazopRoleBadge value={row.role ?? row.study_role} />
                </td>

                <td className="px-3 py-3">
                  <span className="rounded-md border border-[var(--psm-line)] px-2 py-1 text-xs text-[var(--psm-muted)]">{row.permission_level ?? 'Comment'}</span>
                </td>

                {/* Required */}
                <td className="px-3 py-3">
                  {row.required_attendance || row.required ? 'Yes' : 'No'}
                </td>

                <td className="px-3 py-3">{row.attendanceRequirement ?? 'All sessions'}</td>

                {/* Sign-off */}
                <td className="px-3 py-3">
                  {row.signoff_required ? (row.signoff_status ?? 'Pending') : 'Not required'}
                </td>

                {/* Attendance */}
                <td className="px-3 py-3">
                  <HazopAttendanceBadge value={row.attendancePercentage ?? 0} />
                </td>

                {/* Last Session */}
                <td className="px-3 py-3">{row.lastAttendedSessionLabel ?? (typeof row.lastAttendedSession === 'string' ? row.lastAttendedSession : row.lastAttendedSession?.title) ?? '-'}</td>

                {/* Open Actions */}
                <td className="px-3 py-3">{row.openActions ?? 0}</td>

                {/* Status */}
                <td className="px-3 py-3">{row.status}</td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <Icon onClick={() => onOpen(row)}>
                      <Eye size={15} />
                    </Icon>
                    {canManage && !readonly && (
                      <Icon onClick={() => onEdit(row)}>
                        <Edit3 size={15} />
                      </Icon>
                    )}
                    {canInvite && !readonly && (
                      <Icon onClick={() => onInvite(row)}>
                        <Mail size={15} />
                      </Icon>
                    )}
                    {canManage && !readonly && (
                      <Icon onClick={() => onRemove(row)} title="Remove / replace">
                        <RefreshCw size={15} />
                      </Icon>
                    )}
                    {canRemove && !readonly && (
                      <Icon danger onClick={() => onRemove(row)} title="Mark removed">
                        <UserX size={15} />
                      </Icon>
                    )}
                    {canRemove && !readonly && (
                      <Icon danger onClick={() => onDelete(row)} title="Delete">
                        <Trash2 size={15} />
                      </Icon>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {!rows.length && (
        <div className="p-8 text-center text-sm text-[var(--psm-muted)] border-t border-[var(--psm-line)]">
          No team members match the current filters.
        </div>
      )}
    </section>
  );
}

interface IconProps {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  title?: string;
}

function Icon({ children, onClick, danger, title }: IconProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg border p-2 transition-colors duration-150 ${
        danger
          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          : 'border-[var(--psm-line)] text-[var(--psm-muted)] hover:text-white hover:bg-[var(--psm-surface-2)]'
      }`}
    >
      {children}
    </button>
  );
}
