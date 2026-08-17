'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryApplicabilityProfileForm } from './RegulatoryApplicabilityProfileForm';
export function RegulatoryApplicabilityProfileFormPage() { return <RegulatoryLayout current="New Applicability Profile"><RegulatoryHeader title="New Applicability Profile" subtitle="Create a reusable applicability criteria profile." /><RegulatoryApplicabilityProfileForm /></RegulatoryLayout>; }
