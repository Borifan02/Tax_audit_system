import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Send,
  Scale,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Loader2,
  FileCheck,
  Award,
  BadgeAlert,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileSignature
} from 'lucide-react';
import {
  AuditCase,
  AuditFinding,
  DraftReport,
  AuditTrailEntry,
  AssessmentNotice,
  AuthUser
} from '../../types/audit';
import { itasApi } from '../../services/api';
import { AuditTrailDrawer } from '../workspace/AuditTrailDrawer';

interface DirectorWorkspaceProps {
  currentUser: AuthUser;
  onSelectCase?: (caseId: string) => void;
}

export const DirectorWorkspace: React.FC<DirectorWorkspaceProps> = ({
  currentUser,
  onSelectCase
}) => {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CA-2026-103');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [caseLoading, setCaseLoading] = useState<boolean>(false);
  const [filterPendingOnly, setFilterPendingOnly] = useState<boolean>(true);

  // Loaded full case
  const [activeCase, setActiveCase] = useState<AuditCase | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [assessmentNotice, setAssessmentNotice] = useState<AssessmentNotice | null>(null);
  const [draftReport, setDraftReport] = useState<DraftReport | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Action states
  const [actionType, setActionType] = useState<
    'DIRECTOR_APPROVE' | 'DIRECTOR_RETURN' | 'AUTHORIZE_FRAUD' | 'EXTEND_SCOPE' | null
  >(null);
  const [actionComment, setActionComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);

  // Load cases list
  const loadCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await itasApi.getAssignedCases(false);
      setCasesList(list);
      // Select first pending director approval if available
      const pending = list.find((c) => c.status === 'PENDING_DIRECTOR_APPROVAL');
      if (pending && !list.some((c) => c.id === selectedCaseId && c.status === 'PENDING_DIRECTOR_APPROVAL')) {
        setSelectedCaseId(pending.id);
      } else if (list.length > 0 && !list.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load director cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Load case details
  const loadFullCase = useCallback(async (caseId: string) => {
    setCaseLoading(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const fullCase = await itasApi.getFullCase(caseId);
      setActiveCase(fullCase.auditCase);
      setFindings(fullCase.findings || []);
      setAssessmentNotice(fullCase.assessmentNotice || null);
      setDraftReport(fullCase.draftReport || null);
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

  // Cases requiring director decision
  const pendingCases = casesList.filter(
    (c) => c.status === 'PENDING_DIRECTOR_APPROVAL' || c.status === 'REFERRED_TO_FRAUD_INVESTIGATION'
  );

  const displayedCases = filterPendingOnly ? pendingCases : casesList;

  // Execute Director Statutory Decision
  const handleExecuteDirectorDecision = async () => {
    if (!activeCase || !actionType) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      let workflowAction: any = '';
      if (actionType === 'DIRECTOR_APPROVE') {
        workflowAction = 'DIRECTOR_APPROVE';
      } else if (actionType === 'DIRECTOR_RETURN') {
        workflowAction = 'DIRECTOR_RETURN';
      } else if (actionType === 'AUTHORIZE_FRAUD') {
        workflowAction = 'AUTHORIZE_FRAUD_PROSECUTION';
      } else if (actionType === 'EXTEND_SCOPE') {
        workflowAction = 'ESCALATE_COMPREHENSIVE';
      }

      const res = await itasApi.executeWorkflow(activeCase.id, {
        action: workflowAction,
        comment: actionComment,
        user: currentUser.name
      });

      if (res.success) {
        setActionSuccessMessage(
          actionType === 'DIRECTOR_APPROVE'
            ? 'Executive Statutory Approval endorsed! Final Assessment Notice authorized for issuance.'
            : actionType === 'DIRECTOR_RETURN'
            ? 'Case returned to Team Leader and Lead Auditor with executive instructions.'
            : actionType === 'AUTHORIZE_FRAUD'
            ? 'Criminal prosecution transfer signed and dispatched to Tax Fraud Directorate.'
            : 'Audit scope extension authorized.'
        );
        setActionType(null);
        setActionComment('');
        await loadCases();
        await loadFullCase(activeCase.id);
      }
    } catch (err: any) {
      setActionError(err.message || 'Director action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAssessment = assessmentNotice?.totalAssessmentDue || findings.reduce((s, f) => s + f.totalTaxImpact, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900/5 flex flex-col">
      {/* Top Executive Header */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100">
                  Director & Process Owner Executive Decision Portal
                </h1>
                <span className="text-2xs px-2 py-0.5 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  SOR FR-04.7 Executive Authority
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Director:{' '}
                <strong className="text-slate-200">{currentUser.name}</strong> • Directorate:{' '}
                <span className="text-slate-300">{currentUser.directorate}</span> • Clearance:{' '}
                <span className="text-slate-300 font-mono text-2xs">{currentUser.clearanceLevel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-800/80 flex items-center gap-3 text-xs">
              <div>
                <span className="text-purple-300 block text-[10px] uppercase font-bold tracking-wider">
                  Decisions Pending
                </span>
                <span className="text-sm font-bold text-purple-200">
                  {pendingCases.length} High-Exposure Cases
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAuditTrailOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Executive Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Significant / Escalated Cases Queue */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cases Requiring Director Action
                </h2>
              </div>
              <button
                onClick={() => setFilterPendingOnly(!filterPendingOnly)}
                className={`text-2xs px-2 py-0.5 rounded font-bold transition-colors ${
                  filterPendingOnly
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {filterPendingOnly ? 'Pending Only' : 'All Cases'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {displayedCases.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">No pending executive approvals.</p>
                  <p className="text-slate-400 text-2xs mt-1">
                    Team Leaders handle cases below the $500,000 threshold.
                  </p>
                </div>
              ) : (
                displayedCases.map((c) => {
                  const isSelected = c.id === selectedCaseId;
                  const isPending = c.status === 'PENDING_DIRECTOR_APPROVAL';
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50/70 border-l-4 border-purple-600'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-mono text-2xs font-bold text-purple-700 block">
                            {c.caseNumber}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900 leading-tight">
                            {c.taxpayerName}
                          </h3>
                        </div>
                        <span
                          className={`text-2xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                            c.status === 'PENDING_DIRECTOR_APPROVAL'
                              ? 'bg-purple-100 text-purple-800 animate-pulse'
                              : c.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'REFERRED_TO_FRAUD_INVESTIGATION'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-2xs text-slate-500 flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span>Risk Score: <strong className="text-rose-700">{c.riskScore}/100</strong></span>
                        <span className="font-bold text-slate-900 font-mono">
                          ${(c.totalAssessment || 0).toLocaleString()}
                        </span>
                      </div>

                      {isPending && (
                        <div className="mt-2 bg-purple-50 border border-purple-200 rounded p-1.5 flex items-center gap-1.5 text-[11px] text-purple-900 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Recommended by Team Leader {c.teamLeader}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SOR FR-04.7 Executive Governance Rule Card */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-xs text-purple-950">
            <div className="flex items-start gap-2.5">
              <Scale className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Executive Statutory Mandate (SOR FR-04.7)</h4>
                <p className="mt-1 text-purple-900 leading-relaxed text-2xs">
                  Director / Process Owner approval is strictly reserved for:
                </p>
                <ul className="list-disc list-inside mt-1 text-2xs text-purple-900 space-y-0.5">
                  <li>Cases exceeding the <strong>$500,000</strong> tax adjustment threshold.</li>
                  <li>Cross-border transfer pricing & offshore treaty disputes.</li>
                  <li>Criminal tax evasion prosecution authorization.</li>
                </ul>
                <p className="mt-2 text-purple-800 italic text-2xs">
                  Routine audits are finalized at Team Leader level to ensure streamlined administration.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Executive Case Review & Decision Cockpit */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {caseLoading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-xs font-medium">Loading executive case dossier...</p>
            </div>
          ) : !activeCase ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Select a case file to render executive decisions.</p>
            </div>
          ) : (
            <>
              {/* Executive Case Header Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700">
                        {activeCase.caseNumber}
                      </span>
                      <span className="text-2xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                        Large Taxpayer Division
                      </span>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded font-bold ${
                          activeCase.status === 'PENDING_DIRECTOR_APPROVAL'
                            ? 'bg-purple-100 text-purple-800'
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
                      TIN: <strong className="font-mono text-slate-700">{activeCase.tin}</strong> • Tax Period:{' '}
                      <strong className="text-slate-700">{activeCase.taxPeriod}</strong> • Team Leader:{' '}
                      <strong className="text-slate-700">{activeCase.teamLeader}</strong>
                    </p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">
                      Executive Exposure Assessment
                    </span>
                    <span className="text-xl font-bold font-mono text-purple-950">
                      ${totalAssessment.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-purple-700 mt-0.5 font-medium">
                      Risk Score: {activeCase.riskScore}/100 (HIGH)
                    </span>
                  </div>
                </div>

                {/* Team Leader Recommendation Memo */}
                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    <span>Team Leader Substantive Recommendation Memo:</span>
                  </div>
                  <p className="text-xs text-slate-700 italic">
                    "{activeCase.teamLeaderRecommendation || 'Case substantive findings verified by Team Leader; submitted for Director Statutory Endorsement.'}"
                  </p>
                  <div className="mt-2 text-2xs text-slate-500 flex items-center justify-between">
                    <span>Supervisor: <strong>{activeCase.teamLeader}</strong></span>
                    <span>Date: {activeCase.teamLeaderDecisionDate ? new Date(activeCase.teamLeaderDecisionDate).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                {/* Director Decision Memo if exists */}
                {activeCase.directorComment && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md text-xs text-purple-950">
                    <span className="font-bold block mb-0.5">Your Recorded Statutory Endorsement:</span>
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

                {/* Executive Action Cockpit */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Executive Decisions:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setActionType('DIRECTOR_APPROVE');
                        setActionComment(
                          'Executive Directorate has reviewed the substantive evidence and Team Leader recommendation. Formal Statutory Notice of Assessment is hereby approved for issuance.'
                        );
                      }}
                      disabled={activeCase.status === 'APPROVED'}
                      className="px-4 py-2 text-xs font-bold rounded bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>Executive Statutory Approval & Issue Notice</span>
                    </button>

                    <button
                      onClick={() => {
                        setActionType('DIRECTOR_RETURN');
                        setActionComment(
                          'Returned by Executive Directorate: Insufficient third-party documentation for intercompany management fees. Re-perform substantive verification.'
                        );
                      }}
                      className="px-3.5 py-2 text-xs font-bold rounded border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Executive Return for Correction</span>
                    </button>

                    <button
                      onClick={() => {
                        setActionType('AUTHORIZE_FRAUD');
                        setActionComment(
                          'Executive Directorate formally authorizes transfer of case docket to Intelligence & Tax Fraud Investigation Directorate for criminal prosecution.'
                        );
                      }}
                      className="px-3.5 py-2 text-xs font-bold rounded border border-amber-400 text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                    >
                      <BadgeAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Authorize Criminal Prosecution</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Action Modal / Form */}
                {actionType && (
                  <div className="mt-4 p-4 rounded-lg border border-purple-300 bg-purple-50/50 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-purple-950 flex items-center gap-2">
                        {actionType === 'DIRECTOR_APPROVE' && <FileSignature className="w-4 h-4 text-purple-700" />}
                        {actionType === 'DIRECTOR_RETURN' && <RotateCcw className="w-4 h-4 text-rose-600" />}
                        {actionType === 'AUTHORIZE_FRAUD' && <BadgeAlert className="w-4 h-4 text-amber-600" />}
                        <span>
                          {actionType === 'DIRECTOR_APPROVE'
                            ? 'Executive Statutory Approval Instrument'
                            : actionType === 'DIRECTOR_RETURN'
                            ? 'Director Return Directive'
                            : 'Criminal Prosecution Transfer Authorization'}
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
                      className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                      placeholder="Enter executive directive or statutory endorsement remarks..."
                    />

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActionType(null)}
                        className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleExecuteDirectorDecision}
                        disabled={isSubmitting || !actionComment.trim()}
                        className={`px-4 py-1.5 text-xs font-bold rounded text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
                          actionType === 'DIRECTOR_APPROVE'
                            ? 'bg-purple-700 hover:bg-purple-800'
                            : actionType === 'DIRECTOR_RETURN'
                            ? 'bg-rose-700 hover:bg-rose-800'
                            : 'bg-amber-700 hover:bg-amber-800'
                        }`}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Sign & Execute Decision</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Exposure Breakdown & Findings Summary */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                  Substantive Audit Findings & Tax Adjustments
                </h3>

                <div className="space-y-3">
                  {findings.map((f, i) => (
                    <div
                      key={f.id || i}
                      className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs font-bold text-purple-700">
                            {f.reference}
                          </span>
                          <span className="text-2xs px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800">
                            {f.auditArea}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{f.title}</h4>
                        <p className="text-2xs text-slate-600 mt-0.5">{f.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xs text-slate-500 block">Total Impact</span>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          ${f.totalTaxImpact.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Tax: ${f.underDeclaredAmount.toLocaleString()} | Pen: ${f.penaltyAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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

export default DirectorWorkspace;
