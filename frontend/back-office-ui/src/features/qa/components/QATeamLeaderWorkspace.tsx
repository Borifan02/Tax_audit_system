import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Building2,
  Calendar,
  Hash,
  Scale,
  Award,
  AlertOctagon,
  FolderSync,
  Clock,
  ArrowRight,
  Loader2,
  FileCheck2,
  CheckSquare,
  MessageSquare,
  History
} from 'lucide-react';
import { QACaseReview, AuthUser } from '../types/audit';
import { itasApi } from '../services/api';
import { QAInformationProgressTracker } from './QAInformationProgressTracker';
import { AuditTrailDrawer } from '../../da/components/workspace/AuditTrailDrawer';

interface QATeamLeaderWorkspaceProps {
  currentUser: AuthUser;
  onSelectCase?: (caseId: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const QATeamLeaderWorkspace: React.FC<QATeamLeaderWorkspaceProps> = ({
  currentUser,
  onSelectCase,
  activeTab = 'QUEUE',
  onTabChange
}) => {
  const [qaCases, setQaCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QA-2026-002');
  const [activeReview, setActiveReview] = useState<QACaseReview | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'ACTION_REQUIRED' | 'ALL'>('ACTION_REQUIRED');

  // Action states
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<
    'ISSUE_DEFICIENCY_NOTICE' | 'RETURN_TO_OFFICER' | 'RECOMMEND_FOR_DIRECTOR_SIGNOFF'
  >('RECOMMEND_FOR_DIRECTOR_SIGNOFF');
  const [actionComment, setActionComment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load reviews list
  const loadQACases = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await itasApi.getQACases({ all: true });
      setQaCases(data);
      if (data.length > 0 && !data.some((c: any) => c.id === selectedCaseId)) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load QA cases:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedCaseId]);

  // Load active review details
  const loadActiveReview = useCallback(async (id: string) => {
    setIsLoadingReview(true);
    try {
      const review = await itasApi.getQACase(id);
      setActiveReview(review);
    } catch (err) {
      console.error('Failed to load review details:', err);
    } finally {
      setIsLoadingReview(false);
    }
  }, []);

  useEffect(() => {
    loadQACases();
  }, [loadQACases]);

  useEffect(() => {
    if (selectedCaseId) {
      loadActiveReview(selectedCaseId);
    }
  }, [selectedCaseId, loadActiveReview]);

  // Filter list
  const filteredCases = qaCases.filter((c) => {
    if (filterMode === 'ACTION_REQUIRED') {
      return (
        c.status === 'PENDING_TL_REVIEW' ||
        c.status === 'AUDIT_RESPONSE_RECEIVED' ||
        c.status === 'IN_REVIEW'
      );
    }
    return true;
  });

  const handleOpenActionModal = (
    action: 'ISSUE_DEFICIENCY_NOTICE' | 'RETURN_TO_OFFICER' | 'RECOMMEND_FOR_DIRECTOR_SIGNOFF'
  ) => {
    setSelectedAction(action);
    if (action === 'RECOMMEND_FOR_DIRECTOR_SIGNOFF') {
      setActionComment(
        'Quality Assurance standards verified and validated. Substantive procedures and reconciliations satisfy ISO 19011. Recommended for Director Statutory Certification.'
      );
    } else if (action === 'ISSUE_DEFICIENCY_NOTICE') {
      setActionComment(
        'Formal Quality Deficiency Notice issued to Audit Team. Mandatory documentation refresh required before statutory endorsement.'
      );
    } else {
      setActionComment('Please expand testing samples on cross-tax reconciliations and clarify working paper citations.');
    }
    setIsActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!activeReview || !actionComment) return;

    setIsProcessing(true);
    try {
      const res = await itasApi.executeQAWorkflow(activeReview.id, {
        action: selectedAction,
        comment: actionComment
      });

      if (res.success) {
        setIsActionModalOpen(false);
        await loadActiveReview(activeReview.id);
        await loadQACases();
        alert('QA Supervisory action successfully recorded and dispatched to all stakeholders.');
      } else {
        alert(res.error || 'Action failed');
      }
    } catch (err) {
      console.error('Workflow execution failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  QA Team Leader Supervisory & Technical Review Portal
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800">
                  Level 4 Review
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Technical Reviewer: <strong>{currentUser.name}</strong> · Division of Quality Surveillance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadQACases();
                if (selectedCaseId) loadActiveReview(selectedCaseId);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Refresh Queue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setFilterMode('ACTION_REQUIRED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'ACTION_REQUIRED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Action Required ({qaCases.filter((c) => c.status === 'PENDING_TL_REVIEW' || c.status === 'AUDIT_RESPONSE_RECEIVED').length})
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All QA Files ({qaCases.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Review Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                Quality Review Files Queue
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                Select an audit file to inspect ISO 19011 dimensional scores and validate deficiencies.
              </span>
            </div>

            {isLoadingList ? (
              <div className="text-center py-8 text-slate-400 font-mono text-xs">
                Loading reviews...
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-xs text-slate-500">
                No quality files currently match the selected filter.
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = c.id === selectedCaseId;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-1 ring-amber-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-2xs font-bold text-slate-700">
                        {c.caseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'PENDING_TL_REVIEW'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-mono'
                            : c.status === 'AUDIT_RESPONSE_RECEIVED'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-mono'
                            : c.status === 'PASSED_COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-900'
                            : c.status === 'DEFICIENCY_ISSUED'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{c.taxpayerName}</h4>

                    <div className="mt-2 flex items-center justify-between text-2xs text-slate-500 font-mono">
                      <span>Audit: {c.auditCaseNumber}</span>
                      <span className="font-bold text-amber-700">Score: {c.overallScore}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Review Evaluation Panel (8 cols) */}
          <div className="lg:col-span-8">
            {isLoadingReview || !activeReview ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
                <span className="text-xs font-mono">Loading review details...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Embed Live Information Progress Tracker */}
                <QAInformationProgressTracker
                  review={activeReview}
                  onRefresh={() => {
                    loadQACases();
                    loadActiveReview(activeReview.id);
                  }}
                />

                {/* Audit Response Alert Card (When Audit Team has submitted remediation) */}
                {activeReview.status === 'AUDIT_RESPONSE_RECEIVED' && (
                  <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-xl text-xs text-indigo-950 shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          <strong className="text-indigo-950 font-bold">
                            Audit Team Remediation Received from Lead Auditor {activeReview.leadAuditor}:
                          </strong>
                        </div>
                        <p className="text-indigo-900 leading-relaxed italic mt-1 bg-white/80 p-3 rounded-lg border border-indigo-100 font-sans">
                          "{activeReview.auditTeamResponseNotes}"
                        </p>
                        <span className="text-2xs text-indigo-600 block mt-2 font-mono">
                          Submitted on: {activeReview.auditTeamResponseDate ? new Date(activeReview.auditTeamResponseDate).toLocaleString() : 'Recently'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenActionModal('RECOMMEND_FOR_DIRECTOR_SIGNOFF')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0"
                      >
                        Endorse for Director
                      </button>
                    </div>
                  </div>
                )}

                {/* File Inspection Details */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-6 p-6">
                  {/* File Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <div className="flex items-center gap-2 text-2xs font-mono text-slate-500 mb-1">
                        <span className="font-bold text-indigo-700">{activeReview.caseNumber}</span>
                        <span>·</span>
                        <span>Audit: {activeReview.auditCaseNumber}</span>
                        <span>·</span>
                        <span>TIN: {activeReview.tin}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{activeReview.taxpayerName}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Inspected by QA Officer: <strong>{activeReview.assignedQAOfficer}</strong> · Lead Auditor: <strong>{activeReview.leadAuditor}</strong>
                      </p>
                    </div>

                    {/* Score Card & Trail Button */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsAuditTrailOpen(true)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5"
                        title="View Full Audit Trail"
                      >
                        <History className="w-4 h-4 text-purple-600" />
                        <span className="hidden sm:inline">Audit Trail</span>
                      </button>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0">
                        <span className="text-2xs text-slate-500 uppercase font-bold block">Assigned Score</span>
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-2xl font-black font-mono text-amber-700">{activeReview.overallScore}</span>
                          <span className="text-xs text-slate-400 font-bold">/100</span>
                        </div>
                        <span className="text-2xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono mt-0.5 inline-block">
                          {activeReview.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Supervisory Action Callout */}
                  <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                          Team Leader Technical Decisions
                        </h4>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Validate inspection completeness, issue deficiency notices, or recommend for Director certification.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenActionModal('ISSUE_DEFICIENCY_NOTICE')}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          Issue Deficiency Notice
                        </button>

                        <button
                          onClick={() => handleOpenActionModal('RETURN_TO_OFFICER')}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          Return to Officer
                        </button>

                        <button
                          onClick={() => handleOpenActionModal('RECOMMEND_FOR_DIRECTOR_SIGNOFF')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          Recommend for Director Sign-Off
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 7-Dimension Overview Table */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Dimensional Quality Assessment Breakdown
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                      {activeReview.dimensions.map((dim) => (
                        <div key={dim.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-2xs font-bold text-indigo-700">{dim.id}</span>
                              <strong className="text-slate-900 text-xs truncate">{dim.title}</strong>
                            </div>
                            <p className="text-2xs text-slate-500 mt-0.5 truncate">{dim.reviewerNotes || 'Standard verified.'}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-2xs text-slate-400">Weight: {dim.weight}%</span>
                            <span className="font-mono font-bold text-xs text-indigo-700">{dim.score}%</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                dim.status === 'COMPLIANT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : dim.status === 'MINOR_DEFICIENCY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {dim.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Itemized Deficiencies */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Documented Deficiencies ({activeReview.deficiencies.length})
                      </h3>
                    </div>

                    {activeReview.deficiencies.length === 0 ? (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        ✓ No material non-compliance deficiencies documented on this audit file.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeReview.deficiencies.map((def) => (
                          <div key={def.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.2 rounded font-mono font-bold text-[10px] ${
                                    def.severity === 'CRITICAL'
                                      ? 'bg-rose-100 text-rose-800'
                                      : def.severity === 'MAJOR'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {def.severity}
                                </span>
                                <strong className="text-slate-900">{def.title}</strong>
                              </div>
                              <span className="font-mono text-2xs text-slate-400">{def.status}</span>
                            </div>
                            <p className="text-slate-600 text-2xs mt-1">{def.findingDescription}</p>
                            <div className="mt-2 text-2xs bg-white p-2 rounded border border-slate-200 text-indigo-900">
                              <strong>Mandatory Remediation:</strong> {def.correctiveActionMandate}
                            </div>
                            {def.auditorResponse && (
                              <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200 text-2xs text-emerald-900 italic">
                                <strong>Audit Team Response:</strong> {def.auditorResponse}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Audit Trail Drawer */}
      {activeReview && (
        <AuditTrailDrawer
          isOpen={isAuditTrailOpen}
          onClose={() => setIsAuditTrailOpen(false)}
          entries={activeReview.auditTrail || []}
          caseId={activeReview.caseNumber}
        />
      )}

      {/* Supervisory Action Modal */}
      {isActionModalOpen && activeReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Execute QA Supervisory Action
              </h3>
              <button onClick={() => setIsActionModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <strong>Selected Action:</strong> {selectedAction.replace(/_/g, ' ')}
              </div>

              <div>
                <label className="font-bold block text-slate-800 mb-1">
                  Supervisory Instructions & Technical Justification
                </label>
                <textarea
                  rows={4}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Detail the rationale for this supervisory decision..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Confirm & Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QATeamLeaderWorkspace;
