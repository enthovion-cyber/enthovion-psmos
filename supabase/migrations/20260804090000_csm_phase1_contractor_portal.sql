-- Migration: 20260804090000_csm_phase1_contractor_portal.sql
-- Module: Contractor Safety Management (OSHA 29 CFR 1910.119(h)) - Phase 1: Directory & Self-Service Portal

-- 1. Contractor Profiles (Core Enterprise Directory)
CREATE TABLE IF NOT EXISTS public.csm_contractor_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  company_id TEXT,
  contractor_company_id TEXT REFERENCES "ContractorCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  company_name TEXT NOT NULL,
  company_code TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'TIER_1', -- 'TIER_1' (High Risk Process Turnaround), 'TIER_2' (Medium Risk Maintenance), 'TIER_3' (Low Risk / Service)
  specialties TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'PENDING_PREQUAL', 'ACTIVE', 'CONDITIONAL', 'SUSPENDED', 'DISQUALIFIED', 'INACTIVE'
  safety_grade TEXT NOT NULL DEFAULT 'A', -- 'A', 'B', 'C', 'D', 'F', 'UNRATED'
  prequal_score NUMERIC(5,2) DEFAULT 92.50,
  prequal_valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  primary_contact_name TEXT,
  primary_contact_title TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  office_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  tax_id_ein TEXT,
  portal_access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  portal_token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  portal_status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'EXPIRED'
  portal_last_login_at TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csm_contractors_tenant ON public.csm_contractor_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_csm_contractors_status ON public.csm_contractor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_csm_contractors_portal_token ON public.csm_contractor_profiles(portal_access_token);

-- 2. Contractor Site Authorizations
CREATE TABLE IF NOT EXISTS public.csm_contractor_sites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  contractor_id TEXT NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED', -- 'APPROVED', 'RESTRICTED', 'REVOKED'
  granted_by TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contractor_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_csm_contractor_sites_lookup ON public.csm_contractor_sites(contractor_id, site_id);

-- 3. Contractor Safety Documents & Certificates of Insurance (COI)
CREATE TABLE IF NOT EXISTS public.csm_contractor_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  contractor_id TEXT NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'COI_GENERAL_LIABILITY', 'COI_WORKERS_COMP', 'COI_AUTO', 'COI_UMBRELLA', 'OSHA_300', 'OSHA_300A', 'SAFETY_PROGRAM_MANUAL', 'EMR_RATING_LETTER', 'HAZCOM_WRITTEN_PLAN', 'OTHER'
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT 'application/pdf',
  policy_number TEXT,
  insurance_carrier TEXT,
  coverage_amount_usd NUMERIC(14,2) DEFAULT 0,
  effective_date DATE,
  expiration_date DATE,
  verification_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'
  verified_by_user_id TEXT,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_via_portal BOOLEAN NOT NULL DEFAULT FALSE,
  uploader_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csm_contractor_docs_lookup ON public.csm_contractor_documents(contractor_id, document_type);
CREATE INDEX IF NOT EXISTS idx_csm_contractor_docs_expiry ON public.csm_contractor_documents(expiration_date);

-- 4. Contractor Self-Service Portal Audit Log
CREATE TABLE IF NOT EXISTS public.csm_portal_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  contractor_id TEXT NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'PORTAL_LOGIN', 'DOCUMENT_UPLOAD', 'DOCUMENT_REMOVED', 'PROFILE_UPDATE', 'TOKEN_REGENERATED'
  event_payload JSONB DEFAULT '{}'::JSONB,
  actor_ip TEXT,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csm_portal_audit_contractor ON public.csm_portal_audit_logs(contractor_id);

-- 5. RLS Policies
ALTER TABLE public.csm_contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_contractor_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_contractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_portal_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS csm_profiles_all ON public.csm_contractor_profiles;
CREATE POLICY csm_profiles_all ON public.csm_contractor_profiles
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS csm_sites_all ON public.csm_contractor_sites;
CREATE POLICY csm_sites_all ON public.csm_contractor_sites
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS csm_docs_all ON public.csm_contractor_documents;
CREATE POLICY csm_docs_all ON public.csm_contractor_documents
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS csm_audit_all ON public.csm_portal_audit_logs;
CREATE POLICY csm_audit_all ON public.csm_portal_audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Seed Baseline Industrial Contractors for Tenant
DO $$
DECLARE
  v_tenant TEXT := 'tenant_alkylation';
  v_company TEXT := 'company_refining';
  v_site_1 TEXT := 'site_refinery_north';
  v_site_2 TEXT := 'site_refinery_south';
  v_apex_id TEXT := 'csm_apex_piping_01';
  v_safeline_id TEXT := 'csm_safeline_scaffold_02';
  v_vanguard_id TEXT := 'csm_vanguard_elec_03';
  v_clean_id TEXT := 'csm_enviro_clean_04';
  v_pinnacle_id TEXT := 'csm_pinnacle_insul_05';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Tenant" WHERE id = v_tenant) THEN
    SELECT id INTO v_tenant FROM "Tenant" LIMIT 1;
  END IF;

  IF v_tenant IS NOT NULL THEN
    -- 1. Apex Mechanical & Piping Services
    INSERT INTO public.csm_contractor_profiles (
      id, tenant_id, company_id, company_name, company_code, tier, specialties,
      status, safety_grade, prequal_score, prequal_valid_until,
      primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
      emergency_contact_name, emergency_contact_phone, office_address, city, state, postal_code,
      tax_id_ein, portal_access_token, notes
    ) VALUES (
      v_apex_id, v_tenant, v_company, 'Apex Mechanical & Piping Services', 'CNT-APEX-01', 'TIER_1',
      ARRAY['Welding & Pipefitting', 'Pressure Vessel Repair', 'Hot Tap Operations', 'Valve Overhaul'],
      'ACTIVE', 'A', 96.50, NOW() + INTERVAL '10 months',
      'Marcus Vance', 'VP Operations', 'm.vance@apex-mechanical.com', '+1 (555) 234-8890',
      'Apex 24/7 Dispatch', '+1 (555) 234-9999', '1420 Petrochemical Parkway', 'Houston', 'TX', '77001',
      '74-1829401', 'token_apex_demo_secure_access_001', 'Approved for high-pressure hydrocracker and alkylation unit turnarounds.'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Safeline Scaffolding & Rigging Corp
    INSERT INTO public.csm_contractor_profiles (
      id, tenant_id, company_id, company_name, company_code, tier, specialties,
      status, safety_grade, prequal_score, prequal_valid_until,
      primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
      emergency_contact_name, emergency_contact_phone, office_address, city, state, postal_code,
      tax_id_ein, portal_access_token, notes
    ) VALUES (
      v_safeline_id, v_tenant, v_company, 'Safeline Scaffolding & Rigging Corp', 'CNT-SAFE-02', 'TIER_1',
      ARRAY['Scaffolding', 'Fall Protection Systems', 'Rigging & Heavy Lift', 'Confined Space Rescue Standby'],
      'ACTIVE', 'A', 94.00, NOW() + INTERVAL '8 months',
      'Elena Rostova', 'HSE Director', 'erostova@safelinescaffold.com', '+1 (555) 345-1212',
      'Safety Command Desk', '+1 (555) 345-9111', '890 Industrial Loop Suite 400', 'Baton Rouge', 'LA', '70801',
      '72-9912044', 'token_safeline_demo_secure_access_002', 'Certified scaffold erectors for flare stacks and distillation columns.'
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. Vanguard Electrical & Instrumentation
    INSERT INTO public.csm_contractor_profiles (
      id, tenant_id, company_id, company_name, company_code, tier, specialties,
      status, safety_grade, prequal_score, prequal_valid_until,
      primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
      emergency_contact_name, emergency_contact_phone, office_address, city, state, postal_code,
      tax_id_ein, portal_access_token, notes
    ) VALUES (
      v_vanguard_id, v_tenant, v_company, 'Vanguard Electrical & Instrumentation', 'CNT-VANG-03', 'TIER_1',
      ARRAY['Electrical & Instrumentation', 'Class 1 Div 1 Hazardous Wiring', 'Analyzer Maintenance', 'PLC/DCS Loops'],
      'ACTIVE', 'B', 86.00, NOW() + INTERVAL '5 months',
      'Derek Chen', 'Senior Project Manager', 'dchen@vanguard-ei.com', '+1 (555) 456-7890',
      'Derek Chen Mobile', '+1 (555) 456-7899', '210 Power Grid Way', 'Beaumont', 'TX', '77701',
      '76-4431902', 'token_vanguard_demo_secure_access_003', 'Requires full hot work permit verification before entering battery limits.'
    ) ON CONFLICT (id) DO NOTHING;

    -- 4. Apex Environmental & Tank Cleaning
    INSERT INTO public.csm_contractor_profiles (
      id, tenant_id, company_id, company_name, company_code, tier, specialties,
      status, safety_grade, prequal_score, prequal_valid_until,
      primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
      emergency_contact_name, emergency_contact_phone, office_address, city, state, postal_code,
      tax_id_ein, portal_access_token, notes
    ) VALUES (
      v_clean_id, v_tenant, v_company, 'Apex Environmental & Tank Cleaning', 'CNT-ENVI-04', 'TIER_2',
      ARRAY['Hydroblasting & Tank Cleaning', 'Chemical Cleaning', 'Waste Management & Neutralization'],
      'CONDITIONAL', 'C', 78.50, NOW() + INTERVAL '2 months',
      'Arthur Pendelton', 'Operations Manager', 'apendelton@apex-enviro.com', '+1 (555) 567-3344',
      'Arthur Pendelton', '+1 (555) 567-3399', '44 Terminal Road', 'Port Arthur', 'TX', '77640',
      '75-5592810', 'token_enviro_demo_secure_access_004', 'Conditional status pending 2026 EMR worker comp renewal update.'
    ) ON CONFLICT (id) DO NOTHING;

    -- 5. Pinnacle Thermal Insulation Ltd
    INSERT INTO public.csm_contractor_profiles (
      id, tenant_id, company_id, company_name, company_code, tier, specialties,
      status, safety_grade, prequal_score, prequal_valid_until,
      primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
      emergency_contact_name, emergency_contact_phone, office_address, city, state, postal_code,
      tax_id_ein, portal_access_token, notes
    ) VALUES (
      v_pinnacle_id, v_tenant, v_company, 'Pinnacle Thermal Insulation Ltd', 'CNT-PINN-05', 'TIER_2',
      ARRAY['Insulation & Lagging', 'Cryogenic Jacketing', 'Asbestos Abatement / Lead Safe'],
      'ACTIVE', 'A', 91.00, NOW() + INTERVAL '11 months',
      'Sarah Jenkins', 'Contracts Manager', 'sjenkins@pinnacle-insul.com', '+1 (555) 678-9012',
      'Safety Desk', '+1 (555) 678-9900', '710 Coastal Highway', 'Corpus Christi', 'TX', '78401',
      '73-8829103', 'token_pinnacle_demo_secure_access_005', 'Standard insulation maintenance contractor.'
    ) ON CONFLICT (id) DO NOTHING;

    -- Seed Sites
    INSERT INTO public.csm_contractor_sites (tenant_id, contractor_id, site_id, status)
    VALUES
      (v_tenant, v_apex_id, v_site_1, 'APPROVED'),
      (v_tenant, v_apex_id, v_site_2, 'APPROVED'),
      (v_tenant, v_safeline_id, v_site_1, 'APPROVED'),
      (v_tenant, v_vanguard_id, v_site_1, 'APPROVED'),
      (v_tenant, v_clean_id, v_site_1, 'RESTRICTED'),
      (v_tenant, v_pinnacle_id, v_site_1, 'APPROVED')
    ON CONFLICT (contractor_id, site_id) DO NOTHING;

    -- Seed Documents & COIs
    INSERT INTO public.csm_contractor_documents (
      id, tenant_id, contractor_id, document_type, title, file_name, file_url,
      policy_number, insurance_carrier, coverage_amount_usd, effective_date, expiration_date,
      verification_status, verified_at, uploaded_via_portal
    ) VALUES
      (
        'doc_apex_coi_gl_01', v_tenant, v_apex_id, 'COI_GENERAL_LIABILITY',
        'Commercial General Liability Certificate ($10M)', 'Apex_COI_GL_2026.pdf',
        'https://storage.psm-os.local/contractors/apex/coi_gl_2026.pdf',
        'GL-99824-TX', 'Travelers Property Casualty', 10000000.00,
        CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days',
        'VERIFIED', NOW() - INTERVAL '50 days', true
      ),
      (
        'doc_apex_coi_wc_02', v_tenant, v_apex_id, 'COI_WORKERS_COMP',
        'Workers Compensation & Employers Liability ($2M)', 'Apex_COI_WC_2026.pdf',
        'https://storage.psm-os.local/contractors/apex/coi_wc_2026.pdf',
        'WC-11204-TX', 'Texas Mutual Insurance', 2000000.00,
        CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days',
        'VERIFIED', NOW() - INTERVAL '50 days', true
      ),
      (
        'doc_apex_osha300_03', v_tenant, v_apex_id, 'OSHA_300A',
        '2025 OSHA Form 300A Summary of Work-Related Injuries', 'Apex_OSHA_300A_2025.pdf',
        'https://storage.psm-os.local/contractors/apex/osha_300a_2025.pdf',
        NULL, NULL, 0,
        '2025-01-01', '2025-12-31',
        'VERIFIED', NOW() - INTERVAL '60 days', true
      ),
      (
        'doc_apex_hse_manual_04', v_tenant, v_apex_id, 'SAFETY_PROGRAM_MANUAL',
        'Apex Comprehensive HSE Written Safety Policy (Rev 7)', 'Apex_HSE_Manual_Rev7.pdf',
        'https://storage.psm-os.local/contractors/apex/hse_manual_rev7.pdf',
        NULL, NULL, 0,
        CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '245 days',
        'VERIFIED', NOW() - INTERVAL '100 days', true
      ),
      (
        'doc_enviro_coi_expiring_05', v_tenant, v_clean_id, 'COI_GENERAL_LIABILITY',
        'Commercial General Liability Certificate ($2M)', 'Enviro_COI_GL_2025.pdf',
        'https://storage.psm-os.local/contractors/enviro/coi_gl_2025.pdf',
        'GL-44391-TX', 'Liberty Mutual', 2000000.00,
        CURRENT_DATE - INTERVAL '340 days', CURRENT_DATE + INTERVAL '14 days',
        'VERIFIED', NOW() - INTERVAL '300 days', true
      )
    ON CONFLICT (id) DO NOTHING;

  END IF;
END $$;
