import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Send,
  Building2,
  DollarSign,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  FolderOpen,
  Scale,
  BadgeAlert,
  Loader2,
  UserCheck,
  Bell
} from 'lucide-react';
import {
  AuditCase,
  EvidenceItem,
  AuditProcedure,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  DraftReport,
  AuditTrailEntry,
  AuditStatus,
  ComprehensiveReconciliation,
  AssessmentNotice,
  ExitConference,
  AuthUser
} from '../../types/audit';
import { itasApi } from '../../services/api';
import { AuditTrailDrawer } from '../workspace/AuditTrailDrawer';

interface TeamLeaderWorkspaceProps {
  currentUser: AuthUser;
  onSelectCase?: (caseId: string) => void;
}

export const TeamLeaderWorkspace: React.FC<TeamLeaderWorkspaceProps> = ({
  currentUser,
  onSelectCase
}) => {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CA-2026-102');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [caseLoading, setCaseLoading] = useState<boolean>(false);
  const [filterActionOnly, setFilterActionOnly] = useState<boolean>(true);

  // Loaded full case data
  const [activeCase, setActiveCase] = useState<AuditCase | null>(null);
  const [procedures, setProcedures] = useState<AuditProcedure[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [queries, setQueries] = useState<TaxQuery[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [workingPapers, setWorkingPapers] = useState<WorkingPaper[]>([]);
  const [draftReport, setDraftReport] = useState<DraftReport | null>(null);
  const [reconciliations, setReconciliations] = useState<ComprehensiveReconciliation | null>(null);
  const [assessmentNotice, setAssessmentNotice] = useState<AssessmentNotice | null>(null);
  const [exitConference, setExitConference] = useState<ExitConference | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Active review tab
  const [activeTab, setActiveTab] = useState<
    'findings' | 'procedures' | 'evidence' | 'queries' | 'reconciliations' | 'workingPapers' | 'assessment'
  >('findings');

  // Modals & Action Forms
  const [actionType, setActionType] = useState<
    'APPROVE' | 'RETURN' | 'RECOMMEND_DIRECTOR' | 'REFER_FRAUD' | null
  >(null);
  const [actionComment, setActionComment] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);

  // Load cases list
  const loadCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await itasApi.getAssignedCases(false);
      setCasesList(list);
      // If selectedCaseId is not in list, select first available
      if (list.length > 0 && !list.some((c) => c.id === selectedCaseId)) {
        const requiringAction = list.find((c) => c.requiresAction || c.status === 'SUBMITTED');
        setSelectedCaseId(requiringAction ? requiringAction.id : list[0].id);
      }
    } catch (err) {
      console.error('Failed to load team leader cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Load single case full data
  const loadFullCase = useCallback(async (caseId: string) => {
    setCaseLoading(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const fullCase = await itasApi.getFullCase(caseId);
      setActiveCase(fullCase.auditCase);
      setProcedures(fullCase.procedures || []);
      setEvidenceList(fullCase.evidence || []);
      setQueries(fullCase.queries || []);
      setFindings(fullCase.findings || []);
      setWorkingPapers(fullCase.workingPapers || []);
      setDraftReport(fullCase.draftReport || null);
      setReconciliations(fullCase.reconciliations || null);
      setAssessmentNotice(fullCase.assessmentNotice || null);
      setExitConference(fullCase.exitConference || null);
      setAuditTrail(fullCase.auditTrail || []);
    } catch (err) {
      console.error('Failed to load case details:', err);
    } finally {
      setCaseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadFullCase(selectedCaseId);
    }
  }, [selectedCaseId, loadFullCase]);

  // Calculations
  const totalFindingsTax = findings.reduce((sum, f) => sum + f.totalTaxImpact, 0);
  const totalAssessment = assessmentNotice?.totalAssessmentDue || totalFindingsTax;
  const isOverDirectorThreshold = totalAssessment > 500000;

  // Filtered cases for left sidebar
  const displayedCases = casesList.filter((c) => {
    if (filterActionOnly) {
      return c.status === 'SUBMITTED' || c.requiresAction;
    }
    return true;
  });

  // Handle Team Leader Decisions
  const handleExecuteDecision = async () => {
    if (!activeCase || !actionType) return;
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      let workflowAction: any = '';
      if (actionType === 'APPROVE') {
        workflowAction = 'APPROVE_AUDIT';
      } else if (actionType === 'RETURN') {
        workflowAction = 'RETURN_FOR_CORRECTION';
      } else if (actionType === 'RECOMMEND_DIRECTOR') {
        workflowAction = 'RECOMMEND_FOR_DIRECTOR_APPROVAL';
      } else if (actionType === 'REFER_FRAUD') {
        workflowAction = 'TRIGGER_FRAUD_INVESTIGATION';
      }

      const res = await itasApi.executeWorkflow(activeCase.id, {
        action: workflowAction,
        comment: actionComment,
        user: currentUser.name
      });

      if (res.success) {
        setActionSuccessMessage(
          actionType === 'APPROVE'
            ? 'Audit endorsed and authorized successfully!'
            : actionType === 'RETURN'
            ? 'Case successfully returned to Comprehensive Auditor with your instructions.'
            : actionType === 'RECOMMEND_DIRECTOR'
            ? 'Case escalated to Executive Director of Large Taxpayers for statutory approval.'
            : 'Case referred to Intelligence & Tax Fraud Investigation Directorate.'
        );
        setActionType(null);
        setActionComment('');
        await loadCases();
        await loadFullCase(activeCase.id);
      }
    } catch (err: any) {
      setActionError(err.message || 'Action failed. Please verify statutory parameters.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900/5 flex flex-col">
      {/* Top Supervisory Header Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100">
                  Team Leader Substantive Review Portal
                </h1>
                <span className="text-2xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SOR FR-04.7
                </span>
                <span className="text-2xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {currentUser.directorate}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reviewing Auditor: <strong className="text-slate-200">{activeCase?.assignedAuditor || 'Jane Doe'}</strong> • Supervisor:{' '}
                <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.badgeNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Pending Actions
                </span>
                <span className="text-sm font-bold text-amber-400">
                  {casesList.filter((c) => c.status === 'SUBMITTED').length} Cases Awaiting Sign-Off
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAuditTrailOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cases Queue */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-slate-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assigned Case Queue
                </h2>
              </div>
              <button
                onClick={() => setFilterActionOnly(!filterActionOnly)}
                className={`text-2xs px-2 py-0.5 rounded font-bold transition-colors ${
                  filterActionOnly
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {filterActionOnly ? 'Requires Action Only' : 'All Supervised'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {displayedCases.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">No pending cases in queue.</p>
                  <p className="text-slate-400 text-2xs mt-1">
                    All submitted audits have been reviewed or endorsed.
                  </p>
                </div>
              ) : (
                displayedCases.map((c) => {
                  const isSelected = c.id === selectedCaseId;
                  const isSubmitted = c.status === 'SUBMITTED';
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-mono text-2xs font-bold text-indigo-700 block">
                            {c.caseNumber}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900 leading-tight">
                            {c.taxpayerName}
                          </h3>
                        </div>
                        <span
                          className={`text-2xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                            c.status === 'SUBMITTED'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : c.status === 'RETURNED_FOR_CORRECTION'
                              ? 'bg-rose-100 text-rose-800'
                              : c.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'PENDING_DIRECTOR_APPROVAL'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-2xs text-slate-500 flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span>TIN: {c.tin}</span>
                        <span className="font-bold text-slate-800">
                          ${(c.totalAssessment || 0).toLocaleString()}
                        </span>
                      </div>

                      {isSubmitted && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-1.5 flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Submitted for review by {c.assignedAuditor}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Statutory Threshold Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900">
            <div className="flex items-start gap-2.5">
              <Scale className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-950">SOR FR-04.7 Delegation of Authority</h4>
                <p className="mt-1 text-blue-800 leading-relaxed text-2xs">
                  Team Leaders possess statutory authority to approve standard comprehensive audits
                  with tax adjustments up to <strong>$500,000</strong>.
                </p>
                <p className="mt-1 text-blue-800 leading-relaxed text-2xs">
                  Audits exceeding <strong>$500,000</strong> or involving criminal fraud referrals
                  statutorily mandate recommendation to the <strong>Director of Comprehensive Audits</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Case Review & Decision Cockpit */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {caseLoading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs font-medium">Loading comprehensive audit case file...</p>
            </div>
          ) : !activeCase ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Select a case from the queue to conduct supervisory review.</p>
            </div>
          ) : (
            <>
              {/* Case Summary Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {activeCase.caseNumber}
                      </span>
                      <span className="text-2xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                        {activeCase.auditType}
                      </span>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded font-bold ${
                          activeCase.status === 'SUBMITTED'
                            ? 'bg-amber-100 text-amber-800'
                            : activeCase.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {activeCase.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {activeCase.taxpayerName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      TIN: <strong className="font-mono text-slate-700">{activeCase.tin}</strong> • Period:{' '}
                      <strong className="text-slate-700">{activeCase.taxPeriod}</strong> • Auditor:{' '}
                      <strong className="text-slate-700">{activeCase.assignedAuditor}</strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Total Tax Adjustment & Due
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      ${totalAssessment.toLocaleString()}
                    </span>
                    {isOverDirectorThreshold && (
                      <span className="block text-[10px] font-bold text-purple-700 mt-0.5">
                        Exceeds $500k Threshold (Director Sign-Off Required)
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Banners */}
                {activeCase.teamLeaderComment && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      Last Team Leader Feedback / Decision Note:
                    </span>
                    <p className="text-slate-600 italic">"{activeCase.teamLeaderComment}"</p>
                  </div>
                )}

                {activeCase.teamLeaderRecommendation && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md text-xs text-purple-900">
                    <span className="font-bold block mb-0.5">
                      Team Leader Recommendation to Director:
                    </span>
                    <p className="italic">"{activeCase.teamLeaderRecommendation}"</p>
                  </div>
                )}

                {activeCase.directorComment && (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900">
                    <span className="font-bold block mb-0.5">
                      Director Executive Decision Note:
                    </span>
                    <p className="italic">"{activeCase.directorComment}"</p>
                  </div>
                )}

                {actionSuccessMessage && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccessMessage}</span>
                  </div>
                )}

                {actionError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-300 rounded-md text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Supervisory Review Action Toolbar */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Supervisory Actions:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setActionType('RETURN');
                        setActionComment(
                          'Audit execution requires additional substantiation on transfer pricing calculations and unverified export customs records.'
                        );
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold rounded border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return for Correction</span>
                    </button>

                    {isOverDirectorThreshold ? (
                      <button
                        onClick={() => {
                          setActionType('RECOMMEND_DIRECTOR');
                          setActionComment(
                            `Substantive audit findings substantiate $${totalAssessment.toLocaleString()} in tax adjustments, exceeding the $500,000 threshold. Formally recommended for Executive Director Statutory Approval.`
                          );
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold rounded bg-purple-700 hover:bg-purple-800 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Recommend for Director Approval</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActionType('APPROVE');
                          setActionComment(
                            'Substantive audit findings, working papers, and statutory penalty computations verified and approved. Assessment order authorized.'
                          );
                        }}
                        disabled={activeCase.status === 'APPROVED'}
                        className="px-4 py-1.5 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Audit & Authorize Assessment</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActionType('REFER_FRAUD');
                        setActionComment(
                          'Substantive examination detected material indicators of intentional book suppression, unregistered offshore transfers, and prima facie criminal evasion.'
                        );
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold rounded border border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                    >
                      <BadgeAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Refer to Fraud Investigation</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Action Comment Form */}
                {actionType && (
                  <div className="mt-4 p-4 rounded-lg border border-slate-300 bg-slate-50/80 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        {actionType === 'RETURN' && <RotateCcw className="w-4 h-4 text-rose-600" />}
                        {actionType === 'APPROVE' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {actionType === 'RECOMMEND_DIRECTOR' && <Sparkles className="w-4 h-4 text-purple-600" />}
                        {actionType === 'REFER_FRAUD' && <BadgeAlert className="w-4 h-4 text-amber-600" />}
                        <span>
                          {actionType === 'RETURN'
                            ? 'Statutory Return Instructions for Auditor'
                            : actionType === 'APPROVE'
                            ? 'Final Supervisory Approval Endorsement'
                            : actionType === 'RECOMMEND_DIRECTOR'
                            ? 'Formal Recommendation Memo for Executive Director'
                            : 'Criminal Tax Fraud Referral Memo'}
                        </span>
                      </h4>
                      <button
                        onClick={() => setActionType(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                      placeholder="Enter supervisory comments, statutory basis, or specific correction directives..."
                    />

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActionType(null)}
                        className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleExecuteDecision}
                        disabled={isSubmittingAction || !actionComment.trim()}
                        className={`px-4 py-1.5 text-xs font-bold rounded text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
                          actionType === 'RETURN'
                            ? 'bg-rose-700 hover:bg-rose-800'
                            : actionType === 'APPROVE'
                            ? 'bg-emerald-700 hover:bg-emerald-800'
                            : actionType === 'RECOMMEND_DIRECTOR'
                            ? 'bg-purple-700 hover:bg-purple-800'
                            : 'bg-amber-700 hover:bg-amber-800'
                        }`}
                      >
                        {isSubmittingAction ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm Supervisory Action</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Tabs */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/70 text-xs">
                  <button
                    onClick={() => setActiveTab('findings')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'findings'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Findings & Adjustments</span>
                    <span className="px-1.5 py-0.2 rounded-full text-2xs bg-indigo-100 text-indigo-800 font-mono">
                      {findings.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('procedures')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'procedures'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Procedures & Assertions</span>
                    <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-200 text-slate-700 font-mono">
                      {procedures.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reconciliations')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'reconciliations'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Reconciliations & TIMS</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('queries')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'queries'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Taxpayer Queries</span>
                    <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-200 text-slate-700 font-mono">
                      {queries.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'evidence'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Evidence Register</span>
                    <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-200 text-slate-700 font-mono">
                      {evidenceList.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('workingPapers')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'workingPapers'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Working Papers</span>
                    <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-200 text-slate-700 font-mono">
                      {workingPapers.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('assessment')}
                    className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'assessment'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Assessment Order</span>
                  </button>
                </div>

                {/* Tab 1: Findings */}
                {activeTab === 'findings' && (
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Substantiated Audit Findings & Statutory Tax Impact
                        </h3>
                        <p className="text-slate-500 text-2xs">
                          Review condition, cause, effect, and 20% statutory penalty schedule.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                        Total Adjustment: ${totalFindingsTax.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {findings.map((f, i) => (
                        <div
                          key={f.id || i}
                          className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-2xs font-bold text-indigo-700">
                                  {f.reference}
                                </span>
                                <span className="text-2xs px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800">
                                  {f.auditArea}
                                </span>
                                {f.isSignificant && (
                                  <span className="text-2xs px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                                    Material Finding
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-1">{f.title}</h4>
                            </div>

                            <div className="text-right">
                              <span className="text-2xs text-slate-500 block">Total Impact</span>
                              <span className="font-mono font-bold text-sm text-slate-900">
                                ${f.totalTaxImpact.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 mb-3">{f.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2.5 bg-white rounded border border-slate-200 text-2xs">
                            <div>
                              <span className="text-slate-400 block font-medium">Under-Declared Tax</span>
                              <span className="font-bold text-slate-800 font-mono">
                                ${f.underDeclaredAmount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">
                                Statutory Penalty ({f.penaltyRate}%)
                              </span>
                              <span className="font-bold text-amber-700 font-mono">
                                ${f.penaltyAmount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Late Interest</span>
                              <span className="font-bold text-slate-800 font-mono">
                                ${f.interestAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 text-2xs text-slate-500 flex items-center justify-between">
                            <span>Legal Criteria: <strong>{f.criteria}</strong></span>
                            <span>Status: <strong className="text-emerald-700">{f.status}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: Procedures */}
                {activeTab === 'procedures' && (
                  <div className="p-5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Substantive Audit Procedures & Financial Assertions
                    </h3>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {procedures.map((p) => (
                        <div key={p.id} className="p-3.5 bg-white hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-2xs font-bold text-indigo-700">
                                {p.reference}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{p.title}</span>
                              {p.assertionType && (
                                <span className="text-2xs px-2 py-0.5 rounded font-mono bg-blue-50 text-blue-700 border border-blue-200">
                                  Assertion: {p.assertionType}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-2xs px-2 py-0.5 rounded font-bold ${
                                p.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{p.objective}</p>
                          {p.conclusion && (
                            <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-2xs text-slate-700">
                              <strong>Auditor Conclusion:</strong> {p.conclusion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Reconciliations */}
                {activeTab === 'reconciliations' && reconciliations && (
                  <div className="p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Cross-Tax & Electronic Invoicing (TIMS) Reconciliations
                    </h3>

                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          1. VAT Returns vs. CIT Gross Turnover & TIMS Electronic Invoices
                        </h4>
                        <span className="text-2xs px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                          {reconciliations.vatVsSales.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-2xs bg-white p-3 rounded border border-slate-200">
                        <div>
                          <span className="text-slate-400 block font-medium">VAT Sales Declared</span>
                          <span className="font-mono font-bold text-slate-800">
                            ${reconciliations.vatVsSales.annualVatSalesDeclared.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">CIT Gross Turnover</span>
                          <span className="font-mono font-bold text-slate-800">
                            ${reconciliations.vatVsSales.annualCitGrossTurnover.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">TIMS Electronic Invoices</span>
                          <span className="font-mono font-bold text-slate-800">
                            ${reconciliations.vatVsSales.timsElectronicInvoices.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Identified Variance</span>
                          <span className="font-mono font-bold text-rose-700">
                            ${reconciliations.vatVsSales.variance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-2xs text-slate-600 mt-2">{reconciliations.vatVsSales.notes}</p>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          2. ASYCUDA Customs Import Declarations vs General Ledger Purchases
                        </h4>
                        <span className="text-2xs px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                          {reconciliations.customsImportsVsPurchases.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-2xs bg-white p-3 rounded border border-slate-200">
                        <div>
                          <span className="text-slate-400 block font-medium">ASYCUDA CIF Imports</span>
                          <span className="font-mono font-bold text-slate-800">
                            ${reconciliations.customsImportsVsPurchases.asycudaCifImports.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">GL Import Purchases</span>
                          <span className="font-mono font-bold text-slate-800">
                            ${reconciliations.customsImportsVsPurchases.generalLedgerImportCosts.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Identified Variance</span>
                          <span className="font-mono font-bold text-rose-700">
                            ${reconciliations.customsImportsVsPurchases.variance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-2xs text-slate-600 mt-2">
                        {reconciliations.customsImportsVsPurchases.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 4: Queries */}
                {activeTab === 'queries' && (
                  <div className="p-5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Statutory Tax Queries Issued to Taxpayer
                    </h3>
                    <div className="space-y-3">
                      {queries.map((q) => (
                        <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-2xs font-bold text-indigo-700">
                              {q.reference}
                            </span>
                            <span
                              className={`text-2xs px-2 py-0.5 rounded font-bold ${
                                q.status === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mb-1">{q.subject}</h4>
                          <p className="text-xs text-slate-600 mb-2">{q.question}</p>
                          {q.taxpayerResponse?.responseText && (
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-2xs">
                              <span className="font-bold text-slate-700 block mb-0.5">Taxpayer Response:</span>
                              <p className="text-slate-600 italic">"{q.taxpayerResponse.responseText}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 5: Evidence */}
                {activeTab === 'evidence' && (
                  <div className="p-5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Verified Audit Evidence Register
                    </h3>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 text-2xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Ref</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3">Source</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {evidenceList.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-700">{e.reference}</td>
                            <td className="py-2 px-3">{e.description}</td>
                            <td className="py-2 px-3 text-slate-500">{e.source}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                                {e.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-2xs text-slate-500">{e.fileName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 6: Working Papers */}
                {activeTab === 'workingPapers' && (
                  <div className="p-5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Audit Working Papers & Field Notes
                    </h3>
                    <div className="space-y-3">
                      {workingPapers.map((wp) => (
                        <div key={wp.id} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-2xs font-bold text-indigo-700">
                              {wp.reference}
                            </span>
                            <span className="text-2xs px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
                              {wp.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{wp.title}</h4>
                          <p className="text-2xs text-slate-500 mt-1">Prepared by: {wp.preparedBy} on {wp.date}</p>
                          <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="font-bold text-slate-700 block mb-0.5">Work Performed:</span>
                            <p>{wp.workPerformed}</p>
                            <span className="font-bold text-slate-700 block mt-2 mb-0.5">Conclusions:</span>
                            <p className="text-slate-800">{wp.conclusions}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 7: Assessment Order */}
                {activeTab === 'assessment' && assessmentNotice && (
                  <div className="p-5">
                    <div className="max-w-2xl mx-auto border border-slate-300 rounded-lg p-6 bg-white shadow-xs">
                      <div className="text-center pb-4 border-b border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                          Revenue Authority • Large Taxpayer Directorate
                        </span>
                        <h2 className="text-base font-bold text-slate-900 mt-1">
                          FORMAL STATUTORY NOTICE OF ASSESSMENT
                        </h2>
                        <span className="font-mono text-xs text-indigo-700 font-bold block mt-1">
                          {assessmentNotice.noticeNumber}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-500 block">Taxpayer Name</span>
                          <strong className="text-slate-900">{activeCase.taxpayerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">TIN</span>
                          <strong className="font-mono text-slate-900">{activeCase.tin}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Tax Period</span>
                          <strong className="text-slate-900">{activeCase.taxPeriod}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">30-Day Objection Deadline</span>
                          <strong className="font-mono text-rose-700">{assessmentNotice.statutoryDue30Days}</strong>
                        </div>
                      </div>

                      <div className="py-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">Principal Tax Adjustment</span>
                          <span className="font-mono font-bold text-slate-900">
                            ${assessmentNotice.principalTax.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 text-amber-800">
                          <span>Statutory Section 112 Penalty (20%)</span>
                          <span className="font-mono font-bold">
                            ${assessmentNotice.statutoryPenalty20.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600">
                          <span>Statutory Late Payment Interest</span>
                          <span className="font-mono font-bold">
                            ${assessmentNotice.interest.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-slate-300 text-sm font-bold text-slate-900">
                          <span>Total Amount Payable</span>
                          <span className="font-mono text-indigo-700">
                            ${assessmentNotice.totalAssessmentDue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Audit Trail Drawer */}
      <AuditTrailDrawer
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
        entries={auditTrail}
        caseId={selectedCaseId}
      />
    </div>
  );
};

export default TeamLeaderWorkspace;
