/**
 * TeamLeaderCases Page
 * Display list of all cases assigned to this team leader.
 * Shows both committee-originated cases (after viability determination)
 * and standard AP-assigned cases.
 * 
 * Each case has a direct "Execute" button that opens the 11-step audit workflow.
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { useWorkflow } from '../context/WorkflowContext.jsx';
import { useCases } from '../hooks/useCases';
import { teamLeaderAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import AuditorAssignmentModal from '../components/AuditorAssignmentModal';
import ErrorAlert from '../components/ErrorAlert';
import TeamLeaderCaseDetail from './TeamLeaderCaseDetail';
import CaseExecution from './CaseExecution';
import Card from '../../../components/Card';
import {
  Search, AlertCircle, ChevronLeft, ChevronRight, Download,
  FileText, Send, ArrowRight, Filter, PlayCircle, ClipboardCheck,
  UserCheck, Clock,
} from 'lucide-react';

const TEAM_LEADER_ID_MAP = {
  'u-tl-aa1a': '10000000-0000-0000-0001-000000000001',
  'u-tl-aa2a': '10000000-0000-0000-0002-000000000001',
  'u-tl-aa3a': '10000000-0000-0000-0003-000000000001',
  'u-tl-or1a': '10000000-0000-0000-0004-000000000001',
  'fed.ja.tl': '10000000-0000-0000-0099-000000000001',
  'fed.ja.tl2': '10000000-0000-0000-0099-000000000002',
  'fed.ja.chair': '20000000-0000-0000-0099-000000000001',
  'fed.ja.member': '20000000-0000-0000-0099-000000000002',
  'fed2.ja.tl': '10000000-0000-0000-0098-000000000001',
  'fed2.ja.tl2': '10000000-0000-0000-0098-000000000002',
  'fed2.ja.chair': '20000000-0000-0000-0098-000000000001',
  'fed2.ja.member': '20000000-0000-0000-0098-000000000002',
  'aa1.tl': '10000000-0000-0000-0001-000000000001',
  'or1.tl': '10000000-0000-0000-0004-000000000001',
  'u-tl-or1-ja-1': '10000000-0000-0000-0004-000000000001',
  'u-tl-or1-joint-1': '10000000-0000-0000-0004-000000000001',
  'teamleader-or1-ja-1': '10000000-0000-0000-0004-000000000001',
  'u-tl-federal-lto1-ja-1': '10000000-0000-0000-0099-000000000001',
  'u-tl-federal-lto1-joint-1': '10000000-0000-0000-0099-000000000001',
  'teamleader-federal-lto1-ja-1': '10000000-0000-0000-0099-000000000001',
  'teamleader-federal-lto1-ja-2': '10000000-0000-0000-0099-000000000002',
  'u-tl-federal-lto2-ja-1': '10000000-0000-0000-0098-000000000001',
  'u-tl-federal-lto2-joint-1': '10000000-0000-0000-0098-000000000001',
  'teamleader-federal-lto2-ja-1': '10000000-0000-0000-0098-000000000001',
  'teamleader-federal-lto2-ja-2': '10000000-0000-0000-0098-000000000002',
  'teamleader-aa1-ja-1': '10000000-0000-0000-0001-000000000001',
  'teamleader-aa2-ja-1': '10000000-0000-0000-0002-000000000001',
  'teamleader-aa3-ja-1': '10000000-0000-0000-0003-000000000001',
};

const JA_PHASE_CONFIG = {};

export default function TeamLeaderCases({ view = 'cases', onNavigate }) {
  const { user } = useAuth();
  const { state, selectors } = useApp();
  const { actions: workflowActions, getWorkflow } = useWorkflow();
  const { cases: backendCases, loading, error, currentPage, totalElements, filters, setPage, setFilters, refresh } = useCases(user?.id);

  // Merge backend cases with AppContext local-state cases (Tax Center Manager assigns via local state only)
  const cases = useMemo(() => {
    const localCases = (selectors.getCasesForTeamLeader(user?.id) || []).map(c => ({
      ...c,
      committeeCaseId: c.id,
      source: c.source || 'ap',
    }));
    const byId = new Map();
    const caseKey = (c) => c.caseCode || c.caseNumber || c.committeeCaseId || c.caseId || c.id;
    backendCases.forEach(c => {
      byId.set(caseKey(c), c);
    });
    localCases.forEach(c => {
      const key = caseKey(c);
      if (!byId.has(key)) byId.set(key, c);
    });
    return Array.from(byId.values());
  }, [backendCases, user?.id, selectors, state.cases]);
  const [searchInput, setSearchInput] = useState('');
  const [riskFilter, setRiskFilter] = useState('All Levels');
  const [segmentFilter, setSegmentFilter] = useState('All Segments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseSource, setSelectedCaseSource] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [executingCase, setExecutingCase] = useState(null);
  const [handoffError, setHandoffError] = useState(null);
  const [handoffLoading, setHandoffLoading] = useState(null);

  /**
   * Perform handoff for a case — required before auditor assignment.
   */
  const handleHandoff = async (caseItem) => {
    // Handoff is an AP case operation; prefer the AP identifier over the
    // committee identifier when both records are present on the row.
    const caseId = caseItem.id || caseItem.caseId || caseItem.committeeCaseId;
    try {
      setHandoffLoading(caseId);
      await teamLeaderAPI.handoffCase(caseId, user.id, 'Accepted by Team Leader after reviewing the case referral');
      refresh();
    } catch (err) {
      console.error('[TeamLeaderCases] Handoff failed:', err);
      setHandoffError(`Handoff failed: ${err.message}`);
    } finally {
      setHandoffLoading(null);
    }
  };

  /**
   * Check if a case has been handed off (eligible for auditor assignment).
   */
  const isHandedOff = (caseItem) => {
    const status = caseItem.status?.toUpperCase();
    return status === 'HANDED_OFF' || status === 'AUDITOR_ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED';
  };

  const isHandoffable = (caseItem) => {
    const status = caseItem.status?.toUpperCase();
    return [
      'ASSIGNED',
      'PENDING_ASSIGNMENT',
      'WAITING_ASSIGNMENT',
      'TEAM_ASSIGNED',
      'ASSIGNED_TO_TEAM_LEADER',
      'PENDING_HANDOFF',
    ].includes(status);
  };

  const isAssignedToAuditor = (caseItem) => {
    return Boolean(caseItem.assignedAuditorName || caseItem.assignedAuditor || caseItem.assignedAuditorId);
  };

  const getNextAction = (caseItem, isConcluded, isExecuting) => {
    if (!isAssignedToAuditor(caseItem) && isHandedOff(caseItem)) {
      return { type: 'ASSIGN', label: 'Assign' };
    }
    if (isConcluded || isAssignedToAuditor(caseItem)) {
      return { type: 'EXECUTE', label: isExecuting ? 'Continue' : 'Execute' };
    }
    // Awaiting assignment by a Tax Center Manager — the TL cannot hand off yet.
    const status = caseItem.status?.toUpperCase();
    if (!caseItem.assignedTeamLeaderId && status === 'PENDING_ASSIGNMENT') {
      return { type: 'AWAITING_ASSIGNMENT', label: 'Awaiting Assignment' };
    }
    if (isHandoffable(caseItem) || !isHandedOff(caseItem)) {
      return { type: 'HANDOFF', label: 'Handoff' };
    }
    return { type: 'ASSIGN', label: 'Assign' };
  };

  const getExecutionStatus = (workflow, caseItem) => {
    if (workflow.status === 'CONCLUDED') return 'COMPLETED';
    if (workflow.assignment || caseItem.assignedAuditorName || caseItem.assignedAuditor || caseItem.assignedAuditorId) {
      return 'IN_PROGRESS';
    }
    if (isHandedOff(caseItem)) return 'HANDED_OFF';
    return 'PENDING_HANDOFF';
  };

  const pageSize = 25;
  const totalPages = Math.ceil(totalElements / pageSize);

  const handleSearch = (value) => {
    setSearchInput(value);
    setFilters({ ...filters, taxpayerName: value });
    setPage(0);
  };

  const handleRiskFilter = (risk) => {
    setRiskFilter(risk);
    if (risk !== 'All Levels') {
      setFilters({ ...filters, riskPriority: risk });
    } else {
      const { riskPriority, ...rest } = filters;
      setFilters(rest);
    }
    setPage(0);
  };

  const handleSegmentFilter = (segment) => {
    setSegmentFilter(segment);
    if (segment !== 'All Segments') {
      setFilters({ ...filters, segment: segment });
    } else {
      const { segment: _, ...rest } = filters;
      setFilters(rest);
    }
    setPage(0);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    if (status !== 'All Statuses') {
      setFilters({ ...filters, status });
    } else {
      const { status: _, ...rest } = filters;
      setFilters(rest);
    }
    setPage(0);
  };

  const handleSourceFilter = (source) => {
    setSourceFilter(source);
    setPage(0);
  };

  const filteredCases = useMemo(() => {
    if (sourceFilter === 'All Sources') return cases;
    return cases.filter(c => c.source === sourceFilter.toLowerCase());
  }, [cases, sourceFilter]);

  const handleExportXLS = () => console.log('Export to XLS');
  const handleExportPDF = () => console.log('Export to PDF');

  const handleViewCase = (caseId, source) => {
    setSelectedCaseId(caseId);
    setSelectedCaseSource(source);
  };

  const isTeamLeader = user?.role === 'team_leader';

  const handleAssign = (caseItem) => {
    setAssignModal(caseItem);
  };

  /**
   * Execute: opens the 10-step workflow for a case.
   * If the case hasn't been imported yet, auto-imports it first.
   */
  const handleExecuteCase = (caseItem, forcedStep = null) => {
    const caseId = caseItem.committeeCaseId || caseItem.caseId || caseItem.id;
    const userIds = [
      user?.id,
      user?.userId,
      user?.username,
      user?.legacyUsername,
      user?.email,
      TEAM_LEADER_ID_MAP[user?.id],
      TEAM_LEADER_ID_MAP[user?.username],
      TEAM_LEADER_ID_MAP[user?.legacyUsername],
    ].filter(Boolean);
    const assignedTeamLeaderId = caseItem.assignedTeamLeaderId || caseItem.teamLeadId || caseItem.assignedTeamLeader;
    const nameMatch = Boolean(
      user?.name &&
      caseItem.assignedTeamLeaderName &&
      user.name.trim().toLowerCase() === caseItem.assignedTeamLeaderName.trim().toLowerCase()
    );

    if (
      assignedTeamLeaderId &&
      !nameMatch &&
      !userIds.includes(assignedTeamLeaderId) &&
      !userIds.some(id => String(id).toLowerCase() === String(assignedTeamLeaderId).toLowerCase())
    ) {
      setHandoffError(`Case ${caseItem.caseNumber || caseId} is assigned to ${caseItem.assignedTeamLeaderName || assignedTeamLeaderId}. You can only execute cases assigned to your team.`);
      return;
    }

    setHandoffError(null);
    const wf = getWorkflow(caseId);

    // If this case hasn't been imported into execution yet, import it
    if (wf.status === 'PENDING_HANDOFF' || !wf.steps?.CASE_DETAIL?.completedAt) {
      workflowActions.importCase(caseId, user.id, {
        taxpayerName: caseItem.taxpayerName,
        taxIdNumber: caseItem.taxIdNumber || caseItem.tin,
        riskPriority: caseItem.riskPriority || caseItem.riskLevel,
        importedAt: new Date().toISOString(),
      });
    }

    const targetStep = forcedStep || null;

    setExecutingCase({
      id: caseId,
      taxpayerName: caseItem.taxpayerName,
      riskPriority: caseItem.riskPriority || caseItem.riskLevel,
      riskLevel: caseItem.riskLevel,
      source: caseItem.source,
      initialStep: targetStep,
      ...caseItem,
    });
  };

  const getRiskBadge = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'critical' || riskLower === 'high') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded text-xs font-medium"><span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400"></span> {risk}</span>;
    if (riskLower === 'medium') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 rounded text-xs font-medium"><span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span> {risk}</span>;
    if (riskLower === 'low') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded text-xs font-medium"><span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></span> {risk}</span>;
    return <span className="text-gray-600 dark:text-gray-400">N/A</span>;
  };

  const getSegmentBadge = (segment) => {
    const segmentUpper = segment?.toUpperCase();
    if (segmentUpper === 'LARGE') return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-xs font-semibold">LTO</span>;
    if (segmentUpper === 'MEDIUM') return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 rounded-full text-xs font-semibold">MTO</span>;
    if (segmentUpper === 'SMALL') return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-full text-xs font-semibold">STO</span>;
    return <span className="text-gray-600 dark:text-gray-400">N/A</span>;
  };

  const getSourceBadge = (source) => {
    if (source === 'committee') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 rounded text-xs font-medium">
          <ArrowRight size={10} /> Committee
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded text-xs font-medium">
        AP System
      </span>
    );
  };

  // Show case execution view
  if (executingCase) {
    return (
      <CaseExecution
        caseId={executingCase.id}
        caseData={executingCase}
        initialStep={executingCase.initialStep}
        onBack={() => setExecutingCase(null)}
      />
    );
  }

  if (handoffError) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          error={handoffError}
          title="Case Handoff Required"
          onRetry={() => setHandoffError(null)}
        />
        <button
          onClick={() => setHandoffError(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Cases
        </button>
      </div>
    );
  }

  // Show case detail view
  if (selectedCaseId) {
    return (
      <TeamLeaderCaseDetail
        caseId={selectedCaseId}
        source={selectedCaseSource}
        onBack={() => { setSelectedCaseId(null); setSelectedCaseSource(null); }}
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert error={error} title="Failed to Load Cases" onRetry={refresh} />
      </div>
    );
  }

  const activePhaseConfig = JA_PHASE_CONFIG[view];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activePhaseConfig ? activePhaseConfig.title : 'My Cases'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {activePhaseConfig
                ? 'Review assigned joint audit cases at this milestone. Click Execute on any case to manage this workflow phase.'
                : 'Cases from the Joint Audit Committee and your assigned audit portfolio. Click Execute to start the 10-step audit workflow.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportXLS} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              <Download size={16} /> Export XLS
            </button>
            <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by taxpayer name, TIN, industry, or case ID..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Source</label>
            <select value={sourceFilter} onChange={(e) => handleSourceFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Sources</option>
              <option value="Committee">Committee (Viability Approved)</option>
              <option value="AP">AP System (Plan-Based)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Risk Level</label>
            <select value={riskFilter} onChange={(e) => handleRiskFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Levels</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Segment</label>
            <select value={segmentFilter} onChange={(e) => handleSegmentFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Segments</option>
              <option>LARGE</option>
              <option>MEDIUM</option>
              <option>SMALL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Status</label>
            <select value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Statuses</option>
              <option>ASSIGNED</option>
              <option>HANDED_OFF</option>
              <option>AUDITOR_ASSIGNED</option>
              <option>IN_PROGRESS</option>
              <option>COMPLETED</option>
              <option>TEAM_ASSIGNED</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
              <Filter size={14} /> Advanced
            </button>
          </div>
        </div>
      </Card>

      {/* Cases Table */}
      {!loading && filteredCases.length > 0 && (
        <div className="overflow-x-auto">
          <Card className="p-0 border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Case ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Taxpayer (TIN & Segment)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Auditor</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCases.map((caseItem) => {
                  const caseId = caseItem.committeeCaseId || caseItem.caseId || caseItem.id;
                  const wf = getWorkflow(caseId);
                  const isExecuting = wf.status !== 'PENDING_HANDOFF' && wf.status !== 'CONCLUDED';
                  const isConcluded = wf.status === 'CONCLUDED';
                  const executionStatus = getExecutionStatus(wf, caseItem);

                  return (
                    <tr key={caseId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {caseItem.caseCode || caseItem.caseNumber || `TL-${String(caseId).substring(0, 8)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.taxpayerName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">TIN: {caseItem.taxIdNumber || caseItem.tin || 'N/A'}</div>
                        <div className="mt-2">{getSegmentBadge(caseItem.segment)}</div>
                      </td>
                      <td className="px-6 py-4">{getSourceBadge(caseItem.source)}</td>
                      <td className="px-6 py-4">{getRiskBadge(caseItem.riskPriority || caseItem.riskLevel)}</td>
                      <td className="px-6 py-4"><StatusBadge status={executionStatus} /></td>
                      <td className="px-6 py-4">
                        {caseItem.assignedAuditorName || caseItem.assignedAuditor ? (
                          <div className="text-sm text-gray-900 dark:text-white">{caseItem.assignedAuditorName || caseItem.assignedAuditor}</div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isTeamLeader && (() => {
                            const nextAction = getNextAction(caseItem, isConcluded, isExecuting);
                            if (!nextAction) return null;
                            if (nextAction.type === 'EXECUTE' && isConcluded) {
                              return (
                                <button
                                  onClick={() => handleExecuteCase(caseItem)}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium cursor-default"
                                  title="Case concluded"
                                >
                                  <ClipboardCheck size={14} />
                                  Concluded
                                </button>
                              );
                            }
                            const isHandoffAction = nextAction.type === 'HANDOFF';
                            const isAssignAction = nextAction.type === 'ASSIGN';
                            const isAwaitingAssignment = nextAction.type === 'AWAITING_ASSIGNMENT';
                            if (isAwaitingAssignment) {
                              return (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                                  title="Waiting for a Tax Center Manager to assign this case to a team leader"
                                >
                                  <Clock size={14} />
                                  Awaiting Assignment
                                </button>
                              );
                            }
                            return (
                              <button
                                onClick={() => isHandoffAction ? handleHandoff(caseItem) : isAssignAction ? handleAssign(caseItem) : handleExecuteCase(caseItem)}
                                disabled={isHandoffAction && handoffLoading === caseId}
                                className={`inline-flex items-center gap-1 px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-50 ${
                                  isHandoffAction ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
                                  isAssignAction ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' :
                                  isExecuting ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                }`}
                                title={isHandoffAction ? 'Hand off case before assignment' : isAssignAction ? 'Assign this case to an auditor' : 'Open case execution'}
                              >
                                {isHandoffAction ? <ArrowRight size={14} /> : isAssignAction ? <UserCheck size={14} /> : <PlayCircle size={14} />}
                                {isHandoffAction && handoffLoading === caseId ? 'Handing off...' : nextAction.label}
                              </button>
                            );
                          })()}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCases.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No cases found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {cases.length === 0
              ? 'No cases have been assigned to you yet. Cases appear here after the Committee determines viability.'
              : 'Try adjusting your filters or search criteria'}
          </p>
        </Card>
      )}

      {/* Pagination Footer */}
      {!loading && filteredCases.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCases.length} of {totalElements} cases.
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                  let page = idx;
                  if (totalPages > 5 && currentPage > 2) page = currentPage - 2 + idx;
                  if (page < totalPages) {
                    return (
                      <button key={page} onClick={() => setPage(page)} className={`px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'}`}>
                        {page + 1}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              <button onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auditor Assignment Modal */}
      <AuditorAssignmentModal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        caseData={assignModal}
        allCases={cases}
        user={user}
        onAssign={async (caseId, auditorId) => {
          // Try backend API first, fall back to local update
          try {
            await teamLeaderAPI.assignCaseToAuditor(caseId, auditorId);
          } catch (err) {
            console.warn('[TeamLeaderCases] Backend assign failed, using local state:', err.message);
          }
          // Update the workflow context to reflect the assignment
          const caseItem = cases.find(c =>
            (c.committeeCaseId || c.caseId || c.id) === caseId
          );
          if (caseItem) {
            const auditorName = caseItem.assignedAuditorName || 'Auditor';
            workflowActions.assignAuditor(caseId, user.id, {
              auditorId,
              auditorName,
              assignedAt: new Date().toISOString(),
            });
          }
          refresh();
        }}
      />
    </div>
  );
}
