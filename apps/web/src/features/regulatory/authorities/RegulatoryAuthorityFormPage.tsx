'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryAuthorityForm } from './RegulatoryAuthorityForm';
export function RegulatoryAuthorityFormPage() { return <RegulatoryLayout current="New Authority"><RegulatoryHeader title="New Authority" subtitle="Create an authority/regulator foundation record." /><RegulatoryAuthorityForm /></RegulatoryLayout>; }
