'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryApplicabilityAssessmentWizard } from './RegulatoryApplicabilityAssessmentWizard';
export function RegulatoryApplicabilityAssessmentFormPage() { return <RegulatoryLayout current="New Applicability Assessment"><RegulatoryHeader title="New Applicability Assessment" subtitle="Eight-step backend-controlled applicability assessment foundation." /><RegulatoryApplicabilityAssessmentWizard /></RegulatoryLayout>; }
