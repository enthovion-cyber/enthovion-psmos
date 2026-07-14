import { EvidenceClassificationBadge } from '../shared/EvidenceClassificationBadge';
import { EvidenceReviewStatusBadge } from '../shared/EvidenceReviewStatusBadge';
import { EvidenceTypeBadge } from '../shared/EvidenceTypeBadge';
import { RestrictedBadge } from '../shared/RestrictedBadge';
import { TabPanel, formatDate } from '../shared/IncidentTabPrimitives';

export function EvidenceRegister({ rows, onView, onEdit, onPreview, onDownload, onArchive, onDelete, canDelete }: any) {
  return (
    <TabPanel title="Evidence Register">
      {!rows?.length ? <p className="text-xs text-slate-500">No evidence or attachments have been uploaded for this incident.</p> : (
        <div className="overflow-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="text-slate-500">
              <tr><th className="p-2">File</th><th>Type</th><th>Classification</th><th>Review</th><th>Required</th><th>Related Record</th><th>Uploaded</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-cyan-300/10">
                  <td className="p-2"><div className="font-bold">{row.file_name ?? 'Unnamed evidence'}</div><div className="text-slate-500">{row.description}</div></td>
                  <td><EvidenceTypeBadge value={row.evidence_type} /></td>
                  <td><div className="flex flex-wrap gap-1"><EvidenceClassificationBadge value={row.classification} />{row.restricted ? <RestrictedBadge /> : null}</div></td>
                  <td><EvidenceReviewStatusBadge value={row.review_status} /></td>
                  <td>{row.required_evidence ? 'Yes' : 'No'}</td>
                  <td>{row.related_tab ?? '-'} {row.related_record_type ? `· ${row.related_record_type}` : ''}</td>
                  <td>{formatDate(row.created_at ?? row.uploaded_at)}</td>
                  <td className="space-x-2">
                    <button className="text-blue-600" onClick={() => onView(row)}>View</button>
                    <button className="text-blue-600" onClick={() => onEdit(row)}>Edit</button>
                    <button className="text-blue-600" onClick={() => onPreview(row.id)}>Preview</button>
                    <button className="text-blue-600" onClick={() => onDownload(row.id)}>Download</button>
                    <button className="text-amber-600" onClick={() => onArchive(row.id)}>Archive</button>
                    {canDelete ? <button className="text-red-600" onClick={() => onDelete(row.id)}>Delete</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TabPanel>
  );
}
