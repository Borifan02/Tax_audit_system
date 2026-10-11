import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
  Calculator, CheckSquare,
  RefreshCw, ArrowLeft, FileSearch, HelpCircle
} from 'lucide-react';
import { Card, Button, Badge } from '../../../../components/ui/index';
import { itasApi } from '../../services/api';
import { TeamLeaderActionModal } from './TeamLeaderActionModal';
import { CaseFullData } from '../../data/initialData';
import { formatRevenue } from '../../../ap/utils/revenueFormatter';

interface DaTeamLeaderWorkspaceProps {
  caseId: string;
  onBack: () => void;
  onRefresh?: () => void;
}

export const DaTeamLeaderWorkspace: React.FC<DaTeamLeaderWorkspaceProps> = ({ 
  caseId, 
  onBack,
  onRefresh 
}) => {
  const [data, setData] = useState<CaseFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCase = async () => {
    setLoading(true);
    try {
      const caseData = await itasApi.getCaseData(caseId);
      setData(caseData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const handleDecision = async (action: 'APPROVE_AUDIT' | 'RETURN_FOR_CORRECTION', comment: string) => {
    if (!data) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      // Resolve actorId from session storage (set at login)
      const actorId =
        localStorage.getItem('itas_actor_id') ||
        sessionStorage.getItem('itas_actor_id') ||
        localStorage.getItem('userId') ||
        'team_leader';

      // Call the real backend workflow API
      await itasApi.executeWorkflow(caseId, {
        action,
        comment,
        user: actorId,
      });

      // Update local state to reflect change immediately
      const newStatus = action === 'APPROVE_AUDIT' ? 'APPROVED' : 'RETURNED_FOR_CORRECTION';
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          auditCase: {
            ...prev.auditCase,
            status: newStatus,
            teamLeaderComment: comment,
          },
          auditTrail: [
            {
              id: 'at-' + Date.now(),
              timestamp: new Date().toISOString(),
              actor: actorId,
              action,
              description: comment,
              type: action === 'APPROVE_AUDIT' ? 'success' : 'alert',
            } as any,
            ...(prev.auditTrail || []),
          ],
        };
      });

      setFeedback({
        type: 'success',
        message:
          action === 'APPROVE_AUDIT'
            ? '✅ Audit approved and endorsed. The auditor has been notified.'
            : '↩️ Case returned to auditor with your correction instructions.',
      });

      // Navigate back after 2 seconds
      setTimeout(() => {
        if (onRefresh) onRefresh();
        onBack();
      }, 2000);
    } catch (err: any) {
      console.error('Decision failed:', err);
      setFeedback({
        type: 'error',
        message: `Failed to submit decision: ${err?.message || 'Unknown error. Please try again.'}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading Submitted Audit Workspace...</p>
        </div>
      </div>
    );
  }

  const { auditCase, procedures, findings, draftReport, analysis, evidence, queries } = data;
  const totalImpact = findings.reduce((sum, f) => sum + (f.totalTaxImpact || 0), 0);
  const isDecided = ['APPROVED', 'RETURNED_FOR_CORRECTION'].includes(auditCase.status);

  return (
    <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Team Leader Review — Desk Audit
              </h1>
              <Badge
                variant={
                  auditCase.status === 'APPROVED' ? 'success' :
                  auditCase.status === 'RETURNED_FOR_CORRECTION' ? 'danger' :
                  auditCase.status === 'SUBMITTED' ? 'warning' : 'default'
                }
              >
                {auditCase.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Case {auditCase.caseNumber} · {auditCase.taxpayerName} · TIN: {auditCase.tin || auditCase.taxpayerId}
            </p>
          </div>
        </div>

        {!isDecided && (
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            disabled={actionLoading}
            className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
          >
            {actionLoading ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <ShieldCheck size={16} className="mr-2" />
            )}
            {actionLoading ? 'Processing...' : 'Make Decision'}
          </Button>
        )}
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6 pb-32">

        {/* ── Feedback Banner ──────────────────────────────── */}
        {feedback && (
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
        )}

        {/* ── Decision Banner if already decided ─────────── */}
        {isDecided && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Decision Already Recorded</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Status: <strong>{auditCase.status}</strong>
                {auditCase.teamLeaderComment && (
                  <span> — Comment: "{auditCase.teamLeaderComment}"</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Summary Stats ─────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-indigo-500">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Procedures</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{procedures.length}</h3>
              <span className="text-sm font-medium text-emerald-600">
                {procedures.filter(p => p.status === 'COMPLETED').length} Done
              </span>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Findings</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{findings.length}</h3>
              <span className="text-sm font-medium text-amber-600">Identified</span>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-purple-500">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Evidence</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{evidence?.length || 0}</h3>
              <span className="text-sm font-medium text-purple-600">
                {(evidence || []).filter(e => e.status === 'Verified').length} Verified
              </span>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Tax Impact</p>
            <h3 className="text-xl font-bold text-emerald-700">{formatRevenue(totalImpact)}</h3>
          </Card>
        </div>

        {/* ── Analysis Notes ────────────────────────────── */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Return & Ratio Analysis Notes</h3>
          </div>
          <div className="p-5">
            {analysis?.notes ? (
              <div className="bg-white border border-gray-200 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {analysis.notes}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No analysis notes submitted by auditor.</p>
            )}
          </div>
        </Card>

        {/* ── Evidence ─────────────────────────────────── */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Evidence Collected ({evidence?.length || 0})</h3>
          </div>
          {evidence && evidence.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {evidence.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{e.reference}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{e.description}</td>
                    <td className="px-5 py-3 text-gray-600">{e.source}</td>
                    <td className="px-5 py-3">
                      <Badge variant={e.status === 'Verified' ? 'success' : 'default'}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-sm text-gray-500 italic">No evidence collected.</div>
          )}
        </Card>

        {/* ── Audit Procedures ──────────────────────────── */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-800">Audit Procedures ({procedures.length})</h3>
          </div>
          {procedures && procedures.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Comments</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {procedures.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{p.code}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{p.description}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{p.comments || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={p.status === 'COMPLETED' ? 'success' : p.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-sm text-gray-500 italic">No audit procedures executed.</div>
          )}
        </Card>

        {/* ── Queries ───────────────────────────────────── */}
        {queries && queries.length > 0 && (
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Taxpayer Queries ({queries.length})</h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Statutory Basis</th>
                  <th className="px-5 py-3 font-semibold">Due Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {queries.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{q.subject}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{q.statutoryBasis || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{q.dueDate || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={q.status === 'RESOLVED' ? 'success' : 'warning'}>{q.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* ── Findings ──────────────────────────────────── */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">
              Audit Findings & Tax Adjustments ({findings.length})
            </h3>
          </div>
          {findings.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ref</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Tax Type</th>
                  <th className="px-5 py-3 font-semibold text-right">Under-Declared</th>
                  <th className="px-5 py-3 font-semibold text-right">Penalty</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {findings.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{f.reference}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{f.title}</td>
                    <td className="px-5 py-3 text-gray-600">{f.taxType || f.auditArea}</td>
                    <td className="px-5 py-3 text-right">{formatRevenue(f.underDeclaredAmount || f.adjustmentAmount || 0)}</td>
                    <td className="px-5 py-3 text-right text-red-600">{formatRevenue(f.penaltyAmount || 0)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatRevenue(f.totalTaxImpact)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-right font-bold text-gray-700 text-sm">
                    TOTAL TAX ADJUSTMENT:
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700 text-base">
                    {formatRevenue(totalImpact)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="p-5 text-sm text-gray-500 italic">No findings reported.</div>
          )}
        </Card>

        {/* ── Draft Report ──────────────────────────────── */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800">Draft Report Summary</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Executive Summary', value: draftReport?.executiveSummary },
              { label: 'Scope & Objectives', value: draftReport?.scopeAndObjectives },
              { label: 'Methodology', value: draftReport?.methodology },
              { label: 'Findings Summary', value: draftReport?.findingsSummary },
              { label: 'Recommended Adjustments', value: draftReport?.recommendedAdjustments },
              { label: 'Statutory Recommendations', value: draftReport?.statutoryRecommendations },
            ].map(({ label, value }) => (
              <div key={label}>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">{label}</h4>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{value || 'Not provided.'}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Sticky Bottom CTA ─────────────────────────────── */}
      {!isDecided && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-lg px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Ready to make your supervisory decision?</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Case: {auditCase.caseNumber} · {auditCase.taxpayerName} · Total Impact: {formatRevenue(totalImpact)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
              disabled={actionLoading}
              className="border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold"
            >
              <ShieldCheck size={16} className="mr-2" />
              Make Supervisory Decision
            </Button>
          </div>
        </div>
      )}

      {/* ── Decision Modal ────────────────────────────────── */}
      <TeamLeaderActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        caseData={auditCase}
        onExecuteAction={handleDecision}
      />
    </div>
  );
};
