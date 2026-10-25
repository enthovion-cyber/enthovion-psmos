// apps/web/src/features/contractor-safety/ContractorListPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Link2,
  Check,
  Building2,
  X,
  ExternalLink,
  Filter
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmGradeBadge,
  CsmStatusBadge,
  CsmTierBadge
} from './ContractorSafetyUi';
import {
  useContractorLookups,
  useContractorsList,
  useCreateContractor
} from './hooks/useContractorSafety';

export function ContractorListPage() {
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [tier, setTier] = useState('TIER_1');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactTitle, setPrimaryContactTitle] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [primaryContactPhone, setPrimaryContactPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: lookups } = useContractorLookups();
  const { data: contractors = [], isLoading } = useContractorsList({
    tier: selectedTier !== 'ALL' ? selectedTier : undefined,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    grade: selectedGrade !== 'ALL' ? selectedGrade : undefined,
    search: search ? search : undefined
  });

  const createContractorMutation = useCreateContractor();

  const handleCopyPortalLink = (contractorId: string, token: string | null | undefined) => {
    if (!token) return;
    const url = `${window.location.origin}/contractor-portal/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedTokenId(contractorId);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companyCode) return;

    await createContractorMutation.mutateAsync({
      company_name: companyName,
      company_code: companyCode,
      tier,
      specialties,
      primary_contact_name: primaryContactName,
      primary_contact_title: primaryContactTitle,
      primary_contact_email: primaryContactEmail,
      primary_contact_phone: primaryContactPhone,
      emergency_contact_phone: emergencyPhone,
      office_address: officeAddress,
      city,
      state,
      tax_id_ein: taxId,
      notes
    });

    setIsRegisterOpen(false);
    // Reset form
    setCompanyName('');
    setCompanyCode('');
    setSpecialties([]);
    setPrimaryContactName('');
    setPrimaryContactEmail('');
    setPrimaryContactPhone('');
    setEmergencyPhone('');
    setOfficeAddress('');
    setCity('');
    setState('');
    setTaxId('');
    setNotes('');
  };

  const availableSpecialties = lookups?.specialties ?? [
    'Welding & Pipefitting',
    'Scaffolding',
    'Electrical & Instrumentation',
    'Hydroblasting & Tank Cleaning',
    'Insulation & Lagging',
    'Rigging & Heavy Lift',
    'Civil & Concrete',
    'Painting & Coating'
  ];

  const toggleSpecialty = (spec: string) => {
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ContractorSafetyHeader
        title="Contractors Master Directory"
        subtitle="Approved contractor companies, risk tier classifications, prequalification standing, and vendor self-service access."
        actions={
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Register Contractor
          </button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Filters and Search Bar */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company name, code, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Tier filter */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              aria-label="Filter by Tier"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="TIER_1">Tier 1 (High Risk)</option>
              <option value="TIER_2">Tier 2 (Medium Risk)</option>
              <option value="TIER_3">Tier 3 (Low Risk)</option>
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CONDITIONAL">Conditional</option>
              <option value="PENDING_PREQUAL">Pending Prequal</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Grade filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              aria-label="Filter by Grade"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Grades</option>
              <option value="A">Grade A (Preferred)</option>
              <option value="B">Grade B (Approved)</option>
              <option value="C">Grade C (Conditional)</option>
              <option value="D">Grade D/F (Review)</option>
            </select>
          </div>
        </div>

        {/* Contractor Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Contractor Company</th>
                  <th className="py-3 px-4 font-semibold">Risk Tier</th>
                  <th className="py-3 px-4 font-semibold">Safety Grade</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Craft Specialties</th>
                  <th className="py-3 px-4 font-semibold">Primary Contact</th>
                  <th className="py-3 px-4 font-semibold">Self-Service Portal</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Loading contractor directory...
                    </td>
                  </tr>
                ) : contractors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No contractors found matching current filters.
                    </td>
                  </tr>
                ) : (
                  contractors.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/contractor-safety/contractors/${c.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {c.company_name}
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {c.company_code} &bull; {c.city || 'HQ'}, {c.state || 'TX'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <CsmTierBadge tier={c.tier} />
                      </td>
                      <td className="py-3 px-4">
                        <CsmGradeBadge grade={c.safety_grade} score={c.prequal_score} />
                      </td>
                      <td className="py-3 px-4">
                        <CsmStatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {c.specialties?.slice(0, 2).map((spec) => (
                            <span
                              key={spec}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                          {(c.specialties?.length ?? 0) > 2 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                              +{(c.specialties?.length ?? 0) - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {c.primary_contact_name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.primary_contact_phone || c.primary_contact_email || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.portal_access_token ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyPortalLink(c.id, c.portal_access_token)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                                copiedTokenId === c.id
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                              title="Copy external vendor self-service portal link"
                            >
                              {copiedTokenId === c.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Link Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copy Portal Link</span>
                                </>
                              )}
                            </button>
                            <Link
                              href={`/contractor-portal/${c.portal_access_token}`}
                              target="_blank"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Open Vendor Portal in New Tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">No token</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/contractor-safety/contractors/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          View Profile &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Register New Contractor Company
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Industrial Services LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contractor Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CNT-ACME-01"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Risk Tier (OSHA 1910.119(h))
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="TIER_1">Tier 1 - High Risk (Process Unit Turnaround)</option>
                    <option value="TIER_2">Tier 2 - Medium Risk (Facilities Maintenance)</option>
                    <option value="TIER_3">Tier 3 - Low Risk (Non-Process / Consulting)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 74-XXXXXXX"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Craft Specialties Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Craft Specialties &amp; Work Capabilities
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-h-32 overflow-y-auto">
                  {availableSpecialties.map((spec) => {
                    const isSelected = specialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance"
                    value={primaryContactName}
                    onChange={(e) => setPrimaryContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. m.vance@acme.com"
                    value={primaryContactEmail}
                    onChange={(e) => setPrimaryContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={primaryContactPhone}
                    onChange={(e) => setPrimaryContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    24/7 Emergency Dispatch Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 999-0000"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createContractorMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {createContractorMutation.isPending ? 'Registering...' : 'Register & Generate Portal Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
