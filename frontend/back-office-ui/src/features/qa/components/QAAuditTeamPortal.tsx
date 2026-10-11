import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Calendar,
  Hash,
  Scale,
  Award,
  AlertOctagon,
  FileText,
  Clock,
  MessageSquare,
  Loader2,
  FileCheck,
  Paperclip,
  RotateCcw
} from 'lucide-react';
import { QACaseReview, AuthUser } from '../types/audit';
import { itasApi } from '../services/api';
import { QAInformationProgressTracker } from './QAInformationProgressTracker';

interface QAAuditTeamPortalProps {
  currentUser: AuthUser;
  onBackToAudit?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const QAAuditTeamPortal: React.FC<QAAuditTeamPortalProps> = ({
  currentUser,
  onBackToAudit,
  activeTab = 'CASES',
  onTabChange
}) => {
  const [qaCases, setQaCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QA-2026-003');
  const [activeReview, setActiveReview] = useState<QACaseReview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [remediationText, setRemediationText] = useState<string>('');
  const [workingPaperRef, setWorkingPaperRef] = useState<string>('WP-RECTIFIED-REV-04');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await itasApi.getQACases({ all: true });
      setQaCases(data);
      if (data.length > 0 && !data.some((c: any) => c.id === selectedCaseId)) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load QA cases for audit team:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  const loadReview = useCallback(async (id: string) => {
    try {
      const review = await itasApi.getQACase(id);
      setActiveReview(review);
      setRemediationText(review.auditTeamResponseNotes || '');
    } catch (err) {
      console.error('Failed to load review:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedCaseId) {
      loadReview(selectedCaseId);
    }
  }, [selectedCaseId, loadReview]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview || !remediationText) return;

    setIsSubmitting(true);
    try {
      const compositeResponse = `${remediationText} [Rectification Working Paper Reference: ${workingPaperRef}]`;
      const res = await itasApi.executeQAWorkflow(activeReview.id, {
        action: 'SUBMIT_AUDIT_RESPONSE',
        comment: compositeResponse
      });

      if (res.success) {
        await loadReview(activeReview.id);
        await loadData();
        alert('Audit team remediation response successfully submitted to QA Directorate for verification.');
      } else {
        alert(res.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  Audit Team QA Response & Compliance Portal
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-100 text-indigo-800">
                  LTO Field Liaison
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Logged in as: <strong>{currentUser.name}</strong> ({currentUser.title})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadData();
                if (selectedCaseId) loadReview(selectedCaseId);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Refresh Cases"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {onBackToAudit && (
              <button
                onClick={onBackToAudit}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Cases list */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                QA Reviews on Your Audits
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Select an audit case to inspect formal QA scorecards and respond to required remediations.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-slate-400 font-mono text-xs">
                Loading audit reviews...
              </div>
            ) : (
              qaCases.map((c) => {
                const isSelected = c.id === selectedCaseId;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-2xs font-bold text-slate-700">
                        {c.caseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'DEFICIENCY_ISSUED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-mono animate-pulse'
                            : c.status === 'AUDIT_RESPONSE_RECEIVED'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono'
                            : c.status === 'PASSED_COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{c.taxpayerName}</h4>

                    <div className="mt-2 flex items-center justify-between text-2xs text-slate-500 font-mono">
                      <span>Audit: {c.auditCaseNumber}</span>
                      <span className="font-bold text-indigo-700">Score: {c.overallScore}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right QA Feedback & Response Form */}
          <div className="lg:col-span-8">
            {activeReview ? (
              <div className="space-y-5">
                {/* Embed Live Information Progress Tracker */}
                <QAInformationProgressTracker
                  review={activeReview}
                  onRefresh={() => {
                    loadData();
                    loadReview(activeReview.id);
                  }}
                />

                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
                  {/* File Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <div className="flex items-center gap-2 text-2xs font-mono text-slate-500 mb-1">
                        <span className="font-bold text-indigo-700">{activeReview.caseNumber}</span>
                        <span>·</span>
                        <span>Case: {activeReview.auditCaseNumber}</span>
                        <span>·</span>
                        <span>Exposure: ${activeReview.totalTaxAssessment?.toLocaleString()}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{activeReview.taxpayerName}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Reviewed by QA Inspector: <strong>{activeReview.assignedQAOfficer}</strong> · Supervising TL: <strong>{activeReview.qaTeamLeader}</strong>
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0">
                      <span className="text-2xs text-slate-500 uppercase font-bold block">QA Score</span>
                      <span className="text-2xl font-black font-mono text-indigo-700">{activeReview.overallScore}/100</span>
                      <span className="text-2xs font-bold block text-slate-600 font-mono mt-0.5">{activeReview.rating}</span>
                    </div>
                  </div>

                  {/* Team Leader Deficiency Directive Callout */}
                  {activeReview.qaTeamLeaderComment && (
                    <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-950 shadow-2xs">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                        <strong className="font-bold text-rose-950">
                          Formal QA Deficiency Notice Directive ({activeReview.qaTeamLeader}):
                        </strong>
                      </div>
                      <p className="italic leading-relaxed font-medium bg-white/80 p-3 rounded-lg border border-rose-200 mt-1">
                        "{activeReview.qaTeamLeaderComment}"
                      </p>
                      <span className="text-2xs text-rose-700 block mt-2 font-mono">
                        Served Date: {activeReview.qaTeamLeaderDecisionDate ? new Date(activeReview.qaTeamLeaderDecisionDate).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                  )}

                  {/* Deficiencies to Remediate */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Deficiencies Requiring Audit Team Remediation ({activeReview.deficiencies.length})
                    </h3>

                    {activeReview.deficiencies.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        ✓ No open deficiencies pending remediation on this audit file.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeReview.deficiencies.map((d) => (
                          <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <strong className="text-slate-900 font-bold text-sm">{d.title}</strong>
                              <span className="px-2 py-0.2 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800">
                                {d.severity}
                              </span>
                            </div>
                            <p className="text-slate-700 text-xs mt-1 leading-relaxed">{d.findingDescription}</p>
                            <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-slate-200 text-2xs text-indigo-950 font-medium">
                              <strong className="text-indigo-900 block mb-0.5">Mandated Remediation Directive:</strong>
                              <span>{d.correctiveActionMandate}</span>
                            </div>
                            <div className="mt-2 text-2xs text-slate-500 font-mono">
                              Statutory Breach: {d.statutoryBreach}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formal Remediation Submission Form */}
                  <form onSubmit={handleSubmitResponse} className="pt-5 border-t border-slate-200 space-y-4 text-xs">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Submit Formal Audit Team Justification / Remediation Plan
                      </h3>
                      <p className="text-2xs text-slate-500 mt-0.5">
                        Detail the corrective testing performed, updated working paper cross-references, and statutory citations.
                      </p>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Updated Working Paper / Evidence Reference
                      </label>
                      <input
                        type="text"
                        required
                        value={workingPaperRef}
                        onChange={(e) => setWorkingPaperRef(e.target.value)}
                        placeholder="e.g. WP-TP-2026-REV2 or Bureau van Dijk Comparable Refresh"
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Detailed Remediation Response & Substantive Technical Explanation
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={remediationText}
                        onChange={(e) => setRemediationText(e.target.value)}
                        placeholder="Enter audit team remediation response, refreshed economic benchmarking data, and legal citations..."
                        className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed font-sans"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <span className="text-2xs text-slate-500">
                        Submission will update status to <strong>AUDIT_RESPONSE_RECEIVED</strong> and notify QA Team Leader.
                      </span>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Submit Remediation to QA Directorate</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QAAuditTeamPortal;
