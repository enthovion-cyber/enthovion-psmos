-- Phase 1 Core Backbone Enhancements Migration
-- Location Hierarchy, Document Equipment Multi-Link, Action Timing Gates, Numbering Rules

-- 1. Unit & Area Enhancements
ALTER TABLE public."Unit"
  ADD COLUMN IF NOT EXISTS "operatingStatus" text NOT NULL DEFAULT 'IN_SERVICE',
  ADD COLUMN IF NOT EXISTS "operating_status" text NOT NULL DEFAULT 'IN_SERVICE',
  ADD COLUMN IF NOT EXISTS "unitManagerId" text REFERENCES public."User"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "unit_manager_id" text REFERENCES public."User"(id) ON DELETE SET NULL;

ALTER TABLE public."Area"
  ADD COLUMN IF NOT EXISTS "areaAuthorityUserId" text REFERENCES public."User"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "area_authority_user_id" text REFERENCES public."User"(id) ON DELETE SET NULL;

-- 2. Document & Equipment Many-to-Many Linking
CREATE TABLE IF NOT EXISTS public."DocumentEquipment" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" text NOT NULL REFERENCES public."Tenant"(id) ON DELETE CASCADE,
  "documentId" text NOT NULL REFERENCES public."Document"(id) ON DELETE CASCADE,
  "equipmentId" text NOT NULL REFERENCES public."Equipment"(id) ON DELETE CASCADE,
  "notes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "DocumentEquipment_doc_equip_unique" UNIQUE ("tenantId", "documentId", "equipmentId")
);

CREATE INDEX IF NOT EXISTS "DocumentEquipment_documentId_idx" ON public."DocumentEquipment"("documentId");
CREATE INDEX IF NOT EXISTS "DocumentEquipment_equipmentId_idx" ON public."DocumentEquipment"("equipmentId");
CREATE INDEX IF NOT EXISTS "DocumentEquipment_tenantId_idx" ON public."DocumentEquipment"("tenantId");

-- 3. Document Redlining & Lifecycle Status
ALTER TABLE public."Document"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" text NOT NULL DEFAULT 'EFFECTIVE',
  ADD COLUMN IF NOT EXISTS "activeMocId" text,
  ADD COLUMN IF NOT EXISTS "redlineMarkupUrl" text;

-- 4. Action Timing Gates & Verification / Extension Governance
ALTER TABLE public."Action"
  ADD COLUMN IF NOT EXISTS "timingGate" text NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS "verificationNotes" text,
  ADD COLUMN IF NOT EXISTS "extensionReason" text,
  ADD COLUMN IF NOT EXISTS "requestedDueDate" timestamptz,
  ADD COLUMN IF NOT EXISTS "extensionStatus" text NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "extensionApprovedById" text REFERENCES public."User"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Action_timingGate_idx" ON public."Action"("tenantId", "timingGate", "status");

-- 5. Tenant Auto-Numbering Rules Table
CREATE TABLE IF NOT EXISTS public.tenant_numbering_rules (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id text NOT NULL,
  module_key text NOT NULL,
  prefix text NOT NULL,
  include_site_code boolean NOT NULL DEFAULT true,
  include_year boolean NOT NULL DEFAULT true,
  digits integer NOT NULL DEFAULT 4,
  current_sequence integer NOT NULL DEFAULT 1,
  sample_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "tenant_numbering_rules_tenant_module_unique" UNIQUE (tenant_id, module_key)
);

CREATE INDEX IF NOT EXISTS "tenant_numbering_rules_tenant_idx" ON public.tenant_numbering_rules(tenant_id);

-- Seed default numbering rules for existing tenants
INSERT INTO public.tenant_numbering_rules (tenant_id, module_key, prefix, include_site_code, include_year, digits, current_sequence, sample_preview)
SELECT 
  t.id, 
  m.module_key, 
  m.prefix, 
  true, 
  true, 
  4, 
  1, 
  m.prefix || '-SITE-' || to_char(now(), 'YYYY') || '-0001'
FROM public."Tenant" t
CROSS JOIN (
  VALUES 
    ('ptw', 'PTW'),
    ('moc', 'MOC'),
    ('actions', 'CAPA'),
    ('incidents', 'INC'),
    ('documents', 'DOC'),
    ('pssr', 'PSSR'),
    ('equipment', 'EQ')
) AS m(module_key, prefix)
ON CONFLICT (tenant_id, module_key) DO NOTHING;
