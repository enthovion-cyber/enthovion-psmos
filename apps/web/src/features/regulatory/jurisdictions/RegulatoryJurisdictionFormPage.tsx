'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryJurisdictionForm } from './RegulatoryJurisdictionForm';
export function RegulatoryJurisdictionFormPage() { return <RegulatoryLayout current="New Jurisdiction"><RegulatoryHeader title="New Jurisdiction" subtitle="Create a jurisdiction foundation record." /><RegulatoryJurisdictionForm /></RegulatoryLayout>; }
