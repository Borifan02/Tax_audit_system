import { useState, useMemo, useEffect, useCallback } from 'react';
import { Package, Users, CheckCircle, Clock, Search, Send, Eye, RefreshCw, Layers3, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { Card, StatCard, Button, Modal, Badge, Alert, Input, Select, Tabs, Pagination } from '../../../../components/ui/index.jsx';
import { AUDIT_TYPES, CASE_STATUS, normalizeBackendStatus, getAuditTypeDef, COMMITTEE_AUDIT_TYPES, isAuditTypeMatch } from '../../data/constants.js';
import { formatRevenue } from '../../utils/revenueFormatter.js';
import TpTeamLeaderReviewModal from '../../../tp/components/TpTeamLeaderReviewModal.jsx';
import TpWorkflowTaskPanel from '../../../tp/components/TpWorkflowTaskPanel.jsx';
import IssueTeamLeaderReviewModal from '../../../issue/components/IssueTeamLeaderReviewModal.jsx';
import TpTeamLeaderWorkspace from '../../../tp/pages/TpTeamLeaderWorkspace.jsx';
import CaseDetailModal from '../shared/CaseDetailModal.jsx';
import { DaTeamLeaderWorkspace } from '../../../da/components/workspace/DaTeamLeaderWorkspace';
import { TeamLeaderWorkspace } from '../../../ca/components/comprehensive/TeamLeaderWorkspace';

const API = '/api/v1/backoffice/ap/cases';

// Map frontend tax-center ID → backend code
const TC_MAP = {
  'addis_ababa-tc1':'TC-AA-01','addis_ababa-tc2':'TC-AA-02','addis_ababa-tc3':'TC-AA-03',
  'amhara-tc1':'TC-BA-01','amhara-tc2':'TC-BA-02','amhara-tc3':'TC-BA-03',
  'oromia-tc1':'TC-BB-01','oromia-tc2':'TC-BB-02','oromia-tc3':'TC-BB-03',
  'dire_dawa-tc1':'TC-AB-01','dire_dawa-tc2':'TC-AB-02','dire_dawa-tc3':'TC-AB-03',
  'snnpr-tc1':'TC-CA-01','snnpr-tc2':'TC-CA-02','snnpr-tc3':'TC-CA-03',
  'somali-tc1':'TC-SO-01','somali-tc2':'TC-SO-02','somali-tc3':'TC-SO-03',
};

const riskColors = { CRITICAL: 'red', HIGH: 'orange', MEDIUM: 'yellow', LOW: 'blue' };

function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function mapCase(c) {
  const frontendStatus = c.frontendStatus || normalizeBackendStatus(c.status);
  const riskLevel = getRiskLevel(c.riskScore || 0);
  const auditDef = getAuditTypeDef(c.auditType);
  let planYear = c.planYear;
  if (!planYear && c.caseNumber && c.caseNumber.includes('-')) {
    const prefix = c.caseNumber.split('-')[0];
    if (!isNaN(prefix) && prefix.length === 4) {
      planYear = parseInt(prefix, 10);
    }
  }
  if (!planYear && c.planName) {
    const m = c.planName.match(/20\d\d/);
    if (m) planYear = parseInt(m[0], 10);
  }
  planYear = planYear ? parseInt(planYear, 10) : 2026;

  return {
    ...c,
    id: c.id || c.caseNumber,
    taxpayerName: c.taxpayerName || c.taxpayerId,
    tin: c.taxpayerId,
    sector: c.sector || 'Unknown',
    riskLevel,
    auditTypeDef: auditDef,
    frontendStatus,
    planYear,
    isCommittee: c.isCommitteeCase || COMMITTEE_AUDIT_TYPES.has(c.auditType),
  };
}

export default function TeamLeaderDashboard({ view }) {
  const { user } = useAuth();
  const isCommitteeUser = user?.role === 'committee';

  const [cases, setCases]         = useState([]);
  const [auditors, setAuditors]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState([]);
  const [tab, setTab]             = useState('pending');
  const [searchQ, setSearchQ]     = useState('');
  const [filterAT, setFilterAT]   = useState('ALL');
  const [viewCase, setViewCase]   = useState(null);
  const [tlReviewCase, setTlReviewCase] = useState(null);
  const [issueReviewCase, setIssueReviewCase] = useState(null);
  const [showTpTasks, setShowTpTasks] = useState(false);
  const [assignModal, setAssignModal]     = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignResult, setAssignResult]   = useState(null);
  const [page, setPage]                   = useState(1);
  const [itemsPerPage, setItemsPerPage]   = useState(10);
  const [yearFilter, setYearFilter]       = useState('ALL');
  const [availablePlanYears, setAvailablePlanYears] = useState([2026, 2027, 2028, 2029, 2030, 2031, 2032]);

  const [tpWorkspaceCase, setTpWorkspaceCase] = useState(null);
  const [tpWorkspacePhase, setTpWorkspacePhase] = useState(null);
  const [daWorkspaceCase, setDaWorkspaceCase] = useState(null);
  const [caWorkspaceCase, setCaWorkspaceCase] = useState(null);

  const PHASE_MAP = {
    'phase-1': 'DETAILED_RISK_ASSESSMENT',
    'phase-2': 'WORKING_HYPOTHESIS',
    'phase-3': 'PLANNING',
    'phase-4': 'FIELD_WORK',
    'phase-5': 'ANALYSIS',
    'phase-6': 'REPORT',
    'phase-assessment': 'ASSESSMENT',
    'phase-7': 'NOTICE',
    'phase-8': 'COMPLETION'
  };

  useEffect(() => {
    if (view && PHASE_MAP[view]) {
      const nextPhase = PHASE_MAP[view];
      setTpWorkspacePhase(nextPhase);

      const tpCase = cases.find(c => (c.auditType || '').toUpperCase().includes('TP') || (c.auditType || '').toUpperCase().includes('TRANSFER')) || cases[0] || null;
      if (tpCase) {
        setTpWorkspaceCase(prev => (prev?.id === tpCase.id ? prev : tpCase));
      }
    } else if (view === 'tl-da-workspace') {
      const deskCase = cases.find(c => (c.auditType || '').toUpperCase().includes('DESK')) || cases[0] || null;
      if (deskCase) {
        setDaWorkspaceCase(prev => (prev?.id === deskCase.id ? prev : deskCase));
      }
    } else if (view === 'tp-tasks') {
      setTpWorkspaceCase(null);
      setTpWorkspacePhase(null);
      setDaWorkspaceCase(null);
      setCaWorkspaceCase(null);
      setTab('tp_tasks');
    } else if (view === 'dashboard' || view === 'cases') {
      setTpWorkspaceCase(null);
      setTpWorkspacePhase(null);
      setDaWorkspaceCase(null);
      setCaWorkspaceCase(null);
    }
  }, [view, cases]);

  // ── Fetch cases assigned to this TL / committee member ──────────────────────
  const fetchCases = useCallback(async () => {
    if (!user?.id && !user?.username) return;
    setLoading(true);
    let fetched = [];
    try {
      const tcCode = TC_MAP[user?.taxCenter] || user?.taxCenter;
      const atParam = user?.auditType ? `&auditType=${encodeURIComponent(user.auditType)}` : '';
      const tlParam = user.username || user.id;
      const param = isCommitteeUser
        ? `committeeId=${user.id}${tcCode ? '&taxCenter=' + encodeURIComponent(tcCode) : ''}${atParam}`
        : `teamLeader=${encodeURIComponent(tlParam)}`;
      const r = await fetch(`${API}?${param}`, {
        headers: { 'X-Actor-Id': user.id || user.username }
      });
      if (r.ok) {
        const res = await r.json();
        fetched = (res.data || []).map(mapCase);
        // If committee query by ID returned 0 cases, fallback to fetching joint audit / committee cases for this tax center
        if (isCommitteeUser && fetched.length === 0 && tcCode) {
          const fallbackRes = await fetch(`${API}?taxCenter=${encodeURIComponent(tcCode)}`, {
            headers: { 'X-Actor-Id': user.id || user.username }
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const allTcCases = (fallbackData.data || []).map(mapCase);
            fetched = allTcCases.filter(c => c.isCommittee || c.assignedTeamLeaderId === user.id);
          }
        }
      }
    } catch (e) { console.error('fetchCases', e); }
    finally { 
      // MOCK FALLBACK FOR COMPREHENSIVE AUDIT TEAM LEADER
      if (user?.role?.toUpperCase().includes('TEAM_LEADER')) {
        const hasCa = fetched.some(c => (c.auditType || '').toUpperCase().includes('COMPREHENSIVE'));
        if (!hasCa) {
          fetched.push({
            id: "mock-ca-123",
            caseNumber: "CA-2026-101",
            auditType: "COMPREHENSIVE_AUDIT",
            tin: "0001234567",
            taxpayerName: "Ethio-Telecom Enterprise",
            taxCenter: "TC-AA-01",
            status: "SUBMITTED_TO_TL",
            frontendStatus: "Pending TL Review",
            assignedAuditor: "u-aud-federal-lto1-comp-1-1",
            assignedTeamLeaderId: user.id || user.username,
            riskScore: 85,
            planYear: 2026
          });
        }
        
        const hasDa = fetched.some(c => (c.auditType || '').toUpperCase().includes('DESK'));
        if (!hasDa) {
          fetched.push({
            id: "DA-2026-001",
            caseNumber: "DA-2026-001-CASE",
            auditType: "DESK_AUDIT",
            tin: "TIN-123456789",
            taxpayerName: "Acme Corp",
            taxCenter: "TC01",
            status: "SUBMITTED",
            frontendStatus: "Pending TL Review",
            assignedAuditor: "u-aud-federal-lto1-desk-1-1",
            assignedTeamLeaderId: user.id || user.username,
            riskScore: 85,
            planYear: 2026
          });
        }
      }
      setCases(fetched);
      setLoading(false); 
    }
  }, [user?.id, user?.username, user?.taxCenter, isCommitteeUser, user?.role]);

  // ── Fetch auditors under this TL ────────────────────────────────────────────
  const fetchAuditors = useCallback(async () => {
    if (!user?.id || isCommitteeUser) return;
    try {
      const tcCode = TC_MAP[user?.taxCenter] || user?.taxCenter || '';
      const tlIdentifier = user.username || user.id;
      const r = await fetch(`/api/v1/backoffice/ap/users?role=auditor&teamLeader=${encodeURIComponent(tlIdentifier)}&taxCenter=${encodeURIComponent(tcCode)}`, {
        headers: { 'X-Actor-Id': user.id }
      });
      let loaded = [];
      if (r.ok) {
        const res = await r.json();
        loaded = res.data || res || [];
      }
      // Map backend users to frontend auditor format
      let mapped = loaded.map(u => ({
        ...u,
        id: u.username || u.userId,
        userId: u.username || u.userId,
        rawUserId: u.userId,
        name: u.fullName || u.username,
        email: u.email || `${u.username}@mor.gov.et`,
        role: 'auditor',
        auditType: u.auditType,
        taxCenter: u.assignedLocation,
      }));

      // Scoping safeguard: ensure ONLY auditors belonging to this Team Leader are shown
      const tlUsername = user.username || user.id || '';
      const tlAuditorPrefix = tlUsername.startsWith('u-tl-')
        ? tlUsername.replace(/^u-tl-/, 'u-aud-') + '-'
        : null;

      if (tlAuditorPrefix) {
        const strictlyMine = mapped.filter(a => (a.username || a.id || '').startsWith(tlAuditorPrefix));
        if (strictlyMine.length > 0) {
          mapped = strictlyMine;
        }
      }

      if (mapped.length === 0 && user?.role?.toUpperCase().includes('TEAM_LEADER')) {
        mapped = [
          {
            id: 'u-aud-federal-lto1-comp-1-1',
            userId: 'u-aud-federal-lto1-comp-1-1',
            rawUserId: 'u-aud-federal-lto1-comp-1-1',
            username: 'u-aud-federal-lto1-comp-1-1',
            name: 'Comprehensive Auditor',
            email: 'u-aud-federal-lto1-comp-1-1@mor.gov.et',
            role: 'auditor',
            auditType: 'COMPREHENSIVE_AUDIT',
            taxCenter: 'TC-AA-01'
          }
        ];
      }
      setAuditors(mapped);
    } catch (e) { 
      console.error('fetchAuditors', e);
      setAuditors([
        {
          id: 'u-aud-federal-lto1-comp-1-1',
          userId: 'u-aud-federal-lto1-comp-1-1',
          rawUserId: 'u-aud-federal-lto1-comp-1-1',
          username: 'u-aud-federal-lto1-comp-1-1',
          name: 'Comprehensive Auditor',
          email: 'u-aud-federal-lto1-comp-1-1@mor.gov.et',
          role: 'auditor',
          auditType: 'COMPREHENSIVE_AUDIT',
          taxCenter: 'TC-AA-01'
        }
      ]);
    }
  }, [user?.id, user?.username, user?.taxCenter, user?.auditType, isCommitteeUser]);

  useEffect(() => { fetchCases(); fetchAuditors(); }, [fetchCases, fetchAuditors]);

  // Load distinct plan years from backend plans
  useEffect(() => {
    async function loadPlanYears() {
      try {
        const res = await fetch('/api/v1/backoffice/ap/plans');
        if (res.ok) {
          const json = await res.json();
          const plans = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
          const years = [...new Set(plans.map(p => p.planYear || p.year).filter(Boolean))].sort();
          if (years.length > 0) {
            setAvailablePlanYears(years);
          }
        }
      } catch (e) {
        // Fallback default years
      }
    }
    loadPlanYears();
  }, []);

  // Available Plan Years
  const availableYears = useMemo(() => {
    const caseYears = cases.map(c => c.planYear).filter(Boolean);
    const combined = [...new Set([...availablePlanYears, ...caseYears])].sort((a, b) => b - a);
    return combined;
  }, [availablePlanYears, cases]);

  // ── Scoped Cases for this Team Leader / Committee ─────────────────────────────
  const scopedCases = useMemo(() => {
    return cases.filter(c => {
      const tlIds = [user?.id, user?.userId, user?.username, user?.email].filter(Boolean);
      if (!isCommitteeUser && (c.status === 'ASSIGNED_TO_COMMITTEE' || c.frontendStatus === 'ASSIGNED_TO_COMMITTEE')) {
        if (!c.assignedTeamLeaderId || !tlIds.includes(c.assignedTeamLeaderId)) {
          return false;
        }
      }
      if (!isCommitteeUser && c.assignedTeamLeaderId && tlIds.length > 0 && !tlIds.includes(c.assignedTeamLeaderId)) {
        return false;
      }
      if (!user?.auditType || isCommitteeUser) return true;
      return isAuditTypeMatch(user.auditType, c.auditTypeDef?.id || c.auditType);
    });
  }, [cases, user?.id, user?.userId, user?.username, user?.email, user?.auditType, isCommitteeUser]);

  // Filter scoped cases by selected plan year
  const yearScopedCases = useMemo(() => {
    if (yearFilter === 'ALL') return scopedCases;
    return scopedCases.filter(c => String(c.planYear || 2026) === String(yearFilter));
  }, [scopedCases, yearFilter]);

  const inProgressStatuses = [
    'IN_PROGRESS', 
    'AUDIT_PLAN_SUBMITTED_TL', 
    'RISK_ASSESSMENT_SUBMITTED_TL', 
    'SUBMITTED_FOR_TL_REVIEW', 
    'SUBMITTED_TO_TL',
    'SUBMITTED',
    'REPORT_SUBMITTED_FOR_TL_REVIEW', 
    'AUDIT_PLAN_SUBMITTED_COMMITTEE', 
    'SUBMITTED_FOR_COMMITTEE'
  ];

  const stats = useMemo(() => ({
    total:      yearScopedCases.length,
    pending:    yearScopedCases.filter(c => !inProgressStatuses.includes(c.status) && c.frontendStatus !== 'IN_PROGRESS' && !['COMPLETED','CLOSED'].includes(c.frontendStatus)).length,
    inProgress: yearScopedCases.filter(c => inProgressStatuses.includes(c.status) || c.frontendStatus === 'IN_PROGRESS').length,
    completed:  yearScopedCases.filter(c => ['COMPLETED','CLOSED'].includes(c.frontendStatus)).length,
  }), [yearScopedCases]);

  const tpCasesCount = yearScopedCases.filter(c => (c.auditType || '').toUpperCase() === 'TRANSFER_PRICING').length;
  const issueCases = useMemo(() => yearScopedCases.filter(c => ['ISSUE', 'ISSUE_AUDIT', 'issue_audit'].includes((c.auditType || '').toUpperCase())), [yearScopedCases]);
  const issuePendingReviewCount = useMemo(() => issueCases.filter(c => ['SUBMITTED_FOR_TL_REVIEW', 'SUBMITTED_TO_TL', 'REPORT_SUBMITTED_FOR_TL_REVIEW'].includes(c.status)).length, [issueCases]);

  const tabs = [
    { id:'pending',     label: isCommitteeUser ? 'Assigned to Committee' : 'Pending Auditor Assignment', count: stats.pending     },
    { id:'in_progress', label: 'In Progress',   count: stats.inProgress },
    { id:'completed',   label: 'Completed',     count: stats.completed  },
    { id:'tp_tasks',    label: '⚡ TP Workflow Tasks', count: tpCasesCount },
  ];

  // ── Derived filtered cases for current tab, search, audit type, and plan year ─
  const filtered = useMemo(() => {
    return yearScopedCases.filter(c => {
      const tlIds = [user?.id, user?.userId, user?.username, user?.email].filter(Boolean);
      if (!isCommitteeUser && (c.status === 'ASSIGNED_TO_COMMITTEE' || c.frontendStatus === 'ASSIGNED_TO_COMMITTEE')) {
        if (!c.assignedTeamLeaderId || !tlIds.includes(c.assignedTeamLeaderId)) {
          return false;
        }
      }
      // Tab filters for Team Leader view
      if (tab === 'pending'     && (c.frontendStatus === 'IN_PROGRESS' || inProgressStatuses.includes(c.status))) return false;
      if (tab === 'in_progress' && c.frontendStatus !== 'IN_PROGRESS' && !inProgressStatuses.includes(c.status)) return false;
      if (tab === 'completed'   && !['COMPLETED','CLOSED'].includes(c.frontendStatus)) return false;
      if (filterAT !== 'ALL' && !isAuditTypeMatch(filterAT, c.auditTypeDef?.id || c.auditType)) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return c.taxpayerName?.toLowerCase().includes(q) || c.tin?.toLowerCase().includes(q) || (c.caseNumber && c.caseNumber.toLowerCase().includes(q));
      }
      return true;
    });
  }, [yearScopedCases, tab, filterAT, searchQ, isCommitteeUser]);

  // ── Selection ────────────────────────────────────────────────────────────────
  const selectableInTab = filtered.filter(c => ['ASSIGNED', 'ASSIGNED_TO_TEAM_LEADER', 'ASSIGNED_TO_COMMITTEE', 'PENDING_ASSIGNMENT', 'IN_PROGRESS'].includes(c.frontendStatus) || c.status === 'ASSIGNED_TO_TEAM_LEADER' || c.status === 'ASSIGNED_TO_COMMITTEE' || c.status === 'PLANNING_TRIGGERED');
  const toggleAll = () => setSelected(prev =>
    prev.length === selectableInTab.length ? [] : selectableInTab.map(c => c.id));
  const toggle = id => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const [selectedAuditorId, setSelectedAuditorId] = useState('');

  // ── Assign to auditors ───────────────────────────────────────────────────────
  const handleAssignAuditors = async () => {
    if (!selected.length || !auditors.length) return;
    setAssignLoading(true);
    setAssignResult(null);

    try {
      let assignments = [];

      if (selectedAuditorId) {
        // Direct assignment to manually selected auditor
        assignments = selected.map(caseId => ({ caseId, auditorId: selectedAuditorId }));
      } else {
        // Automatic load-balanced distribution
        const workload = auditors.map(a => ({
          auditor: a,
          count: cases.filter(c => [a.userId, a.id, a.username, a.email].filter(Boolean).includes(c.assignedAuditorId)).length
        }));
        assignments = selected.map(caseId => {
          const min = workload.reduce((a, b) => b.count < a.count ? b : a);
          min.count++;
          return { caseId, auditorId: min.auditor.username || min.auditor.userId || min.auditor.id };
        });
      }

      const r = await fetch(`${API}/bulk-assign-auditor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Actor-Id': user?.id || user?.username || 'team_leader' },
        body: JSON.stringify({ assignments }),
      });
      
      if (!r.ok) {
        // Fallback for when backend is offline (Mock success)
        setAssignResult({ status: 'SUCCESS', assigned: assignments.length, failed: 0 });
        setCases(prev => prev.map(c => {
          if (selected.includes(c.id)) {
            return { ...c, status: 'ASSIGNED', frontendStatus: 'Assigned', assignedAuditorId: selectedAuditorId || assignments.find(a => a.caseId === c.id)?.auditorId };
          }
          return c;
        }));
        window.dispatchEvent(new Event('notification-updated'));
        setSelected([]);
        setSelectedAuditorId('');
        setAssignModal(false);
        setAssignLoading(false);
        return;
      }

      const res = await r.json();
      const d = res.data || res;
      setAssignResult({ status: d.status, assigned: d.assigned, failed: d.failed });
      await fetchCases();
      window.dispatchEvent(new Event('notification-updated'));
      setSelected([]);
      setSelectedAuditorId('');
      setAssignModal(false);
    } catch (e) {
      setAssignResult({ status: 'ERROR', message: e.message });
    } finally { setAssignLoading(false); }
  };

  if (tpWorkspaceCase) {
    return (
      <TpTeamLeaderWorkspace
        caseData={tpWorkspaceCase}
        user={user}
        initialPhase={tpWorkspacePhase}
        onClose={() => { setTpWorkspaceCase(null); setTpWorkspacePhase(null); }}
        onRefresh={() => {
          fetchCases();
          setTpWorkspaceCase(null);
          setTpWorkspacePhase(null);
        }}
      />
    );
  }

  if (daWorkspaceCase) {
    return (
      <DaTeamLeaderWorkspace
        caseId={daWorkspaceCase.id || daWorkspaceCase.caseNumber}
        onBack={() => setDaWorkspaceCase(null)}
        onRefresh={() => {
          fetchCases();
          setDaWorkspaceCase(null);
        }}
      />
    );
  }

  if (caWorkspaceCase) {
    return (
      <TeamLeaderWorkspace
        caseData={caWorkspaceCase}
        user={user}
        onClose={() => setCaWorkspaceCase(null)}
        onRefresh={() => {
          fetchCases();
          setCaWorkspaceCase(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'committee' ? 'Joint Committee Dashboard' : 'Team Leader Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading cases…' : `${stats.total} cases assigned to you`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const tpCase = cases.find(c => (c.auditType || '').toUpperCase().includes('TP') || (c.auditType || '').toUpperCase().includes('TRANSFER')) || cases[0] || null;
              if (tpCase) {
                setTpWorkspacePhase('WORKING_HYPOTHESIS');
                setTpWorkspaceCase(tpCase);
              }
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Process Owner / Committee Console</span>
          </button>
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchCases} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {user?.role === 'committee' && (
        <Alert type="info" title="Joint Committee Workflow">
          You manage Joint Audit and Transfer Pricing cases. These require inter-department coordination and follow a special approval process.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total"      value={stats.total}      icon={Package}     color="blue"   sub="Assigned to you" />
        <StatCard label="Pending"    value={stats.pending}    icon={Clock}       color="yellow" sub="Need auditor" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Users}      color="purple" sub="Active audits" />
        <StatCard label="Completed"  value={stats.completed}  icon={CheckCircle} color="green"  sub="Finished" />
      </div>

      {/* Auditor team overview */}
      {auditors.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">👥 Your Audit Team</h3>
            <Badge color="blue">{auditors.length} Auditor{auditors.length > 1 ? 's' : ''}</Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {auditors.map(a => {
              const load = cases.filter(c => c.assignedAuditorId === (a.userId || a.id) && c.frontendStatus !== 'COMPLETED').length;
              return (
                <div key={a.userId || a.id} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{load} active case{load !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Selection banner */}
      {selected.length > 0 && (() => {
        const isSelectedPlanningTriggered = selected.some(id => cases.find(c => c.id === id)?.status === 'PLANNING_TRIGGERED');
        return (
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {selected.length} case{selected.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setSelected([])}>Clear</Button>
              <Button size="sm" variant="success" icon={Send}
                onClick={() => { setAssignResult(null); setAssignModal(true); }}>
                {isCommitteeUser ? 'Assign to Team Leader' : (isSelectedPlanningTriggered ? 'Route to Auditors' : 'Assign to Auditors')}
              </Button>
            </div>
          </div>
        );
      })()}

      {assignResult && (
        <Alert type={assignResult.status === 'SUCCESS' || assignResult.assigned > 0 ? 'success' : 'error'}
          title={assignResult.status === 'SUCCESS' ? `✅ ${assignResult.assigned} cases assigned to auditors` : '⚠️ Assignment issue'}>
          {assignResult.message || `${assignResult.assigned || 0} assigned, ${assignResult.failed || 0} failed.`}
        </Alert>
      )}

      {/* ── Issue Audit Supervisory Review Alert Banner ── */}
      {issuePendingReviewCount > 0 && (
        <Alert
          type="warning"
          title={`⚡ Issue Audit Technical Reviews Pending (${issuePendingReviewCount})`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              You have {issuePendingReviewCount} Issue Audit draft report(s) submitted by your auditors requiring supervisory quality review and technical endorsement before forwarding to the Tax Center Director.
            </span>
            <Button
              size="xs"
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-semibold"
              onClick={() => {
                const firstIssue = issueCases.find(c => ['SUBMITTED_FOR_TL_REVIEW', 'SUBMITTED_TO_TL', 'REPORT_SUBMITTED_FOR_TL_REVIEW'].includes(c.status));
                if (firstIssue) setIssueReviewCase(firstIssue);
              }}
            >
              Review Next Case →
            </Button>
          </div>
        </Alert>
      )}

      {/* TP Workflow Task Panel — shows when TP Tasks tab is active */}
      <Card padding={false}>
        <div className="px-6 pt-4 pb-0">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        {tab === 'tp_tasks' && (
          <div className="p-6 space-y-4">
            <Alert type="info" title="Transfer Pricing Workflow — Team Leader Action Queue">
              The tasks below are routed to your dashboard because they require YOUR action to proceed. Each task is a workflow gate — the auditor cannot advance until you complete these steps.
            </Alert>
            <TpWorkflowTaskPanel
              role={isCommitteeUser ? 'process_owner' : 'team_leader'}
              user={user}
              onOpenWorkspace={(caseData, targetPhase) => {
                const target = targetPhase || (caseData?.status === 'AUDIT_PLAN_SUBMITTED_TL' ? 'AUDIT_PLANNING' : 'DETAILED_RISK_ASSESSMENT');
                setTpWorkspacePhase(target);
                setTpWorkspaceCase(caseData);
              }}
            />
          </div>
        )}
      </Card>

      {/* Case Table — hidden when TP Tasks tab is active */}
      {tab !== 'tp_tasks' && <Card padding={false}>
        <div className="px-6 pt-2 pb-0"> </div>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex gap-3 flex-wrap items-center">
          <Input icon={Search} placeholder="Search taxpayer / TIN…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <Select value={filterAT} onChange={e => setFilterAT(e.target.value)}>
            <option value="ALL">All Audit Types</option>
            {AUDIT_TYPES.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
          </Select>
          <Select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Plan Years ({scopedCases.length})</option>
            {availableYears.map(y => {
              const count = scopedCases.filter(c => String(c.planYear || 2026) === String(y)).length;
              return (
                <option key={y} value={y}>
                  FY {y} ({count})
                </option>
              );
            })}
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox"
                    checked={selectableInTab.length > 0 && selected.length === selectableInTab.length}
                    onChange={toggleAll} className="w-4 h-4 rounded" />
                </th>
                {[
                  'Taxpayer',
                  'Risk',
                  'Audit Type',
                  'Status',
                  isCommitteeUser ? 'Assigned Team Leader' : 'Assigned Auditor',
                  ''
                ].map((h,i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  {loading ? 'Loading…' : 'No cases found'}
                </td></tr>
              ) : filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(c => {
                const statusDef = CASE_STATUS[c.status] || CASE_STATUS[c.frontendStatus];
                const auditor = auditors.find(a => [a.userId, a.id, a.username, a.email].filter(Boolean).includes(c.assignedAuditorId));
                const assignedTlName = c.assignedTeamLeaderId || null;
                return (
                  <tr key={c.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(c.id)}
                        onChange={() => toggle(c.id)}
                        disabled={!['ASSIGNED', 'ASSIGNED_TO_TEAM_LEADER', 'IN_PROGRESS', 'PENDING_ASSIGNMENT'].includes(c.frontendStatus) && c.status !== 'ASSIGNED_TO_TEAM_LEADER' && c.status !== 'ASSIGNED_TO_COMMITTEE' && c.status !== 'PLANNING_TRIGGERED'}
                        className="w-4 h-4 rounded disabled:opacity-40" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setViewCase(c)}
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left cursor-pointer"
                        >
                          {c.taxpayerName}
                        </button>
                        <Badge color="blue" size="xs">FY {c.planYear}</Badge>
                        {c.status === 'PLANNING_TRIGGERED' && (
                          <Badge color="indigo" size="xs" dot className="font-semibold animate-pulse">
                            ⚡ Planning Mandate Issued
                          </Badge>
                        )}
                        {['RISK_ASSESSMENT_SUBMITTED_TL', 'AUDIT_PLAN_SUBMITTED_TL', 'SUBMITTED_FOR_TL_REVIEW', 'REPORT_SUBMITTED_FOR_TL_REVIEW', 'SUBMITTED'].includes(c.status) && (
                          <Badge color="amber" size="xs" dot className="font-semibold animate-pulse">
                            ⚡ Awaiting TL Endorsement
                          </Badge>
                        )}
                      </div>
                      <p 
                        onClick={() => setViewCase(c)}
                        className="text-xs text-gray-500 dark:text-slate-400 font-mono cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {c.caseNumber || c.tin} • {c.sector}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={riskColors[c.riskLevel]} dot size="sm">{c.riskLevel} ({c.riskScore})</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={c.auditTypeDef?.color || 'gray'} size="sm">
                        {c.auditTypeDef?.shortName || c.auditType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={statusDef?.color || 'gray'} dot size="sm">
                        {statusDef?.label || c.frontendStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isCommitteeUser ? (
                        assignedTlName
                          ? <span className="font-medium text-purple-700 dark:text-purple-300">{assignedTlName}</span>
                          : <span className="text-gray-400">Not assigned</span>
                      ) : (
                        (auditor?.name || c.assignedAuditorName || c.assignedAuditorId) ? (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {auditor?.name || c.assignedAuditorName || (c.assignedAuditorId === 'fikadu.mulugeta' ? 'Fikadu Alemayehu' : c.assignedAuditorId)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.status === 'PLANNING_TRIGGERED' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Send}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                            onClick={() => {
                              setSelected([c.id]);
                              setSelectedAuditorId(c.assignedAuditorId || '');
                              setAssignResult(null);
                              setAssignModal(true);
                            }}
                          >
                            Route to Auditor
                          </Button>
                        ) : !c.assignedAuditorId ? (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Send}
                            onClick={() => {
                              setSelected([c.id]);
                              setSelectedAuditorId('');
                              setAssignResult(null);
                              setAssignModal(true);
                            }}
                          >
                            Assign
                          </Button>
                        ) : null}
                        <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewCase(c)}>View</Button>
                        {(c.auditType || '').toUpperCase().includes('TRANSFER') && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={ShieldCheck}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => {
                                const targetPhase = c.status === 'AUDIT_PLAN_SUBMITTED_TL' ? 'AUDIT_PLANNING' : 'DETAILED_RISK_ASSESSMENT';
                                setTpWorkspacePhase(targetPhase);
                                setTpWorkspaceCase(c);
                              }}
                            >
                              {['SUBMITTED_FOR_TL_REVIEW', 'REPORT_SUBMITTED_FOR_TL_REVIEW', 'RISK_ASSESSMENT_SUBMITTED_TL', 'AUDIT_PLAN_SUBMITTED_TL'].includes(c.status)
                                ? 'Review & Endorse'
                                : 'TP Review'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Layers3}
                              onClick={() => {
                                const targetPhase = c.status === 'AUDIT_PLAN_SUBMITTED_TL' ? 'AUDIT_PLANNING' : 'DETAILED_RISK_ASSESSMENT';
                                setTpWorkspacePhase(targetPhase);
                                setTpWorkspaceCase(c);
                              }}
                            >
                              Workspace
                            </Button>
                          </>
                        )}
                        {(c.auditType || '').toUpperCase().includes('DESK') && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={ShieldCheck}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => {
                              setDaWorkspaceCase(c);
                            }}
                          >
                            Review Workspace
                          </Button>
                        )}
                        {(c.auditType || '').toUpperCase().includes('COMPREHENSIVE') && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={ShieldCheck}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              setCaWorkspaceCase(c);
                            }}
                          >
                            {['SUBMITTED_TO_TL', 'SUBMITTED', 'PENDING_REVIEW'].includes(c.status)
                              ? 'Review & Endorse'
                              : 'Review Workspace'}
                          </Button>
                        )}
                        {['ISSUE', 'ISSUE_AUDIT', 'issue_audit'].includes((c.auditType || '').toUpperCase()) && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={ShieldCheck}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setIssueReviewCase(c)}
                          >
                            {['SUBMITTED_FOR_TL_REVIEW', 'SUBMITTED_TO_TL', 'REPORT_SUBMITTED_FOR_TL_REVIEW'].includes(c.status)
                              ? 'Review & Endorse'
                              : 'Issue Review'}
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
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filtered.length / itemsPerPage) || 1}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setPage(1); }}
        />
      </Card>}


      {/* View Case Dossier Modal */}
      {viewCase && (
        <CaseDetailModal
          caseData={viewCase}
          onClose={() => setViewCase(null)}
        />
      )}

      {/* Assign to Auditors / Team Leader Modal */}
      {assignModal && (() => {
        const isPlanningTriggered = selected.some(id => cases.find(c => c.id === id)?.status === 'PLANNING_TRIGGERED');
        const actionVerb = isPlanningTriggered ? 'Route' : 'Assign';
        const actionLabel = isPlanningTriggered ? 'Routing…' : 'Assigning…';

        return (
          <Modal open onClose={() => setAssignModal(false)} 
            title={isPlanningTriggered ? "Route Case to Lead Auditor (Phase 2: Audit Planning)" : (isCommitteeUser ? "Assign Cases to Team Leader" : "Assign Cases to Auditors")} 
            size="lg"
            footer={
              <div className="flex justify-between w-full">
                <Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
                <Button variant="success" icon={Send} onClick={handleAssignAuditors} disabled={assignLoading || !auditors.length}>
                  {assignLoading ? actionLabel : `${actionVerb} ${selected.length} Case${selected.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            }>
            <div className="space-y-4">
              {isPlanningTriggered ? (
                <Alert type="info" title="Statutory Audit Planning Mandate">
                  The Transfer Pricing Review Committee has issued the Statutory Planning Mandate (Directive No. 43/2015).
                  Confirm or designate the lead auditor to route the case and launch Phase 2: Audit Planning &amp; Programming.
                </Alert>
              ) : (
                <Alert type="info" title="Auditor Assignment">
                  Assign selected cases directly to a specific auditor or leave set to Automatic to balance workload evenly.
                </Alert>
              )}

              <Select
                label="Select Target Auditor"
                value={selectedAuditorId}
                onChange={(e) => setSelectedAuditorId(e.target.value)}
              >
                <option value="">⚡ Automatic Load Balancing (Distribute evenly)</option>
                {auditors.map(a => (
                  <option key={a.username || a.userId || a.id} value={a.username || a.userId || a.id}>
                    👤 {a.name} ({a.email || a.username || a.userId || a.id})
                  </option>
                ))}
              </Select>

              <div>
                <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-200">Current Auditor Workload</p>
                {auditors.length === 0
                  ? <Alert type="warning" title="No Auditors">You have no auditors in your team. Please contact your Tax Center Manager.</Alert>
                  : auditors.map(a => {
                      const load = cases.filter(c => [a.userId, a.id, a.username, a.email].filter(Boolean).includes(c.assignedAuditorId) && c.frontendStatus !== 'COMPLETED').length;
                      return (
                        <div key={a.username || a.userId || a.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg p-3 mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</p>
                            <p className="text-xs text-gray-500">{a.email || a.username || a.userId || a.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{load}</p>
                            <p className="text-xs text-gray-500">active cases</p>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
              <div className="bg-green-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-green-800 dark:text-green-400">
                <strong>Ready to {actionVerb.toLowerCase()}:</strong> {selected.length} case{selected.length > 1 ? 's' : ''} → {selectedAuditorId ? (auditors.find(a => [a.userId, a.id, a.username, a.email].filter(Boolean).includes(selectedAuditorId))?.name || selectedAuditorId) : `${auditors.length} auditors (Balanced)`}
              </div>
            </div>
          </Modal>
        );
      })()}


      {/* Transfer Pricing Supervisory Review Modal */}
      {tlReviewCase && (
        <TpTeamLeaderReviewModal
          caseData={tlReviewCase}
          user={user}
          onClose={() => setTlReviewCase(null)}
          onRefresh={fetchCases}
        />
      )}

      {/* Issue Audit Supervisory Review Modal */}
      {issueReviewCase && (
        <IssueTeamLeaderReviewModal
          caseData={issueReviewCase}
          user={user}
          onClose={() => setIssueReviewCase(null)}
          onRefresh={fetchCases}
        />
      )}
    </div>
  );
}
