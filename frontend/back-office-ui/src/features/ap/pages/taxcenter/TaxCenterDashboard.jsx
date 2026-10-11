import { useState, useCallback, useEffect, useMemo } from 'react';
import { Building2, Clock, CheckCircle, Send, Eye, AlertTriangle, Check, ArrowLeft, FileText, Shield, Play, RefreshCw, UserCheck, Search, Filter } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { Card, StatCard, Button, Modal, Badge, Alert, Textarea, Empty, ConfirmModal, Pagination, Input, Select } from '../../../../components/ui/index.jsx';
import { AUDIT_TYPES, isAuditTypeMatch } from '../../data/constants.js';
import { formatRevenue } from '../../utils/revenueFormatter.js';
import PlanStatusBadge from '../shared/PlanStatusBadge.jsx';
import CaseDetailModal from '../shared/CaseDetailModal.jsx';
import TaxCenterCapacityFeedbackModal from './TaxCenterCapacityFeedbackModal.jsx';
import IssueDirectorReviewModal from '../../../issue/components/IssueDirectorReviewModal.jsx';
import TaxCenterTeamLeaderAssignModal from './TaxCenterTeamLeaderAssignModal.jsx';

export default function TaxCenterDashboard({ view }) {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [viewDetailModal, setViewDetailModal] = useState(null);
  const [issueDirectorCase, setIssueDirectorCase] = useState(null);
  const [tcAllocations, setTcAllocations] = useState([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [auditCases, setAuditCases] = useState(null);
  const [casesLoading, setCasesLoading] = useState(false);
  const [cascading, setCascading] = useState(null); // planId being cascaded
  const [cascadeResult, setCascadeResult] = useState(null);
  const [cascadeModal, setCascadeModal] = useState(false);
  const [revenueStats, setRevenueStats] = useState(null);
  const [casePage, setCasePage] = useState(1);
  const [caseItemsPerPage, setCaseItemsPerPage] = useState(10);

  // Assignment and Filter states
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [filterAuditType, setFilterAuditType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [casesToAssign, setCasesToAssign] = useState([]);

  const allCasesList = auditCases?.cases || [];

  // Distinct plan years from cases
  const availablePlanYears = useMemo(() => {
    const years = new Set(allCasesList.map(c => {
      if (c.planYear) return String(c.planYear);
      if (c.caseNumber && c.caseNumber.includes('-')) {
        const p = c.caseNumber.split('-')[0];
        if (!isNaN(p) && p.length === 4) return p;
      }
      return '2026';
    }));
    return ['ALL', ...Array.from(years).sort()];
  }, [allCasesList]);

  // Filtered cases based on user controls
  const filteredCases = useMemo(() => {
    return allCasesList.filter(c => {
      // Audit Type filter
      if (filterAuditType !== 'ALL') {
        if (!isAuditTypeMatch(filterAuditType, c.auditType)) return false;
      }
      // Status filter
      if (filterStatus !== 'ALL') {
        if (c.status !== filterStatus) return false;
      }
      // Year filter
      if (filterYear !== 'ALL') {
        let yr = c.planYear;
        if (!yr && c.caseNumber && c.caseNumber.includes('-')) {
          const p = c.caseNumber.split('-')[0];
          if (!isNaN(p) && p.length === 4) yr = p;
        }
        if (String(yr || '2026') !== String(filterYear)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tp = (c.taxpayerName || '').toLowerCase();
        const tin = (c.taxpayerId || c.tin || '').toLowerCase();
        const num = (c.caseNumber || '').toLowerCase();
        if (!tp.includes(q) && !tin.includes(q) && !num.includes(q)) return false;
      }
      return true;
    });
  }, [allCasesList, filterAuditType, filterStatus, filterYear, searchQuery]);

  const totalFilteredCount = filteredCases.length;
  const totalFilteredPages = Math.ceil(totalFilteredCount / caseItemsPerPage) || 1;
  const paginatedCases = filteredCases.slice((casePage - 1) * caseItemsPerPage, casePage * caseItemsPerPage);

  const toggleSelectAll = () => {
    if (selectedCaseIds.length === paginatedCases.length && paginatedCases.length > 0) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(paginatedCases.map(c => c.id || c.caseNumber));
    }
  };

  const toggleSelectCase = (id) => {
    setSelectedCaseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenAssignModal = (cases = null) => {
    if (cases && cases.length > 0) {
      setCasesToAssign(cases);
    } else {
      const selected = allCasesList.filter(c => selectedCaseIds.includes(c.id || c.caseNumber));
      setCasesToAssign(selected);
    }
    setAssignModalOpen(true);
  };

  const issueCases = allCasesList.filter(c => ['ISSUE', 'ISSUE_AUDIT', 'issue_audit'].includes((c.auditType || '').toUpperCase()));
  const pendingDirectorDecisionCases = issueCases.filter(c => ['SUBMITTED_TO_TC_DIRECTOR', 'TL_APPROVED'].includes(c.status));

  const mapCaseForModal = (c) => {
    if (!c) return null;
    let year = c.planYear;
    if (!year && c.caseNumber && c.caseNumber.includes('-')) {
      const prefix = c.caseNumber.split('-')[0];
      if (!isNaN(prefix)) year = parseInt(prefix, 10);
    }
    return {
      ...c,
      id: c.id || c.caseNumber,
      caseNumber: c.caseNumber,
      taxpayerName: c.taxpayerName || (c.taxpayerId ? `Taxpayer ${c.taxpayerId}` : 'Taxpayer Corp'),
      tin: c.taxpayerId || c.tin,
      sector: c.sector || 'Import/Export & General Trading',
      annualRevenue: c.estimatedRevenue || 14200000,
      employees: c.employees || 35,
      taxCenter: c.taxCenterCode || c.taxCenter || user?.taxCenter,
      region: c.regionCode || c.region || user?.region,
      riskScore: c.riskScore || 65,
      riskLevel: c.riskScore >= 60 ? 'CRITICAL' : c.riskScore >= 40 ? 'HIGH' : c.riskScore >= 20 ? 'MEDIUM' : 'LOW',
      riskFactors: c.riskFactors || ['Turnover Mismatch', 'Large Discrepancy with Customs Declarations', 'High VAT Refund Claims'],
      auditType: c.auditType,
      status: c.status || 'PENDING_ASSIGNMENT',
      planId: c.planId,
      planYear: year || 2026,
      assignedTeamLeader: c.assignedTeamLeaderId || c.assignedTeamLeader,
      assignedAuditor: c.assignedAuditorId || c.assignedAuditor,
      createdAt: c.createdAt || new Date().toISOString(),
      notes: c.notes || 'Automated risk engine case selection. High variance flagged between domestic sales declaration and third-party bank transaction logs.'
    };
  };

  const mapTaxCenterToBackendFormat = (tcFromUser) => {
    if (!tcFromUser) return null;
    const mapping = {
      'federal-lto1': 'federal-lto1', 'federal-lto2': 'federal-lto2',
      'addis_ababa-tc1': 'AA-TC1', 'addis_ababa-tc2': 'AA-TC2', 'addis_ababa-tc3': 'AA-TC3',
      'amhara-tc1': 'BA-TC1', 'amhara-tc2': 'BA-TC2', 'amhara-tc3': 'BA-TC3',
      'oromia-tc1': 'BB-TC1', 'oromia-tc2': 'BB-TC2', 'oromia-tc3': 'BB-TC3',
      'dire_dawa-tc1': 'AB-TC1', 'dire_dawa-tc2': 'AB-TC2', 'dire_dawa-tc3': 'AB-TC3',
      'snnpr-tc1': 'CA-TC1', 'snnpr-tc2': 'CA-TC2', 'snnpr-tc3': 'CA-TC3',
      'somali-tc1': 'SO-TC1', 'somali-tc2': 'SO-TC2', 'somali-tc3': 'SO-TC3',
    };
    return mapping[tcFromUser] || tcFromUser;
  };

  const mapRegionToBackendFormat = (regionFromUser) => {
    if (!regionFromUser) return null;
    const mapping = {
      'federal_level': 'FED', 'fed': 'FED',
      'addis_ababa': 'AA', 'amhara': 'BA', 'oromia': 'BB',
      'dire_dawa': 'AB', 'snnpr': 'CA', 'somali': 'SO',
    };
    return mapping[regionFromUser] || regionFromUser;
  };

  const taxCenter = mapTaxCenterToBackendFormat(user?.taxCenter);
  const region = mapRegionToBackendFormat(user?.region);

  // Load tax center revenue stats
  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const tcCode = taxCenter || user?.taxCenterCode;
        if (!tcCode) return;
        const res = await fetch(`/api/v1/backoffice/ap/revenue/taxcenter?taxCenterCode=${encodeURIComponent(tcCode)}`);
        if (res.ok) {
          const data = await res.json();
          setRevenueStats(data);
        }
      } catch (err) {
        console.error('Failed to load revenue stats:', err);
      }
    };
    loadRevenue();
  }, [user?.id, user?.taxCenterCode, taxCenter]);

  // Fetch allocations from backend
  const loadTcAllocations = useCallback(async () => {
    setAllocationsLoading(true);
    try {
      if (!taxCenter) { setTcAllocations([]); return; }
      const response = await fetch(
        `/api/v1/backoffice/ap/tax-center/allocations?taxCenterId=${taxCenter}`,
        { headers: { 'X-Actor-Id': user.id || 'tax-center-staff' } }
      );
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const result = await response.json();
      setTcAllocations(result.data || []);
    } catch (error) {
      console.error('Failed to load allocations:', error);
      setTcAllocations([]);
    } finally {
      setAllocationsLoading(false);
    }
  }, [taxCenter, user.id]);

  // Fetch cases from backend
  const loadCases = useCallback(async () => {
    if (!taxCenter) return;
    setCasesLoading(true);
    try {
      const response = await fetch(
        `/api/v1/backoffice/ap/tax-center/cases?taxCenterCode=${taxCenter}`,
        { headers: { 'X-Actor-Id': user.id || 'tax-center-staff' } }
      );
      if (response.ok) {
        const result = await response.json();
        setAuditCases(result.data || null);
        console.log('✅ Cases loaded:', result.data?.totalCases || 0);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setCasesLoading(false);
    }
  }, [taxCenter, user.id]);

  useEffect(() => {
    if (taxCenter && region) loadTcAllocations();
  }, [taxCenter, region, loadTcAllocations]);

  useEffect(() => { loadCases(); }, [loadCases]);

  // ── Plan Lifecycle Status Groups ──
  const POST_APPROVAL_STATUSES = useMemo(() => [
    'FINALIZED',
    'SENIOR_MGMT_APPROVED',
    'APPROVED_TO_REGIONS',
    'DEPLOYED',
    'REGIONAL_DEPLOYED',
    'SENT_TO_TAX_CENTERS',
    'REGIONAL_APPROVED'
  ], []);

  // Check if a plan already has cases created/cascaded
  const planHasCases = useCallback((planId) => {
    if (!planId) return false;
    const alloc = tcAllocations.find(a => a.planId === planId);
    if (alloc?.cascaded) return true;
    if ((alloc?.caseCount || 0) > 0) return true;
    if (!auditCases) return false;
    if (auditCases.planIds && auditCases.planIds.includes(planId)) return true;
    if (auditCases.cases && auditCases.cases.length > 0) {
      return auditCases.cases.some(c => c.planId === planId || (c.caseNumber && c.caseNumber.includes(planId.slice(0, 8))));
    }
    return false;
  }, [tcAllocations, auditCases]);

  const getPlanCaseCount = useCallback((planId) => {
    if (!planId) return 0;
    const alloc = tcAllocations.find(a => a.planId === planId);
    if (alloc?.caseCount != null && alloc.caseCount > 0) return alloc.caseCount;
    if (!auditCases || !auditCases.cases) return 0;
    return auditCases.cases.filter(c => c.planId === planId || (c.caseNumber && c.caseNumber.includes(planId.slice(0, 8)))).length;
  }, [tcAllocations, auditCases]);

  // ── Separate allocations by stage & actionability ──
  // Rule 1: Pending Capacity Feedback (Pre-Approval Review)
  // ONLY for pre-approval draft plans where feedback has NOT yet been submitted.
  // Once feedback is submitted (acknowledged: true), it disappears from this pending list.
  // Approved/finalized plans NEVER appear here.
  const pendingFeedback = useMemo(() => {
    return tcAllocations.filter(a => !a.acknowledged && !POST_APPROVAL_STATUSES.includes(a.planStatus));
  }, [tcAllocations, POST_APPROVAL_STATUSES]);

  // Rule 2: Pending Case Cascade (Post-Approval Execution)
  // ONLY for approved & deployed plans that have NOT yet cascaded into cases.
  // Once cases are created, it disappears from this pending cascade list.
  const pendingCascade = useMemo(() => {
    return tcAllocations.filter(a => POST_APPROVAL_STATUSES.includes(a.planStatus) && !a.cascaded && !planHasCases(a.planId));
  }, [tcAllocations, POST_APPROVAL_STATUSES, planHasCases]);

  const scrollToCases = (alloc) => {
    if (alloc?.planYear) {
      setFilterYear(String(alloc.planYear));
    }
    const elem = document.getElementById('audit-cases-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  // ── CASCADE: trigger backend to create cases from plan allocation ──
  const handleCascade = async (allocation, force = false) => {
    if (planHasCases(allocation.planId) && !force) {
      const confirmRecascade = window.confirm(
        `Audit cases have already been generated for this plan (${allocation.planName || allocation.planId}).\n\nDo you want to re-cascade / create cases based on the plan allocations?`
      );
      if (!confirmRecascade) {
        return;
      }
    }
    setCascading(allocation.planId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/ap/plans/${allocation.planId}/cascade-to-cases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Actor-Id': user.id || 'tax-center-staff'
          },
          body: JSON.stringify({ taxCenterCode: taxCenter })
        }
      );
      const result = await response.json();
      if (result.status === 'ERROR' || result.error) {
        throw new Error(result.error?.message || result.message || 'Cascade failed');
      }
      setCascadeResult({
        planName: allocation.planName,
        ...result.data
      });
      setCascadeModal(true);
      // Reload cases and allocations in background
      await loadCases();
      await loadTcAllocations();
    } catch (error) {
      console.error('Cascade failed:', error);
      alert(`❌ Cascade Failed\n\n${error.message}`);
    } finally {
      setCascading(null);
    }
  };

  // ── FEEDBACK (acknowledge allocation) ──
  const openFeedback = (allocation) => {
    setFeedbackModal(allocation);
  };

  const totalAllocations = tcAllocations.reduce((sum, a) => sum + (a.proposedCount || 0), 0);
  const totalCasesCount = auditCases?.totalCases || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Plans Assigned" value={tcAllocations.length} icon={Building2} color="blue"
          sub={taxCenter?.replace(/-/g, ' ').toUpperCase()} />
        <StatCard label="Total Cases" value={totalCasesCount > 0 ? totalCasesCount.toLocaleString() : totalAllocations.toLocaleString()}
          icon={CheckCircle} color="green"
          sub={totalCasesCount > 0 ? 'Generated by risk engine' : 'Allocated from plans'} />
        <StatCard label="Pending Feedback" value={pendingFeedback.length} icon={Clock} color="orange"
          sub={pendingFeedback.length > 0 ? 'Review & submit feedback' : 'No feedback pending'} />
        <StatCard label="Pending Cascade" value={pendingCascade.length} icon={Play} color="yellow"
          sub={pendingCascade.length > 0 ? 'Ready to create cases' : 'All cascaded'} />
      </div>

      {/* TC Revenue by Audit Type - ONLY for current logged in tax center */}
      {revenueStats && revenueStats.taxCenterBreakdown && revenueStats.taxCenterBreakdown.some(tc => tc.taxCenterCode === taxCenter) && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            💰 Estimated Revenue by Audit Type ({taxCenter})
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {revenueStats.taxCenterBreakdown
              .filter(tc => tc.taxCenterCode === taxCenter)
              .map((tc) => (
                Object.entries(tc.revenueByAuditType || {}).map(([type, rev]) => (
                  <div key={`${tc.taxCenterCode}-${type}`} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatRevenue(rev)}</p>
                    <p className="text-xs text-blue-600 font-semibold">{tc.taxCenterCode}</p>
                  </div>
                ))
              ))}
          </div>
        </Card>
      )}

      {pendingFeedback.length > 0 && (
        <Alert type="info" title="Plans awaiting capacity feedback">
          The Regional Director has distributed draft allocations for review. Click <strong>"Submit Feedback"</strong> to review auditor capacity and submit feedback. (No cases will be created at this stage).
        </Alert>
      )}

      {pendingCascade.length > 0 && (
        <Alert type="warning" title="Plans ready for case cascade">
          These plans have been fully approved and deployed by your Regional Director. Click <strong>"Create Cases"</strong> to run the risk engine classification and generate audit cases.
        </Alert>
      )}

      {/* ═══ PENDING FEEDBACK TABLE (Pre-Approval Review) ═══ */}
      {pendingFeedback.length > 0 && (
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">📝 Pending Capacity Feedback (Pre-Approval Review)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Draft plan allocations waiting for tax center capacity review and feedback submission</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Plan Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Allocated Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingFeedback.map(alloc => (
                  <tr key={alloc.allocationId}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => openFeedback(alloc)}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{alloc.planName || `Plan`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">FY {alloc.planYear}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{alloc.proposedCount?.toLocaleString() || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{alloc.regionCode || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color="blue" dot>Awaiting Feedback</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" icon={Eye}
                          onClick={(e) => { e.stopPropagation(); openFeedback(alloc); }}>
                          Review Allocation
                        </Button>
                        <Button size="sm" variant="primary" icon={Send}
                          onClick={(e) => { e.stopPropagation(); openFeedback(alloc); }}>
                          Submit Feedback
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══ PENDING CASCADE TABLE (Post-Approval Deployment) ═══ */}
      {pendingCascade.length > 0 && (
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">🚀 Pending Case Cascade (Post-Approval Execution)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Approved & deployed plans waiting to be cascaded to audit cases via the risk engine</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Plan Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Allocated Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingCascade.map(alloc => (
                  <tr key={alloc.allocationId}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => setViewDetailModal(alloc)}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{alloc.planName || `Plan`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">FY {alloc.planYear}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{alloc.proposedCount?.toLocaleString() || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{alloc.regionCode || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color="yellow" dot>Approved - Ready for Cascade</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" icon={Eye}
                          onClick={(e) => { e.stopPropagation(); setViewDetailModal(alloc); }}>
                          View
                        </Button>
                        <Button size="sm" variant="success" icon={Play} loading={cascading === alloc.planId}
                          onClick={(e) => { e.stopPropagation(); handleCascade(alloc); }}>
                          {cascading === alloc.planId ? 'Cascading...' : 'Create Cases'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══ ALL ASSIGNED PLANS / EXECUTION DOSSIER & STATUS TRACKING (Rule 3) ═══ */}
      {tcAllocations.length > 0 && (
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                All Assigned Plans — Execution Dossier & Lifecycle Tracking
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete audit plan dossier showing capacity review status, statutory lifecycle stage, and case cascade progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {tcAllocations.length} {tcAllocations.length === 1 ? 'Plan' : 'Plans'} Assigned
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Plan Name & Year</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Target Allocation</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Plan Lifecycle Stage</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Pre-Approval Feedback</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Case Cascade Execution</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tcAllocations.map(alloc => {
                  const isCascaded = alloc.cascaded || planHasCases(alloc.planId);
                  const isPostApproval = POST_APPROVAL_STATUSES.includes(alloc.planStatus);
                  const caseCount = alloc.caseCount || getPlanCaseCount(alloc.planId);

                  return (
                    <tr key={alloc.allocationId}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      onClick={() => setViewDetailModal(alloc)}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{alloc.planName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge color="blue" size="xs">FY {alloc.planYear}</Badge>
                          <span className="text-xs text-gray-500">Region: {alloc.regionCode || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                          {alloc.proposedCount?.toLocaleString() || 0}
                        </span>
                        <span className="text-xs text-gray-400 block">cases</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PlanStatusBadge status={alloc.planStatus} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {alloc.acknowledged ? (
                          <div>
                            <Badge color="green" dot>Feedback Submitted</Badge>
                            {alloc.tcAdjustedCount != null && (
                              <p className="text-[11px] text-gray-500 mt-0.5">Capacity: {alloc.tcAdjustedCount} cases</p>
                            )}
                          </div>
                        ) : isPostApproval ? (
                          <Badge color="gray" size="xs">Approved / Finalized</Badge>
                        ) : (
                          <Badge color="orange" dot>Pending Feedback</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCascaded ? (
                          <Badge color="green" dot>
                            Cascaded ({caseCount} cases)
                          </Badge>
                        ) : isPostApproval ? (
                          <Badge color="yellow" dot>
                            Ready for Cascade
                          </Badge>
                        ) : (
                          <Badge color="blue">
                            Awaiting Final Approval
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="xs" variant="secondary" icon={Eye}
                            onClick={() => setViewDetailModal(alloc)}>
                            Dossier
                          </Button>
                          {!isPostApproval && !alloc.acknowledged && (
                            <Button size="xs" variant="primary" icon={Send}
                              onClick={() => openFeedback(alloc)}>
                              Feedback
                            </Button>
                          )}
                          {isPostApproval && !isCascaded && (
                            <Button size="xs" variant="success" icon={Play}
                              loading={cascading === alloc.planId}
                              onClick={() => handleCascade(alloc)}>
                              Create Cases
                            </Button>
                          )}
                          {isPostApproval && isCascaded && (
                            <>
                              <Button size="xs" variant="success" icon={Play}
                                loading={cascading === alloc.planId}
                                onClick={() => handleCascade(alloc, true)}
                                title="Re-cascade or create additional cases">
                                Re-cascade
                              </Button>
                              <Button size="xs" variant="secondary" icon={Search}
                                onClick={() => scrollToCases(alloc)}>
                                View Cases
                              </Button>
                            </>
                          )}
                          {!isPostApproval && isCascaded && (
                            <Button size="xs" variant="secondary" icon={Search}
                              onClick={() => scrollToCases(alloc)}>
                              View Cases
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tcAllocations.length === 0 && !allocationsLoading && (
        <Card>
          <Empty icon={Building2} title="No plans assigned yet" description="Plans will appear here once your regional director allocates cases to your tax center." />
        </Card>
      )}

      {allocationsLoading && (
        <Card>
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500">Loading allocations...</p>
          </div>
        </Card>
      )}

      {/* ═══ AUDIT CASES ═══ */}
      {auditCases && auditCases.totalCases > 0 && (
        <div id="audit-cases-section">
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">📊 Audit Cases — Risk Engine Cascade</h3>
                <p className="text-xs text-gray-500 mt-0.5">{auditCases.totalCases.toLocaleString()} cases generated from plan allocation via risk engine classification</p>
              </div>
              <div className="flex gap-2">
                <Badge color="green" dot>{auditCases.status === 'CASES_READY' ? 'Ready' : 'Pending'}</Badge>
                <Button size="sm" variant="secondary" icon={RefreshCw} onClick={loadCases}>Refresh</Button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-3 mb-4">
              {Object.entries(auditCases.casesByAuditType || {}).map(([auditType, count]) => (
                <div key={auditType} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{auditType.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{count.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* ── Issue Audit Cases Awaiting Directorate Decision Banner (Direct Directorate Route) ── */}
            {pendingDirectorDecisionCases.length > 0 && (
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {pendingDirectorDecisionCases.length}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                      Issue Audit Directorate Follow-Up Decisions Pending
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      {pendingDirectorDecisionCases.length} case(s) have completed Issue Team Leader technical review. Under ITAS statutory governance, your final follow-up determination is required.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-semibold"
                  onClick={() => setIssueDirectorCase(mapCaseForModal(pendingDirectorDecisionCases[0]))}
                >
                  Decide Next Case →
                </Button>
              </div>
            )}

            {/* ── Filter & Team Leader Assignment Toolbar ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[180px]">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search TIN, taxpayer, case..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCasePage(1); }}
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Audit Type Filter */}
                <select
                  value={filterAuditType}
                  onChange={(e) => { setFilterAuditType(e.target.value); setCasePage(1); }}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Audit Types</option>
                  {AUDIT_TYPES.map(at => (
                    <option key={at.id} value={at.id}>{at.name}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCasePage(1); }}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                  <option value="ASSIGNED_TO_TEAM_LEADER">Assigned to TL</option>
                  <option value="ASSIGNED_TO_COMMITTEE">Assigned to Committee</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED_TO_TC_DIRECTOR">Pending Director Decision</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                {/* Plan Year Filter */}
                <select
                  value={filterYear}
                  onChange={(e) => { setFilterYear(e.target.value); setCasePage(1); }}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availablePlanYears.map(yr => (
                    <option key={yr} value={yr}>{yr === 'ALL' ? 'All Plan Years' : `FY ${yr}`}</option>
                  ))}
                </select>
              </div>

              {/* Assignment Action */}
              <div className="flex items-center gap-2">
                {selectedCaseIds.length > 0 && (
                  <Button
                    size="xs"
                    variant="primary"
                    icon={UserCheck}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={() => handleOpenAssignModal()}
                  >
                    👤 Assign to Team Leader ({selectedCaseIds.length})
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="w-10 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedCases.length > 0 && paginatedCases.every(c => selectedCaseIds.includes(c.id || c.caseNumber))}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Case #</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Taxpayer</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Audit Type</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Year</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Risk Score</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Assigned TL</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Assigned Auditor</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedCases.map((c, idx) => {
                    const isSelected = selectedCaseIds.includes(c.id || c.caseNumber);
                    const caseYr = c.planYear || (c.caseNumber && c.caseNumber.includes('-') && !isNaN(c.caseNumber.split('-')[0]) ? c.caseNumber.split('-')[0] : 2026);
                    return (
                      <tr 
                        key={c.id || idx} 
                        className={`hover:bg-blue-50/50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                        onClick={() => setSelectedCase(mapCaseForModal(c))}
                      >
                        <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCase(c.id || c.caseNumber)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{c.caseNumber}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-gray-900 dark:text-white text-xs">{c.taxpayerName || c.taxpayerId}</p>
                          <p className="text-[11px] font-mono text-gray-400">TIN: {c.taxpayerId || c.tin}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {c.auditType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge color="blue" size="xs">FY {caseYr}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-bold ${
                            c.riskScore >= 50 ? 'text-red-600' :
                            c.riskScore >= 35 ? 'text-orange-500' :
                            c.riskScore >= 20 ? 'text-yellow-600' : 'text-green-600'
                          }`}>{c.riskScore}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge color={['COMPLETED', 'REPORT_FINALIZED'].includes(c.status) ? 'green' : ['SUBMITTED_TO_TC_DIRECTOR', 'TL_APPROVED'].includes(c.status) ? 'indigo' : c.status === 'PENDING_ASSIGNMENT' ? 'yellow' : c.status === 'IN_PROGRESS' ? 'blue' : 'purple'}>
                            {c.status?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.assignedTeamLeaderId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {(c.assignedTeamLeaderName || c.assignedTeamLeaderId).charAt(0)}
                              </span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[160px]" title={c.assignedTeamLeaderName || c.assignedTeamLeaderId}>
                                {c.assignedTeamLeaderName || c.assignedTeamLeaderId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.assignedAuditorId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {(c.assignedAuditorName || c.assignedAuditorId).charAt(0)}
                              </span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[160px]" title={c.assignedAuditorName || c.assignedAuditorId}>
                                {c.assignedAuditorName || c.assignedAuditorId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {!c.assignedTeamLeaderId && (
                              <Button
                                size="xs"
                                variant="secondary"
                                icon={UserCheck}
                                onClick={() => handleOpenAssignModal([c])}
                              >
                                Assign TL
                              </Button>
                            )}
                            {['ISSUE', 'ISSUE_AUDIT', 'issue_audit'].includes((c.auditType || '').toUpperCase()) && (
                              <Button 
                                size="xs" 
                                variant="primary" 
                                icon={Shield} 
                                className={`${
                                  ['SUBMITTED_TO_TC_DIRECTOR', 'TL_APPROVED'].includes(c.status)
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold'
                                    : 'bg-slate-700 hover:bg-slate-800 text-white'
                                }`}
                                onClick={() => setIssueDirectorCase(mapCaseForModal(c))}
                              >
                                {['SUBMITTED_TO_TC_DIRECTOR', 'TL_APPROVED'].includes(c.status)
                                  ? '⚡ Directorate Decision'
                                  : 'Director Review'}
                              </Button>
                            )}
                            <Button 
                              size="xs" 
                              variant="secondary" 
                              icon={Eye} 
                              onClick={() => setSelectedCase(mapCaseForModal(c))}
                            >
                              View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={casePage}
              totalPages={totalFilteredPages}
              totalItems={totalFilteredCount}
              itemsPerPage={caseItemsPerPage}
              onPageChange={setCasePage}
              onItemsPerPageChange={(newVal) => { setCaseItemsPerPage(newVal); setCasePage(1); }}
            />
          </div>
        </Card>
        </div>
      )}

      {auditCases && auditCases.totalCases === 0 && (
        <Card>
          <Empty icon={AlertTriangle} title="No audit cases yet"
            description="Click 'Create Cases' on a pending plan to fetch taxpayers, run risk engine classification, and generate audit cases." />
        </Card>
      )}

      {/* ═══ CASCADE SUCCESS MODAL ═══ */}
      <Modal open={cascadeModal} onClose={() => { setCascadeModal(false); window.location.reload(); }}
        title="✅ Case Cascade Complete" size="lg"
        footer={<Button variant="primary" onClick={() => { setCascadeModal(false); window.location.reload(); }}>Done</Button>}>
        {cascadeResult && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">
                {cascadeResult.totalCasesCreated > 0 ? `${cascadeResult.totalCasesCreated} Audit Cases Created` : `${cascadeResult.totalCases || 'All'} Audit Cases Active`}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Plan "{cascadeResult.planName}" (FY {cascadeResult.planYear}) cascaded through the risk engine.
              </p>
              {cascadeResult.previousCasesPreserved > 0 && (
                <p className="text-xs text-blue-600 mt-1">🛡️ {cascadeResult.previousCasesPreserved} existing audit cases active & preserved</p>
              )}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-green-700 font-medium">Plan:</p><p className="font-bold">{cascadeResult.planName}</p></div>
                <div><p className="text-green-700 font-medium">Tax Centers:</p><p className="font-bold">{cascadeResult.taxCentersProcessed || 0}</p></div>
                <div><p className="text-green-700 font-medium">Status:</p><Badge color="green" dot>{cascadeResult.status}</Badge></div>
                <div><p className="text-green-700 font-medium">Plan Year:</p><p className="font-bold">FY {cascadeResult.planYear}</p></div>
              </div>
              {cascadeResult.casesByAuditType && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2">Cases by Audit Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(cascadeResult.casesByAuditType).map(([type, count]) => (
                      <Badge key={type} color="blue">{type.replace(/_/g, ' ')}: {count}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {cascadeResult.casesByTeamLeader && Object.keys(cascadeResult.casesByTeamLeader).length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">👤 Auto-Assigned Team Leaders:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(cascadeResult.casesByTeamLeader).map(([tlId, count]) => (
                    <div key={tlId} className="flex justify-between">
                      <span className="text-gray-600">{tlId}</span>
                      <span className="font-bold text-blue-700">{count} cases</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Alert type="info" title="What happens next?">
              Cases have been auto-assigned to team leaders (by audit type) and are ready for further assignment to auditors.
            </Alert>
          </div>
        )}
      </Modal>

      {/* ═══ ENTERPRISE CAPACITY FEEDBACK & ALLOCATION MODAL ═══ */}
      <TaxCenterCapacityFeedbackModal
        open={!!feedbackModal}
        allocation={feedbackModal}
        taxCenter={taxCenter}
        user={user}
        onClose={() => setFeedbackModal(null)}
        onSuccess={loadTcAllocations}
      />

      {/* ═══ VIEW DETAIL MODAL ═══ */}
      <Modal
        open={!!viewDetailModal}
        onClose={() => setViewDetailModal(null)}
        title="Plan Allocation & Cascade Dossier"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setViewDetailModal(null)}>Close</Button>
            {POST_APPROVAL_STATUSES.includes(viewDetailModal?.planStatus) && !(viewDetailModal?.cascaded || planHasCases(viewDetailModal?.planId)) && (
              <Button
                variant="success"
                icon={Play}
                loading={cascading === viewDetailModal?.planId}
                onClick={() => { handleCascade(viewDetailModal); setViewDetailModal(null); }}
              >
                Execute Case Cascade
              </Button>
            )}
            {POST_APPROVAL_STATUSES.includes(viewDetailModal?.planStatus) && (viewDetailModal?.cascaded || planHasCases(viewDetailModal?.planId)) && (
              <Button
                variant="success"
                icon={Play}
                loading={cascading === viewDetailModal?.planId}
                onClick={() => { handleCascade(viewDetailModal, true); setViewDetailModal(null); }}
              >
                Re-execute Cascade
              </Button>
            )}
            {!POST_APPROVAL_STATUSES.includes(viewDetailModal?.planStatus) && !viewDetailModal?.acknowledged && (
              <Button
                variant="primary"
                icon={Send}
                onClick={() => { const target = viewDetailModal; setViewDetailModal(null); openFeedback(target); }}
              >
                Submit Capacity Feedback
              </Button>
            )}
            {(viewDetailModal?.cascaded || planHasCases(viewDetailModal?.planId)) && (
              <Button
                variant="secondary"
                icon={Search}
                onClick={() => { const target = viewDetailModal; setViewDetailModal(null); scrollToCases(target); }}
              >
                View Cases
              </Button>
            )}
          </div>
        }
      >
        {viewDetailModal && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/60 rounded-xl p-4 border border-blue-100 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {viewDetailModal.planName}
                    </h3>
                    <Badge color="blue" size="xs">FY {viewDetailModal.planYear}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Region: <strong className="text-gray-700 dark:text-gray-300">{viewDetailModal.regionCode || 'N/A'}</strong> • Branch: <strong className="text-gray-700 dark:text-gray-300 uppercase">{(taxCenter || '').replace(/-/g, ' ')}</strong>
                  </p>
                </div>
                {viewDetailModal.cascaded || planHasCases(viewDetailModal.planId) ? (
                  <Badge color="green" dot>Cases Active ({viewDetailModal.caseCount || getPlanCaseCount(viewDetailModal.planId)})</Badge>
                ) : POST_APPROVAL_STATUSES.includes(viewDetailModal.planStatus) ? (
                  <Badge color="yellow" dot>Ready for Cascade</Badge>
                ) : viewDetailModal.acknowledged ? (
                  <Badge color="blue" dot>Feedback Submitted</Badge>
                ) : (
                  <Badge color="orange" dot>Pending Feedback</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Allocated Cases</span>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  {viewDetailModal.proposedCount?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Execution Readiness</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {viewDetailModal.cascaded || planHasCases(viewDetailModal.planId) ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={14} /> Cases Generated & Active ({viewDetailModal.caseCount || getPlanCaseCount(viewDetailModal.planId)})
                    </span>
                  ) : POST_APPROVAL_STATUSES.includes(viewDetailModal.planStatus) ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Play size={14} /> Ready for Risk Engine Cascade
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Clock size={14} /> Awaiting Final Regional Approval
                    </span>
                  )}
                </p>
              </div>
            </div>

            {viewDetailModal.allocationsByAuditType && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Allocation Breakdown by Stream
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {AUDIT_TYPES.map(at => {
                    const count = viewDetailModal.allocationsByAuditType?.[at.id] ||
                                  viewDetailModal.allocationsByAuditType?.[at.id.toUpperCase()] || 0;
                    return (
                      <div key={at.id} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-2.5 text-center border border-gray-200 dark:border-slate-700">
                        <Badge color={at.color} size="xs" className="mb-1">{at.shortName}</Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{at.name}</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{count.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══ DETAILED TAXPAYER & AUDIT PROFILE MODAL ═══ */}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      {/* ═══ ISSUE AUDIT DIRECTORATE FOLLOW-UP DECISION MODAL (NO COMMITTEE) ═══ */}
      {issueDirectorCase && (
        <IssueDirectorReviewModal
          caseData={issueDirectorCase}
          user={user}
          onClose={() => setIssueDirectorCase(null)}
          onRefresh={loadCases}
        />
      )}

      {/* ═══ TAX CENTER TEAM LEADER ASSIGNMENT MODAL ═══ */}
      <TaxCenterTeamLeaderAssignModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setCasesToAssign([]);
        }}
        selectedCases={casesToAssign}
        taxCenter={taxCenter}
        user={user}
        onSuccess={() => {
          setSelectedCaseIds([]);
          loadCases();
        }}
      />
    </div>
  );
}
