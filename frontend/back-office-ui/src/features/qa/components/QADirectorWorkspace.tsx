import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Scale,
  Building2,
  Calendar,
  Hash,
  Send,
  Loader2,
  FileCheck2,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Clock,
  Sparkles,
  History,
  RotateCcw
} from 'lucide-react';
import { QACaseReview, AuthUser } from '../types/audit';
import { itasApi } from '../services/api';
import { QAInformationProgressTracker } from './QAInformationProgressTracker';
import { AuditTrailDrawer } from '../../da/components/workspace/AuditTrailDrawer';

interface QADirectorWorkspaceProps {
  currentUser: AuthUser;
  onSelectCase?: (caseId: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const QADirectorWorkspace: React.FC<QADirectorWorkspaceProps> = ({
  currentUser,
  onSelectCase,
  activeTab = 'DASHBOARD',
  onTabChange
}) => {
  const [stats, setStats] = useState<any>(null);
  const [qaCases, setQaCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QA-2026-004');
  const [activeReview, setActiveReview] = useState<QACaseReview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [decisionAction, setDecisionAction] = useState<
    'DIRECTOR_CERTIFY_COMPLIANT' | 'DIRECTOR_ORDER_REAUDIT'
  >('DIRECTOR_CERTIFY_COMPLIANT');
  const [decisionComment, setDecisionComment] = useState<string>('');

  // Load stats and cases
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, casesData] = await Promise.all([
        itasApi.getQAStats(),
        itasApi.getQACases({ all: true })
      ]);
      setStats(statsData);
      setQaCases(casesData);
      if (casesData.length > 0 && !casesData.some((c: any) => c.id === selectedCaseId)) {
        setSelectedCaseId(casesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load QA Director data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  const loadActiveReview = useCallback(async (id: string) => {
    try {
      const data = await itasApi.getQACase(id);
      setActiveReview(data);
    } catch (err) {
      console.error('Failed to load QA case details:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedCaseId) {
      loadActiveReview(selectedCaseId);
    }
  }, [selectedCaseId, loadActiveReview]);

  const handleOpenDecision = (action: 'DIRECTOR_CERTIFY_COMPLIANT' | 'DIRECTOR_ORDER_REAUDIT') => {
    setDecisionAction(action);
    if (action === 'DIRECTOR_CERTIFY_COMPLIANT') {
      setDecisionComment(
        'The Directorate has examined the inspection working papers and hereby issues the official Statutory Quality Assurance Certificate under SOR FR-04.5. The audit findings and assessment notice are cleared for statutory issuance.'
      );
    } else {
      setDecisionComment(
        'Critical procedural non-compliance detected. Pursuant to Section 52 of the Tax Administration Act, a mandatory comprehensive re-audit is hereby ordered under a newly constituted audit team.'
      );
    }
    setIsDecisionModalOpen(true);
  };

  const handleExecuteDecision = async () => {
    if (!activeReview || !decisionComment) return;

    setIsProcessing(true);
    try {
      const res = await itasApi.executeQAWorkflow(activeReview.id, {
        action: decisionAction,
        comment: decisionComment
      });

      if (res.success) {
        setIsDecisionModalOpen(false);
        await loadData();
        await loadActiveReview(activeReview.id);
        alert('Executive Quality Directive officially recorded and promulgated to all stakeholders.');
      } else {
        alert(res.error || 'Execution failed');
      }
    } catch (err) {
      console.error('Executive decision failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md border border-purple-400/40">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  Director of Audit Quality Assurance & Technical Standards
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-900 text-purple-200 border border-purple-700">
                  Level 5 Executive Governance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Process Owner: <strong>{currentUser.name}</strong> · Executive Directorate of Quality & Oversight
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadData();
                if (selectedCaseId) loadActiveReview(selectedCaseId);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
              title="Refresh Portfolio"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              National Quality Index: <strong className="text-emerald-400">{stats?.averageScore || 82}%</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
              Audits QA Reviewed
            </span>
            <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
              {stats?.totalReviews || 4}
            </span>
            <span className="text-2xs text-slate-500 font-mono mt-0.5 block">100% LTO Mandatory Samples</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
              National Compliance Rate
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
              {stats?.compliancePassRate || 75}%
            </span>
            <span className="text-2xs text-emerald-600 font-mono mt-0.5 block">Target: &gt;80% Pass Rate</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
              Open Deficiencies
            </span>
            <span className="text-2xl font-black font-mono text-amber-700 mt-1 block">
              {stats?.totalDeficiencies || 4}
            </span>
            <span className="text-2xs text-rose-600 font-mono mt-0.5 block">
              {stats?.criticalDeficiencies || 1} Critical Flaw
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
              Pending Executive Action
            </span>
            <span className="text-2xl font-black font-mono text-purple-700 mt-1 block">
              {qaCases.filter((c) => c.status === 'PENDING_DIRECTOR_SIGNOFF').length}
            </span>
            <span className="text-2xs text-purple-600 font-mono mt-0.5 block">Statutory Directives</span>
          </div>
        </div>

        {/* Executive Decisions Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Cases Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                Quality Certifications Queue
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Audit files escalated for Director Quality Certification or binding Re-Audit orders.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-slate-400 font-mono text-xs">
                Loading executive queue...
              </div>
            ) : (
              qaCases.map((c) => {
                const isSelected = c.id === selectedCaseId;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-500 shadow-xs ring-1 ring-purple-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-2xs font-bold text-slate-700">
                        {c.caseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          c.status === 'PENDING_DIRECTOR_SIGNOFF'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300 animate-pulse'
                            : c.status === 'PASSED_COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-900'
                            : c.status === 'REJECTED_REAUDIT_MANDATED'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{c.taxpayerName}</h4>

                    <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-500 font-mono">
                      <span>Audit: {c.auditCaseNumber}</span>
                      <span className="font-bold text-purple-700">Score: {c.overallScore}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Executive Dossier & Directive Controls (8 cols) */}
          <div className="lg:col-span-8">
            {activeReview ? (
              <div className="space-y-5">
                {/* Embed Live Information Progress Tracker */}
                <QAInformationProgressTracker
                  review={activeReview}
                  onRefresh={() => {
                    loadData();
                    loadActiveReview(activeReview.id);
                  }}
                />

                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <div className="flex items-center gap-2 text-2xs font-mono text-slate-500 mb-1">
                        <span className="font-bold text-purple-700">{activeReview.caseNumber}</span>
                        <span>·</span>
                        <span>Audit: {activeReview.auditCaseNumber}</span>
                        <span>·</span>
                        <span className="text-indigo-700 font-semibold font-mono">
                          ${activeReview.totalTaxAssessment?.toLocaleString()} Exposure
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{activeReview.taxpayerName}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Lead QA Officer: <strong>{activeReview.assignedQAOfficer}</strong> · QA Supervisor: <strong>{activeReview.qaTeamLeader}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsAuditTrailOpen(true)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5"
                        title="View Full Audit Trail"
                      >
                        <History className="w-4 h-4 text-purple-600" />
                        <span className="hidden sm:inline">Audit Trail</span>
                      </button>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-right shrink-0">
                        <span className="text-2xs text-purple-700 uppercase font-bold block">Assigned Score</span>
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-2xl font-black font-mono text-purple-900">{activeReview.overallScore}</span>
                          <span className="text-xs text-purple-400 font-bold">/100</span>
                        </div>
                        <span className="text-2xs font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-mono mt-0.5 inline-block">
                          {activeReview.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Director Decision Banner */}
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white rounded-xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-purple-300" />
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-200 font-mono">
                            Director Statutory Directive
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Promulgate Official Quality Assurance Certification
                        </h4>
                        <p className="text-2xs text-purple-200 mt-1 max-w-lg leading-relaxed">
                          Execute executive statutory certification under SOR FR-04.5 to clear the audit assessment for formal taxpayer service, or mandate full re-audit.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenDecision('DIRECTOR_ORDER_REAUDIT')}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          Mandate Re-Audit
                        </button>

                        <button
                          onClick={() => handleOpenDecision('DIRECTOR_CERTIFY_COMPLIANT')}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          Grant Certification
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Team Leader Recommendation Callout */}
                  {activeReview.qaTeamLeaderComment && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        QA Team Leader Endorsement Recommendation ({activeReview.qaTeamLeader}):
                      </span>
                      <p className="italic text-slate-800 leading-relaxed font-medium">
                        "{activeReview.qaTeamLeaderComment}"
                      </p>
                    </div>
                  )}

                  {/* Audit Team Remediation Callout (if present) */}
                  {activeReview.auditTeamResponseNotes && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                      <span className="font-bold text-emerald-800 block mb-1">
                        Audit Team Remediation Response ({activeReview.leadAuditor}):
                      </span>
                      <p className="italic text-emerald-900 leading-relaxed font-medium">
                        "{activeReview.auditTeamResponseNotes}"
                      </p>
                    </div>
                  )}

                  {/* Dimensions Overview */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      ISO 19011 Compliance Dimensions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {activeReview.dimensions.map((dim) => (
                        <div key={dim.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-slate-900">{dim.title}</span>
                            <span className="text-2xs text-slate-500 font-mono">{dim.standardsReference}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-indigo-700">{dim.score}%</span>
                            <span className="text-[10px] block text-slate-400 font-mono">{dim.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deficiencies */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Flagged Deficiencies ({activeReview.deficiencies.length})
                    </h3>
                    {activeReview.deficiencies.length === 0 ? (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        ✓ No material non-compliance deficiencies recorded. Audit satisfies all statutory standards.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeReview.deficiencies.map((d) => (
                          <div key={d.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{d.title}</strong>
                              <p className="text-2xs text-slate-600 mt-0.5">{d.findingDescription}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-800">
                              {d.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Systemic Vulnerabilities Radar (When STANDARDS tab or general view) */}
                  {(activeTab === 'STANDARDS' || activeTab === 'DASHBOARD') && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-700" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          National Systemic Audit Vulnerabilities Radar (SOR FR-04.5 Surveillance)
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
                          <strong className="text-purple-950 block text-xs font-bold">1. Transfer Pricing Benchmarking Latency</strong>
                          <p className="text-2xs text-purple-900 mt-1 leading-relaxed">
                            Audit teams across LTO Energy & Manufacturing divisions are relying on Pan-African BvD benchmark sets older than 2 fiscal years, causing legal vulnerability under TP Regs S.14(3).
                          </p>
                          <span className="text-[10px] font-mono text-purple-700 font-bold mt-2 block">
                            Direct Action: Mandating direct Bureau van Dijk real-time gateway access for all LTO teams.
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
                          <strong className="text-indigo-950 block text-xs font-bold">2. Third-Party Offshore Bank Verification</strong>
                          <p className="text-2xs text-indigo-900 mt-1 leading-relaxed">
                            40% of reviewed files utilized taxpayer-provided paper statements rather than direct SWIFT Inter-Bank API confirmations for foreign currency accounts.
                          </p>
                          <span className="text-[10px] font-mono text-indigo-700 font-bold mt-2 block">
                            Direct Action: Central Bank secure escrow confirmation channel integrated into ITAS v4.8.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
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

      {/* Decision Modal */}
      {isDecisionModalOpen && activeReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Promulgate Statutory Quality Directive
              </h3>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-950 font-medium">
                <strong>Statutory Action:</strong> {decisionAction.replace(/_/g, ' ')}
              </div>

              <div>
                <label className="font-bold block text-slate-800 mb-1">
                  Executive Statutory Order Directive Text
                </label>
                <textarea
                  rows={4}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDecision}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Sign & Promulgate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QADirectorWorkspace;
