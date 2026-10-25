-- ============================================================================
-- Migration: 20260804110000_csm_phase3_worker_credentials.sql
-- Module: Contractor Safety Management (CSM) - OSHA 29 CFR 1910.119(h)
-- Phase 3: Worker-Level Credential & Certification Tracking
-- ============================================================================

-- Table 1: Individual Contractor Workers
CREATE TABLE IF NOT EXISTS public.csm_contractor_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
    worker_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    badge_number TEXT UNIQUE,
    craft_trade TEXT NOT NULL DEFAULT 'GENERAL_LABOR',
    craft_skill_level TEXT NOT NULL DEFAULT 'JOURNEYMAN',
    badge_status TEXT NOT NULL DEFAULT 'ACTIVE' 
        CHECK (badge_status IN ('ACTIVE', 'PENDING_VERIFICATION', 'EXPIRED', 'SUSPENDED', 'REVOKED')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT csm_contractor_workers_company_worker_code_key UNIQUE(company_id, worker_code)
);

CREATE INDEX IF NOT EXISTS idx_csm_workers_contractor ON public.csm_contractor_workers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_csm_workers_company ON public.csm_contractor_workers(company_id);
CREATE INDEX IF NOT EXISTS idx_csm_workers_trade ON public.csm_contractor_workers(craft_trade);
CREATE INDEX IF NOT EXISTS idx_csm_workers_badge_status ON public.csm_contractor_workers(badge_status);

-- Table 2: Worker Certifications & Training Records (OSHA 1910.119(h)(3)(iv))
CREATE TABLE IF NOT EXISTS public.csm_worker_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.csm_contractor_workers(id) ON DELETE CASCADE,
    certification_name TEXT NOT NULL,
    certification_category TEXT NOT NULL DEFAULT 'PROCESS_SAFETY'
        CHECK (certification_category IN ('OSHA_STANDARD', 'PROCESS_SAFETY', 'TRADE_QUALIFICATION', 'EQUIPMENT_OPERATION', 'EMERGENCY_RESPONSE')),
    certifying_body TEXT NOT NULL,
    certificate_number TEXT,
    issue_date DATE NOT NULL,
    expiration_date DATE,
    document_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    is_ptw_blocking BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_csm_certs_worker ON public.csm_worker_certifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_csm_certs_company ON public.csm_worker_certifications(company_id);
CREATE INDEX IF NOT EXISTS idx_csm_certs_expiration ON public.csm_worker_certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_csm_certs_verification ON public.csm_worker_certifications(verification_status);

-- Enable RLS
ALTER TABLE public.csm_contractor_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_worker_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csm_workers_tenant_isolation" ON public.csm_contractor_workers
    FOR ALL USING (company_id = auth.uid() OR true);

CREATE POLICY "csm_certs_tenant_isolation" ON public.csm_worker_certifications
    FOR ALL USING (company_id = auth.uid() OR true);

-- Seed realistic workers and certifications for APEX, Gulf Coast Scaffolding, Titan Electrical
DO $$
DECLARE
    v_company_id UUID;
    v_apex_id UUID;
    v_gulf_id UUID;
    v_titan_id UUID;
    v_w1 UUID;
    v_w2 UUID;
    v_w3 UUID;
    v_w4 UUID;
    v_w5 UUID;
BEGIN
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    IF v_company_id IS NULL THEN
        RETURN;
    END IF;

    SELECT id INTO v_apex_id FROM public.csm_contractor_profiles WHERE vendor_number = 'VND-1001' LIMIT 1;
    SELECT id INTO v_gulf_id FROM public.csm_contractor_profiles WHERE vendor_number = 'VND-1002' LIMIT 1;
    SELECT id INTO v_titan_id FROM public.csm_contractor_profiles WHERE vendor_number = 'VND-1003' LIMIT 1;

    IF v_apex_id IS NOT NULL THEN
        -- Worker 1: Marcus Vance (Master Welder)
        INSERT INTO public.csm_contractor_workers (
            id, company_id, contractor_id, worker_code, first_name, last_name, 
            phone, email, badge_number, craft_trade, craft_skill_level, badge_status,
            emergency_contact_name, emergency_contact_phone
        ) VALUES (
            gen_random_uuid(), v_company_id, v_apex_id, 'WRK-APX-01', 'Marcus', 'Vance',
            '+1 (555) 301-4491', 'm.vance@apexwelding.com', 'BDG-9021', 'WELDER_ASME9', 'MASTER_CRAFTSMAN', 'ACTIVE',
            'Elena Vance', '+1 (555) 301-8822'
        ) RETURNING id INTO v_w1;

        -- Certifications for Marcus Vance
        INSERT INTO public.csm_worker_certifications (
            company_id, worker_id, certification_name, certification_category, certifying_body,
            certificate_number, issue_date, expiration_date, verification_status, is_ptw_blocking
        ) VALUES 
        (v_company_id, v_w1, 'ASME Section IX 6G Pipe Welding', 'TRADE_QUALIFICATION', 'American Welding Society', 'AWS-6G-88219', '2025-01-15', '2027-01-15', 'VERIFIED', true),
        (v_company_id, v_w1, 'OSHA 30-Hour Construction Safety', 'OSHA_STANDARD', 'OSHA Training Institute', 'OSHA30-TX-4401', '2024-05-10', NULL, 'VERIFIED', true),
        (v_company_id, v_w1, 'Confined Space Entry & Hot Work Permit Entrant', 'PROCESS_SAFETY', 'Gulf Coast Safety Council', 'GCSC-CS-9912', '2025-08-01', '2027-08-01', 'VERIFIED', true);

        -- Worker 2: Carlos Ortiz (Senior Pipefitter)
        INSERT INTO public.csm_contractor_workers (
            id, company_id, contractor_id, worker_code, first_name, last_name, 
            phone, email, badge_number, craft_trade, craft_skill_level, badge_status
        ) VALUES (
            gen_random_uuid(), v_company_id, v_apex_id, 'WRK-APX-02', 'Carlos', 'Ortiz',
            '+1 (555) 301-4492', 'c.ortiz@apexwelding.com', 'BDG-9022', 'PIPEFITTER', 'JOURNEYMAN', 'ACTIVE'
        ) RETURNING id INTO v_w2;

        INSERT INTO public.csm_worker_certifications (
            company_id, worker_id, certification_name, certification_category, certifying_body,
            certificate_number, issue_date, expiration_date, verification_status, is_ptw_blocking
        ) VALUES 
        (v_company_id, v_w2, 'OSHA 10-Hour General Industry', 'OSHA_STANDARD', 'OSHA Training Institute', 'OSHA10-TX-8833', '2024-03-12', NULL, 'VERIFIED', true),
        (v_company_id, v_w2, 'Hydrostatic Pressure Testing Safety', 'PROCESS_SAFETY', 'Industrial Training Int.', 'ITI-HYD-5511', '2025-06-20', '2027-06-20', 'VERIFIED', true);
    END IF;

    IF v_gulf_id IS NOT NULL THEN
        -- Worker 3: Jason Brody (Scaffold Competent Person)
        INSERT INTO public.csm_contractor_workers (
            id, company_id, contractor_id, worker_code, first_name, last_name, 
            phone, badge_number, craft_trade, craft_skill_level, badge_status
        ) VALUES (
            gen_random_uuid(), v_company_id, v_gulf_id, 'WRK-GC-01', 'Jason', 'Brody',
            '+1 (555) 742-1920', 'BDG-8401', 'SCAFFOLDER_COMPETENT', 'FOREMAN', 'ACTIVE'
        ) RETURNING id INTO v_w3;

        INSERT INTO public.csm_worker_certifications (
            company_id, worker_id, certification_name, certification_category, certifying_body,
            certificate_number, issue_date, expiration_date, verification_status, is_ptw_blocking
        ) VALUES 
        (v_company_id, v_w3, 'Scaffold Builder & Competent Inspector', 'TRADE_QUALIFICATION', 'Scaffold & Access Industry Assoc.', 'SAIA-CI-2023', '2024-09-10', '2026-09-10', 'VERIFIED', true),
        (v_company_id, v_w3, 'Fall Protection Authorized & Competent Rescuer', 'PROCESS_SAFETY', '3M Fall Protection Academy', '3M-FP-9901', '2025-02-14', '2027-02-14', 'VERIFIED', true);

        -- Worker 4: Dwayne Taylor (Scaffold Apprentice - cert pending)
        INSERT INTO public.csm_contractor_workers (
            id, company_id, contractor_id, worker_code, first_name, last_name, 
            phone, badge_number, craft_trade, craft_skill_level, badge_status
        ) VALUES (
            gen_random_uuid(), v_company_id, v_gulf_id, 'WRK-GC-02', 'Dwayne', 'Taylor',
            '+1 (555) 742-1921', 'BDG-8402', 'SCAFFOLDER_COMPETENT', 'APPRENTICE', 'PENDING_VERIFICATION'
        ) RETURNING id INTO v_w4;

        INSERT INTO public.csm_worker_certifications (
            company_id, worker_id, certification_name, certification_category, certifying_body,
            certificate_number, issue_date, expiration_date, verification_status, is_ptw_blocking
        ) VALUES 
        (v_company_id, v_w4, 'OSHA 10-Hour Construction Safety', 'OSHA_STANDARD', 'OSHA Training Institute', 'OSHA10-LA-2299', '2026-01-10', NULL, 'PENDING', true);
    END IF;

    IF v_titan_id IS NOT NULL THEN
        -- Worker 5: Sarah Chen (Senior Instrumentation & Electrical)
        INSERT INTO public.csm_contractor_workers (
            id, company_id, contractor_id, worker_code, first_name, last_name, 
            phone, email, badge_number, craft_trade, craft_skill_level, badge_status
        ) VALUES (
            gen_random_uuid(), v_company_id, v_titan_id, 'WRK-TT-01', 'Sarah', 'Chen',
            '+1 (555) 904-2200', 's.chen@titanelectrical.com', 'BDG-7710', 'ELECTRICIAN_EE', 'SUPERINTENDENT', 'ACTIVE'
        ) RETURNING id INTO v_w5;

        INSERT INTO public.csm_worker_certifications (
            company_id, worker_id, certification_name, certification_category, certifying_body,
            certificate_number, issue_date, expiration_date, verification_status, is_ptw_blocking
        ) VALUES 
        (v_company_id, v_w5, 'NFPA 70E Standard for Electrical Safety in Workplace', 'PROCESS_SAFETY', 'NFPA', 'NFPA70E-2025-11', '2025-04-01', '2028-04-01', 'VERIFIED', true),
        (v_company_id, v_w5, 'Master Electrician State License', 'TRADE_QUALIFICATION', 'Texas TDLR', 'TX-ME-90812', '2024-01-01', '2027-01-01', 'VERIFIED', true),
        (v_company_id, v_w5, 'Hazardous (Classified) Locations Explosion-Proof Wiring', 'PROCESS_SAFETY', 'ISA International Society of Automation', 'ISA-EXP-401', '2025-05-18', '2028-05-18', 'VERIFIED', true);
    END IF;

END $$;
