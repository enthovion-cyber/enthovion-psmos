"use client";
import { AuditApprovalListPage } from "./AuditApprovalListPage";

export function SourceAuditReviewPage({ label }: { label: string }) {
  return <AuditApprovalListPage title={`${label} Review Packages`} subtitle={`Review packages submitted from ${label}. Backend filters by source record route and current scope when an ID is provided.`} />;
}
