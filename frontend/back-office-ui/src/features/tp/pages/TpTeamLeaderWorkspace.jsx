import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, FileCheck, Layers, BarChart2, FileText, Scale,
  UserCheck, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft,
  Users, RefreshCw, Send, AlertOctagon, Save, Clock, DollarSign,
  Briefcase, CheckSquare, Globe, Calculator, Sliders, ChevronRight
} from 'lucide-react';
import { Card, Button, Badge, Alert, Input, Textarea, Select } from '../../../components/ui/index.jsx';
import { formatRevenue } from '../../ap/utils/revenueFormatter.js';

const BASE_API = '/api/v1/backoffice/tp/cases';

const TL_GATES = [
  { id: 'CASE_ASSIGNMENT', label: '1. Auditor Assignment', icon: UserCheck },
  { id: 'RISK_REVIEW', label: '2. Risk Assessment Endorsement', icon: ShieldCheck },
  { id: 'PLAN_REVIEW', label: '3. Audit Plan Endorsement', icon: FileCheck },
  { id: 'FACT_STATEMENT', label: '4. Fact Statement Sign-Off', icon: Layers },
  { id: 'BENCHMARK_REVIEW', label: '5. Benchmark & IQR Review', icon: BarChart2 },
  { id: 'REPORT_REVIEW', label: '6. First-Level Report Review', icon: FileText }
];

export default function TpTeamLeaderWorkspace({ caseData, user, onClose, onRefresh, initialPhase }) {
  const [activeGate, setActiveGate] = useState(() => {
    if (initialPhase === 'FIELD_WORK') return 'FACT_STATEMENT';
    if (initialPhase === 'ANALYSIS') return 'BENCHMARK_REVIEW';
    if (initialPhase === 'REPORT') return 'REPORT_REVIEW';
    if (initialPhase === 'AUDIT_PLANNING') return 'PLAN_REVIEW';
    if (initialPhase === 'DETAILED_RISK_ASSESSMENT') return 'RISK_REVIEW';
    if (caseData?.status === 'FIELD_WORK_SUBMITTED_TL') return 'FACT_STATEMENT';
    if (caseData?.status === 'ANALYSIS_SUBMITTED_TL') return 'BENCHMARK_REVIEW';
    if (caseData?.status === 'REPORT_SUBMITTED_FOR_TL_REVIEW' || caseData?.status === 'REPORT_SUBMITTED_COMMITTEE') return 'REPORT_REVIEW';
    if (caseData?.status === 'AUDIT_PLAN_SUBMITTED_TL' || caseData?.status === 'AUDIT_PLAN_SUBMITTED_COMMITTEE') return 'PLAN_REVIEW';
    if (caseData?.status === 'RISK_ASSESSMENT_SUBMITTED_TL') return 'RISK_REVIEW';
    if (caseData?.tpCurrentPhase === 'FIELD_WORK') return 'FACT_STATEMENT';
    if (caseData?.tpCurrentPhase === 'ANALYSIS') return 'BENCHMARK_REVIEW';
    if (caseData?.tpCurrentPhase === 'REPORT') return 'REPORT_REVIEW';
    if (caseData?.tpCurrentPhase === 'AUDIT_PLANNING') return 'PLAN_REVIEW';
    return 'RISK_REVIEW';
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fullState, setFullState] = useState(null);

  // Available auditors for this Tax Center / Team Leader
  const [availableAuditors, setAvailableAuditors] = useState([]);
  const [selectedAuditorId, setSelectedAuditorId] = useState('');

  // Supervisory Actions state
  const [tlComments, setTlComments] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  // Verification Checklist State for Supervisory Sign-Off
  const [riskChecklist, setRiskChecklist] = useState({
    schedule5Examined: true,
    fiveYearStatuteVerified: true,
    bepsPillarsSubstantiated: true,
    havenTransactionsFlagged: true,
    workingHypothesisValid: true
  });

  const [planChecklist, setPlanChecklist] = useState({
    scopeWithinMandate: true,
    materialityThresholdsAdequate: true,
    samplingDesignMusCompliant: true,
    entryConferenceProtocolSigned: true,
    manHoursReasonable: true
  });

  const caseId = caseData?.id || caseData?.caseId;

  const loadFullState = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_API}/${caseId}/full-state`, {
        headers: {
          'X-Actor-Id': user?.id || user?.username || 'tp-tl'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFullState(data);
        if (data.caseDetails?.assignedAuditorId) {
          setSelectedAuditorId(data.caseDetails.assignedAuditorId);
        }

        // Auto-navigate to appropriate supervisory gate based on submission state or initialPhase
        const status = data.caseDetails?.status;
        const currentPhase = data.caseDetails?.tpCurrentPhase;
        const gates = data.phaseGates || [];
        const riskGate = gates.find(g => g.phaseId === 'DETAILED_RISK_ASSESSMENT');
        const planGate = gates.find(g => g.phaseId === 'AUDIT_PLANNING');
        const fwGate = gates.find(g => g.phaseId === 'FIELD_WORK');
        const analysisGate = gates.find(g => g.phaseId === 'ANALYSIS');
        const reportGate = gates.find(g => g.phaseId === 'REPORT');

        if (initialPhase === 'FIELD_WORK') {
          setActiveGate('FACT_STATEMENT');
        } else if (initialPhase === 'ANALYSIS') {
          setActiveGate('BENCHMARK_REVIEW');
        } else if (initialPhase === 'REPORT') {
          setActiveGate('REPORT_REVIEW');
        } else if (initialPhase === 'AUDIT_PLANNING') {
          setActiveGate('PLAN_REVIEW');
        } else if (initialPhase === 'DETAILED_RISK_ASSESSMENT') {
          setActiveGate('RISK_REVIEW');
        } else if (status === 'RISK_ASSESSMENT_SUBMITTED_TL' || riskGate?.status === 'SUBMITTED_FOR_REVIEW') {
          setActiveGate('RISK_REVIEW');
        } else if (status === 'AUDIT_PLAN_SUBMITTED_TL' || planGate?.status === 'SUBMITTED_FOR_REVIEW') {
          setActiveGate('PLAN_REVIEW');
        } else if (status === 'FIELD_WORK_SUBMITTED_TL' || fwGate?.status === 'SUBMITTED_FOR_REVIEW') {
          setActiveGate('FACT_STATEMENT');
        } else if (status === 'ANALYSIS_SUBMITTED_TL' || analysisGate?.status === 'SUBMITTED_FOR_REVIEW') {
          setActiveGate('BENCHMARK_REVIEW');
        } else if (status === 'REPORT_SUBMITTED_FOR_TL_REVIEW' || reportGate?.status === 'SUBMITTED_FOR_REVIEW') {
          setActiveGate('REPORT_REVIEW');
        } else if (currentPhase === 'FIELD_WORK') {
          setActiveGate('FACT_STATEMENT');
        } else if (currentPhase === 'ANALYSIS') {
          setActiveGate('BENCHMARK_REVIEW');
        } else if (currentPhase === 'REPORT') {
          setActiveGate('REPORT_REVIEW');
        } else if (status === 'PLANNING_TRIGGERED' || !data.caseDetails?.assignedAuditorId) {
          setActiveGate('CASE_ASSIGNMENT');
        }
      }
    } catch (err) {
      console.error('Failed to load TP case state:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, user]);

  // Load team auditors
  const loadAuditors = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/backoffice/ap/users/auditors');
      if (r.ok) {
        const d = await r.json();
        const auds = d.data || d || [];
        setAvailableAuditors(auds.filter(a => 
          (a.auditType || '').toUpperCase().includes('TP') || 
          (a.auditType || '').toUpperCase().includes('TRANSFER') ||
          (a.username || '').includes('tp')
        ));
      }
    } catch (e) {
      console.error('Failed to load auditors:', e);
    }
  }, []);

  useEffect(() => {
    loadFullState();
    loadAuditors();
  }, [loadFullState, loadAuditors]);

  const executeApiAction = async (endpoint, payload, successMessage) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_API}/${caseId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-tl',
          'X-Actor-Role': 'TEAM_LEADER'
        },
        body: payload ? JSON.stringify(payload) : undefined
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server returned ${res.status}`);
      }
      setMsg({ type: 'success', text: successMessage });
      await loadFullState();
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Gate 1: Assign Case to Auditor
  const handleAssignAuditor = async () => {
    if (!selectedAuditorId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/backoffice/ap/cases/${caseId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-tl'
        },
        body: JSON.stringify({
          auditorId: selectedAuditorId,
          mandateReason: 'Transfer Pricing audit execution mandate per Schedule 5 screening risk.',
          allocatedHours: 480
        })
      });
      if (!res.ok) throw new Error('Failed to assign auditor');
      setMsg({ type: 'success', text: `Case assigned to auditor ${selectedAuditorId} successfully.` });
      await loadFullState();
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Gate 2: Endorse Risk Assessment to Committee or Request Revision
  const handleEndorseRiskAssessment = async () => {
    await executeApiAction('/phases/DETAILED_RISK_ASSESSMENT/review', {
      decision: 'ENDORSE_TO_COMMITTEE',
      comments: tlComments || 'Supervisory quality review completed. Controlled transactions, financial profiling, and BEPS risk scoring verified under Art. 79 & Directive No. 43/2015. Endorsed and routed to Committee for formal deliberation.'
    }, 'Risk Assessment endorsed by Team Leader and successfully routed to Review Committee!');
  };

  const handleRequestRiskRevision = async () => {
    if (!revisionNotes) {
      setMsg({ type: 'error', text: 'Please document required revision instructions for the auditor.' });
      return;
    }
    await executeApiAction('/phases/DETAILED_RISK_ASSESSMENT/review', {
      decision: 'REVISION_REQUESTED',
      comments: revisionNotes
    }, 'Risk Assessment returned to Auditor with documented revision instructions.');
  };

  // Gate 3: Endorse Audit Plan to Committee or Request Revision
  const handleEndorsePlan = async () => {
    await executeApiAction('/phases/AUDIT_PLANNING/review', {
      decision: 'ENDORSE_TO_COMMITTEE',
      comments: tlComments || 'Supervisory review completed. Materiality thresholds, value chain characterization, and stratified sampling schedule verified under Art. 27 & 28 of Procl. 983/2016. Endorsed and routed to Review Committee for statutory approval.'
    }, 'Audit Plan endorsed by Team Leader and successfully routed to Review Committee for statutory approval!');
  };

  const handleRequestPlanRevision = async () => {
    if (!revisionNotes) {
      setMsg({ type: 'error', text: 'Please document required revision notes before returning plan to auditor.' });
      return;
    }
    await executeApiAction('/phases/AUDIT_PLANNING/review', {
      decision: 'REVISION_REQUESTED',
      comments: revisionNotes
    }, 'Audit Plan returned to Auditor with documented revision instructions.');
  };

  // Gate 4: Fact Statement Sign-Off
  const handleSignOffFactStatement = async () => {
    await executeApiAction('/field-work/fact-statement', {
      status: 'TL_SIGNED_OFF',
      comments: tlComments || 'Fact Statement verified against audit trail evidence. Cleared for taxpayer submission.'
    }, 'Fact Statement signed off. Auditor is authorized to share findings with taxpayer.');
    try {
      await fetch(`${BASE_API}/${caseId}/phases/FIELD_WORK/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-tl',
          'X-Actor-Role': 'TEAM_LEADER'
        },
        body: JSON.stringify({
          decision: 'APPROVED',
          comments: tlComments || 'Fact Statement signed off by Team Leader.'
        })
      });
    } catch (e) {
      console.warn('Phase gate review warning:', e);
    }
  };

  // Gate 5: Benchmark Review
  const handleConfirmBenchmark = async () => {
    await executeApiAction('/analysis/arms-length-confirmed', {
      comments: tlComments || 'Interquartile range and TNMM comparability study reviewed and confirmed.'
    }, 'Economic analysis and benchmark study signed off by Team Leader.');
    try {
      await fetch(`${BASE_API}/${caseId}/phases/ANALYSIS/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-tl',
          'X-Actor-Role': 'TEAM_LEADER'
        },
        body: JSON.stringify({
          decision: 'APPROVED',
          comments: tlComments || 'Benchmark and economic analysis confirmed by Team Leader.'
        })
      });
    } catch (e) {
      console.warn('Phase gate review warning:', e);
    }
  };

  // Gate 6: First-Level Report Review
  const handleReportDecision = async (decision) => {
    const reports = fullState?.reports || [];
    const reportId = reports.length > 0 ? reports[0].id : 'latest';

    if (decision === 'FRAUD_ESCALATED') {
      await executeApiAction(`/report/${reportId}/escalate-fraud`, {
        reason: revisionNotes || tlComments || 'Potential tax fraud or intentional concealment detected during transfer pricing audit.',
        department: 'INTELLIGENCE_AND_FRAUD_INVESTIGATION'
      }, 'Case escalated to Criminal Tax Fraud & Intelligence Investigation Directorate.');
      return;
    }

    await executeApiAction(`/report/${reportId}/team-leader-review`, {
      decision: decision === 'APPROVED' ? 'APPROVED' : 'RETURNED',
      comments: decision === 'APPROVED' ? (tlComments || 'First-level supervisory review passed.') : revisionNotes
    }, decision === 'APPROVED' 
      ? 'TP Audit Report endorsed by Team Leader and submitted to Review Committee / Process Owner.' 
      : 'TP Audit Report returned to Auditor for required corrections.');

    if (decision === 'APPROVED') {
      await executeApiAction(`/report/${reportId}/submit-for-process-owner-review`, {}, 'Report forwarded to Process Owner.');
      try {
        await fetch(`${BASE_API}/${caseId}/phases/REPORT/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Actor-Id': user?.id || user?.username || 'tp-tl',
            'X-Actor-Role': 'TEAM_LEADER'
          },
          body: JSON.stringify({
            decision: 'ENDORSE_TO_COMMITTEE',
            comments: tlComments || 'TP Report endorsed to Committee.'
          })
        });
      } catch (e) {
        console.warn('Phase gate review warning:', e);
      }
    }
  };

  const caseDetails = fullState?.caseDetails || {};
  const plan = fullState?.auditPlan || {};
  const riskAssessment = fullState?.riskAssessment || {};
  const riskDetails = riskAssessment?.riskDetails || {};
  const controlledTransactions = riskDetails?.controlledTransactions || [];
  const auditedFinancials = riskDetails?.auditedFinancials || [];
  const riskPillars = riskDetails?.riskIndicators || [];
  const workingHypothesis = riskDetails?.workingHypothesis || fullState?.workingHypothesis || {};

  const gates = fullState?.phaseGates || [];
  const riskGate = gates.find(g => g.phaseId === 'DETAILED_RISK_ASSESSMENT');
  const planGate = gates.find(g => g.phaseId === 'AUDIT_PLANNING');
  const isRiskAssessmentCleared = riskGate?.status === 'APPROVED' 
    || caseDetails?.status === 'AUDIT_PLAN_SUBMITTED_TL' 
    || caseDetails?.status === 'AUDIT_PLAN_SUBMITTED_COMMITTEE'
    || caseDetails?.status === 'PLANNING_TRIGGERED'
    || caseDetails?.tpCurrentPhase === 'PLANNING' 
    || caseDetails?.tpCurrentPhase === 'FIELD_WORK'
    || fullState?.planningMeeting?.decision === 'CONTINUE'
    || fullState?.planningMeeting?.decision === 'APPROVED';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Supervisory Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Back to Cases"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {caseDetails.taxpayerName || caseData?.taxpayerName || 'Transfer Pricing Case'}
              </h1>
              <Badge color="purple">TP Team Leader Supervisory Console</Badge>
              <Badge color={caseDetails.status?.includes('COMMITTEE') ? 'blue' : caseDetails.status?.includes('TL') ? 'amber' : 'green'}>
                {caseDetails.status || 'IN_PROGRESS'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <span>Case: <strong className="text-slate-900 dark:text-slate-200">{caseDetails.caseNumber || caseData?.caseNumber}</strong></span>
              <span>TIN: <strong className="text-slate-900 dark:text-slate-200">{caseDetails.taxpayerId || caseData?.taxpayerId}</strong></span>
              <span>Team Leader: <strong className="text-purple-600 dark:text-purple-400">{user?.name || user?.username}</strong></span>
              <span>Assigned Auditor: <strong className="text-blue-600 dark:text-blue-400">{caseDetails.assignedAuditorName || caseDetails.assignedAuditorId || 'Unassigned'}</strong></span>
              <span>Revenue at Risk: <strong className="text-rose-600 font-bold">ETB {Number(workingHypothesis?.revenueAtRisk || 42500000).toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadFullState} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin mr-1.5' : 'mr-1.5'} />
              Sync DB
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Supervisory Gates Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex overflow-x-auto gap-2">
          {TL_GATES.map((g) => {
            const Icon = g.icon;
            const isActive = activeGate === g.id;

            // Compute turn-taking status for each gate
            let badgeText = '';
            let badgeColor = 'slate';

            if (g.id === 'CASE_ASSIGNMENT') {
              badgeText = caseDetails.assignedAuditorId ? 'Assigned ✓' : 'Pending';
              badgeColor = caseDetails.assignedAuditorId ? 'green' : 'amber';
            } else if (g.id === 'RISK_REVIEW') {
              if (riskGate?.status === 'APPROVED') {
                badgeText = 'Approved ✓'; badgeColor = 'green';
              } else if (riskGate?.status === 'SUBMITTED_FOR_COMMITTEE') {
                badgeText = 'In Committee'; badgeColor = 'blue';
              } else if (riskGate?.status === 'SUBMITTED_FOR_REVIEW') {
                badgeText = '⚡ Action Due'; badgeColor = 'amber';
              } else {
                badgeText = 'With Auditor'; badgeColor = 'slate';
              }
            } else if (g.id === 'PLAN_REVIEW') {
              if (!isRiskAssessmentCleared) {
                badgeText = 'Locked'; badgeColor = 'slate';
              } else if (planGate?.status === 'APPROVED') {
                badgeText = 'Approved ✓'; badgeColor = 'green';
              } else if (planGate?.status === 'SUBMITTED_FOR_COMMITTEE') {
                badgeText = 'In Committee'; badgeColor = 'blue';
              } else if (planGate?.status === 'SUBMITTED_FOR_REVIEW' || caseDetails?.status === 'AUDIT_PLAN_SUBMITTED_TL') {
                badgeText = '⚡ Action Due'; badgeColor = 'amber';
              } else {
                badgeText = 'With Auditor'; badgeColor = 'slate';
              }
            } else {
              const isFieldUnlocked = planGate?.status === 'APPROVED';
              badgeText = isFieldUnlocked ? 'Field Active' : 'Locked';
              badgeColor = isFieldUnlocked ? 'teal' : 'slate';
            }

            return (
              <button
                key={g.id}
                onClick={() => setActiveGate(g.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-sm font-semibold' 
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{g.label}</span>
                {badgeText && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive
                      ? 'bg-purple-800 text-purple-100'
                      : badgeColor === 'green'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : badgeColor === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                      : badgeColor === 'blue'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {msg && (
        <Alert 
          type={msg.type === 'error' ? 'error' : 'success'} 
          title={msg.type === 'error' ? 'Supervisory Action Error' : 'Success'}
          onClose={() => setMsg(null)}
        >
          {msg.text}
        </Alert>
      )}

      {/* ── GATE 1: AUDITOR ASSIGNMENT ─────────────────────────────────────────── */}
      {activeGate === 'CASE_ASSIGNMENT' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <UserCheck className="text-blue-500" size={20} />
            {caseDetails?.status === 'PLANNING_TRIGGERED' ? 'Route Case to Lead Auditor' : 'Assign Transfer Pricing Lead Auditor'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Designate the lead Transfer Pricing auditor responsible for conducting detailed risk assessment, preparing the audit plan, and executing field work.
          </p>

          {caseDetails?.status === 'PLANNING_TRIGGERED' && (
            <Alert type="info" title="Statutory Planning Mandate Issued by Review Committee" className="mb-6">
              The Transfer Pricing Review Committee has approved the Planning Meeting and issued the statutory mandate (Status: <strong>PLANNING_TRIGGERED</strong>).
              Confirm or select the lead auditor and click <strong>Route Case to Auditor to Begin Planning</strong> to initiate Phase 2: Audit Planning &amp; Programming.
            </Alert>
          )}

          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Select TP Auditor
              </label>
              <select
                value={selectedAuditorId}
                onChange={(e) => setSelectedAuditorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              >
                <option value="">-- Choose TP Auditor --</option>
                {availableAuditors.map((a) => (
                  <option key={a.id || a.username} value={a.username || a.id}>
                    {a.fullName || a.name || a.username} ({a.username})
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={handleAssignAuditor} 
              disabled={saving || !selectedAuditorId}
              variant="primary"
              className={caseDetails?.status === 'PLANNING_TRIGGERED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              <Send size={14} className="mr-1.5" />
              {caseDetails?.status === 'PLANNING_TRIGGERED' 
                ? 'Route Case to Auditor to Begin Planning' 
                : (caseDetails.assignedAuditorId ? 'Reassign Auditor' : 'Confirm Assignment')}
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 2: RISK ASSESSMENT ENDORSEMENT (PHASE 1) ───────────────────────── */}
      {activeGate === 'RISK_REVIEW' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-purple-600" size={22} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Phase 1: Risk Assessment Supervisory Endorsement
                </h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Supervisory quality inspection of controlled transactions, BEPS Action 8–10 risk indicators, 5-year financials, and the preliminary Working Hypothesis.
              </p>
            </div>
            <div>
              {riskGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? (
                <Badge color="blue" className="py-1 px-3">Endorsed & Routed to Committee ✓</Badge>
              ) : riskGate?.status === 'APPROVED' ? (
                <Badge color="green" className="py-1 px-3">Approved ✓</Badge>
              ) : riskGate?.status === 'SUBMITTED_FOR_REVIEW' ? (
                <Badge color="amber" className="py-1 px-3 animate-pulse">⚡ Action Required: Endorsement Due</Badge>
              ) : (
                <Badge color="slate" className="py-1 px-3">With Auditor</Badge>
              )}
            </div>
          </div>

          {/* Lifecycle Turn Status Notice */}
          {riskGate?.status === 'APPROVED' ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                    Phase 1 Approved & Finalized by Review Committee
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    The Review Committee has formally approved this Detailed Risk Assessment. Phase 2 (Audit Planning) is unlocked.
                  </p>
                </div>
              </div>
              <Badge color="green">Phase Complete ✓</Badge>
            </div>
          ) : riskGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                    Endorsed by Team Leader & Routed to Review Committee
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                    Supervisory review completed. This dossier was formally submitted to the Review Committee and is currently pending formal committee deliberation.
                  </p>
                </div>
              </div>
              <Badge color="blue">In Committee Deliberation</Badge>
            </div>
          ) : riskGate?.status === 'SUBMITTED_FOR_REVIEW' ? (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-purple-600 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                    ⚡ Action Required: Lead Auditor Submitted Phase Dossier
                  </h4>
                  <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                    Inspect the working papers below, verify the quality assurance items, and endorse the case for transmission to the Review Committee.
                  </p>
                </div>
              </div>
              <Badge color="amber" dot>Pending TL Endorsement</Badge>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-amber-600 animate-pulse flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Currently with Lead Auditor (Working Papers in Preparation)
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    Lead auditor ({caseDetails.assignedAuditorName || caseDetails.assignedAuditorId || 'Assigned Auditor'}) is currently preparing the Detailed Risk Assessment working papers. Supervisory endorsement actions will unlock once the auditor submits the phase dossier.
                  </p>
                </div>
              </div>
              <Badge color="amber">In Preparation</Badge>
            </div>
          )}

          {/* Metric Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scoped Controlled Flow</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ETB {controlledTransactions.reduce((acc, t) => acc + (Number(t.totalValue) || 0), 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-purple-600">{controlledTransactions.length} Scoped Streams</span>
            </div>

            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">BEPS Risk Matrix</span>
              <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-1">
                92 / 100
              </div>
              <span className="text-[11px] text-rose-600 font-bold">Critical Severity Band</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Risk Level</span>
              <div className="text-lg font-bold text-rose-600 mt-1">
                {riskAssessment.riskLevel || 'CRITICAL'}
              </div>
              <span className="text-[11px] text-slate-400">Article 79 Scope Mandate</span>
            </div>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Revenue at Risk</span>
              <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                ETB {Number(workingHypothesis?.revenueAtRisk || 42500000).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600">5 Open Statutory Years</span>
            </div>
          </div>

          {/* Controlled Transactions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
              Auditor's Scoped Controlled Transactions Registry
            </div>
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Transaction Stream</th>
                  <th className="p-2.5">Foreign Affiliate & Jurisdiction</th>
                  <th className="p-2.5 text-right">Value (ETB)</th>
                  <th className="p-2.5">Transfer Pricing Method</th>
                  <th className="p-2.5">Statutory Legal Grounds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {controlledTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">{tx.stream}</td>
                    <td className="p-2.5">
                      {tx.foreignEntity} ({tx.jurisdiction})
                      {tx.isHaven && <span className="ml-1.5 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">HAVEN</span>}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">ETB {Number(tx.totalValue).toLocaleString()}</td>
                    <td className="p-2.5 font-mono">{tx.method}</td>
                    <td className="p-2.5 text-slate-500">{tx.statutoryBasis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Working Hypothesis Review Box */}
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
              Auditor's Working Hypothesis & Revenue-at-Risk Formulation
            </h4>
            <p className="text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
              {workingHypothesis?.suspectedMechanism || 
                'Suspected erosion of domestic Ethiopian tax base through artificial markups on Active Pharmaceutical Ingredients (APIs) by Dutch affiliate, combined with nondeductible offshore headquarter management fees remitted to a low-tax haven entity in Mauritius under Art. 45 & 79.'}
            </p>
          </div>

          {/* Supervisory Verification Checklist */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={15} className="text-purple-600" />
              Team Leader Quality Assurance Verification Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskChecklist.schedule5Examined}
                  onChange={(e) => setRiskChecklist({ ...riskChecklist, schedule5Examined: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>Schedule 5 Related-Party Disclosure examined against financial records</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskChecklist.fiveYearStatuteVerified}
                  onChange={(e) => setRiskChecklist({ ...riskChecklist, fiveYearStatuteVerified: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>5-year statutory limitation period verified under Article 28 Proc. 983/2016</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskChecklist.bepsPillarsSubstantiated}
                  onChange={(e) => setRiskChecklist({ ...riskChecklist, bepsPillarsSubstantiated: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>BEPS Action 8-10 risk scoring substantiated with objective financial metrics</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskChecklist.havenTransactionsFlagged}
                  onChange={(e) => setRiskChecklist({ ...riskChecklist, havenTransactionsFlagged: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>Offshore low-tax / haven transactions earmarked for 100% substantive audit</span>
              </label>
            </div>
          </div>

          {/* Endorsement Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Team Leader Supervisory Endorsement Comments (Transmitted to Review Committee)
            </label>
            <Textarea
              value={tlComments}
              onChange={(e) => setTlComments(e.target.value)}
              rows={3}
              placeholder="Document supervisory endorsement remarks for the TP Review Committee..."
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {riskGate?.status === 'SUBMITTED_FOR_REVIEW' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const notes = prompt('Enter specific revision instructions for the auditor:');
                    if (notes) {
                      setRevisionNotes(notes);
                      handleRequestRiskRevision();
                    }
                  }}
                  disabled={saving}
                  className="text-xs"
                >
                  <AlertTriangle size={14} className="mr-1.5 text-amber-500" />
                  Request Auditor Revisions
                </Button>

                <Button
                  onClick={handleEndorseRiskAssessment}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Send size={14} />
                  Endorse & Route to Review Committee →
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-500 font-medium">
                  {riskGate?.status === 'APPROVED'
                    ? '✓ Phase 1 is formally approved and finalized. No further supervisory action required.'
                    : riskGate?.status === 'SUBMITTED_FOR_COMMITTEE'
                    ? '⏳ Endorsement recorded and routed. Awaiting formal Committee resolution.'
                    : '🔒 Working papers in preparation by auditor. Endorsement unlocks upon formal dossier submission.'}
                </span>
                <Badge color={riskGate?.status === 'APPROVED' ? 'green' : riskGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? 'blue' : 'amber'}>
                  {riskGate?.status === 'APPROVED' ? 'Phase Complete ✓' : riskGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? 'In Committee' : 'With Auditor'}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── GATE 3: AUDIT PLAN ENDORSEMENT (PHASE 2) ───────────────────────────── */}
      {activeGate === 'PLAN_REVIEW' && !isRiskAssessmentCleared && (
        <Card className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Lock size={28} />
          </div>
          <Badge color="amber" className="mb-2">Prerequisite Phase Incomplete</Badge>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Plan Endorsement Strictly Locked</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Under statutory TP governance rules, Phase 1 (Detailed Risk Assessment) must be completed, endorsed, and approved by the Review Committee before Phase 2 (Audit Planning & Programming) can be reviewed or endorsed.
          </p>
          <div className="mt-5">
            <Button size="sm" onClick={() => setActiveGate('RISK_REVIEW')} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              <ArrowLeft size={14} className="mr-1.5" />
              Go to Phase 1: Risk Assessment Endorsement
            </Button>
          </div>
        </Card>
      )}

      {activeGate === 'PLAN_REVIEW' && isRiskAssessmentCleared && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="text-indigo-600" size={22} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Phase 2: Audit Plan & Program Supervisory Endorsement
                </h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Inspect auditor’s proposed materiality thresholds, value chain characterization, stratified sampling design, and Entry Conference minutes before routing to Committee for statutory sign-off.
              </p>
            </div>
            <div>
              {planGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? (
                <Badge color="blue" className="py-1 px-3">Endorsed & Routed to Committee ✓</Badge>
              ) : planGate?.status === 'APPROVED' ? (
                <Badge color="green" className="py-1 px-3">Approved ✓</Badge>
              ) : (planGate?.status === 'SUBMITTED_FOR_REVIEW' || caseDetails?.status === 'AUDIT_PLAN_SUBMITTED_TL') ? (
                <Badge color="amber" className="py-1 px-3 animate-pulse">⚡ Action Required: Endorsement Due</Badge>
              ) : (
                <Badge color="slate" className="py-1 px-3">With Auditor</Badge>
              )}
            </div>
          </div>

          {/* Lifecycle Turn Status Notice for Phase 2 */}
          {planGate?.status === 'APPROVED' ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                    Phase 2 Approved & Finalized by Committee
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    The Review Committee has granted final statutory approval for the TP Audit Plan. Fieldwork execution is authorized.
                  </p>
                </div>
              </div>
              <Badge color="green">Phase Complete ✓</Badge>
            </div>
          ) : planGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                    Endorsed by Team Leader & Routed to Review Committee
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                    Supervisory review completed. The TP Audit Plan was formally endorsed to the Review Committee. Currently pending Committee statutory approval.
                  </p>
                </div>
              </div>
              <Badge color="blue">In Committee Deliberation</Badge>
            </div>
          ) : (planGate?.status === 'SUBMITTED_FOR_REVIEW' || caseDetails?.status === 'AUDIT_PLAN_SUBMITTED_TL') ? (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-purple-600 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                    ⚡ Action Required: Lead Auditor Submitted Audit Plan
                  </h4>
                  <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                    Inspect the proposed audit program, materiality calculations, and sampling plan below. Verify quality assurance items and endorse the plan to the Review Committee.
                  </p>
                </div>
              </div>
              <Badge color="amber" dot>Pending TL Endorsement</Badge>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-amber-600 animate-pulse flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Currently with Lead Auditor (Audit Plan in Preparation)
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    Lead auditor ({caseDetails.assignedAuditorName || caseDetails.assignedAuditorId || 'Assigned Auditor'}) is currently compiling the 6 sub-steps of Audit Planning & Programming. Supervisory endorsement actions will unlock once the plan dossier is submitted.
                  </p>
                </div>
              </div>
              <Badge color="amber">In Preparation</Badge>
            </div>
          )}

          {/* Plan Scope & Materiality Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audit Scope</span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                {plan.scope || 'FY 2020 - FY 2024: Cross-border management fees, API imports, trademark royalties, loan interest.'}
              </p>
              <div className="text-[10px] text-indigo-600 font-semibold mt-1">5-Year Statute Verified</div>
            </div>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Materiality Thresholds</span>
              <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                PM: ETB {Number(plan.materialityDetails?.planningMateriality || 4500000).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600">
                TM: ETB {Number(plan.materialityDetails?.tolerableMisstatement || 3150000).toLocaleString()} (70% cut-off)
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Resources & Milestones</span>
              <div className="text-base font-bold text-purple-900 dark:text-purple-200 mt-1">
                {plan.plannedProcedures?.allocatedHours || 350} Man-Hours
              </div>
              <div className="text-[11px] text-purple-700 font-semibold">
                90-Day Execution Schedule ({plan.plannedProcedures?.timelineDays || 90} Days)
              </div>
            </div>
          </div>

          {/* Sampling & Methodology Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-600" />
                Audit Sampling Strategy & Stratification
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Methodology: <strong className="text-slate-900 dark:text-white">{plan.samplingMethod?.methodology || 'Stratified Key-Item Examination + Monetary Unit Sampling (MUS)'}</strong>
              </p>
              <div className="text-[11px] text-slate-500">
                Tier 1 (100% Substantive Vouching): All transactions exceeding Tolerable Misstatement and all offshore tax haven flows.
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-emerald-600" />
                Entry Conference & Statutory Ground Rules
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Venue: <strong className="text-slate-900 dark:text-white">{plan.plannedProcedures?.entryConfVenue || 'MoR Large Taxpayers Office (LTO) Executive Boardroom'}</strong>
              </p>
              <div className="text-[11px] text-emerald-600 font-semibold">
                ✓ 15-day IDR response protocol agreed • Art. 40 Taxpayer Bill of Rights acknowledged.
              </div>
            </div>
          </div>

          {/* Team Leader Verification Checklist */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={15} className="text-indigo-600" />
              Supervisory Audit Plan Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planChecklist.scopeWithinMandate}
                  onChange={(e) => setPlanChecklist({ ...planChecklist, scopeWithinMandate: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Audit scope strictly limited to approved target tax years and controlled streams</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planChecklist.materialityThresholdsAdequate}
                  onChange={(e) => setPlanChecklist({ ...planChecklist, materialityThresholdsAdequate: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Quantitative planning materiality & performance cut-offs rigorously formulated</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planChecklist.samplingDesignMusCompliant}
                  onChange={(e) => setPlanChecklist({ ...planChecklist, samplingDesignMusCompliant: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Sampling design achieves &gt;80% value coverage across import declarations</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planChecklist.entryConferenceProtocolSigned}
                  onChange={(e) => setPlanChecklist({ ...planChecklist, entryConferenceProtocolSigned: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Entry conference minutes recorded with verified taxpayer representation credentials</span>
              </label>
            </div>
          </div>

          {/* Endorsement Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Team Leader Supervisory Endorsement Comments (Transmitted to Review Committee)
            </label>
            <Textarea
              value={tlComments}
              onChange={(e) => setTlComments(e.target.value)}
              rows={3}
              placeholder="Document your supervisory quality assurance notes for the Review Committee..."
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {(planGate?.status === 'SUBMITTED_FOR_REVIEW' || caseDetails?.status === 'AUDIT_PLAN_SUBMITTED_TL') ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const notes = prompt('Enter specific revision notes for the auditor:');
                    if (notes) {
                      setRevisionNotes(notes);
                      handleRequestPlanRevision();
                    }
                  }}
                  disabled={saving}
                  className="text-xs"
                >
                  <AlertTriangle size={14} className="mr-1.5 text-amber-500" />
                  Request Auditor Revisions
                </Button>

                <Button
                  onClick={handleEndorsePlan}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Send size={14} />
                  Endorse & Route to Review Committee for Statutory Approval →
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-500 font-medium">
                  {planGate?.status === 'APPROVED'
                    ? '✓ Phase 2 is formally approved and finalized. Fieldwork execution authorized.'
                    : planGate?.status === 'SUBMITTED_FOR_COMMITTEE'
                    ? '⏳ Endorsement recorded and routed. Awaiting Review Committee statutory approval.'
                    : '🔒 Working papers in preparation by auditor. Endorsement unlocks upon plan submission.'}
                </span>
                <Badge color={planGate?.status === 'APPROVED' ? 'green' : planGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? 'blue' : 'amber'}>
                  {planGate?.status === 'APPROVED' ? 'Plan Approved ✓' : planGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? 'In Committee' : 'With Auditor'}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── GATE 4: FACT STATEMENT SIGN-OFF (PHASE 3) ──────────────────────────── */}
      {activeGate === 'FACT_STATEMENT' && planGate?.status !== 'APPROVED' && (
        <Card className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Lock size={28} />
          </div>
          <Badge color="amber" className="mb-2">Prerequisite Phase Incomplete</Badge>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fieldwork & Fact Statement Strictly Locked</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Under statutory TP governance rules, Phase 2 (Audit Plan & Program) must be formally approved by the Review Committee before fieldwork execution and Fact Statement sign-off can commence.
          </p>
          <div className="mt-5">
            <Button size="sm" onClick={() => setActiveGate('PLAN_REVIEW')} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              <ArrowLeft size={14} className="mr-1.5" />
              Go to Phase 2: Audit Plan Endorsement
            </Button>
          </div>
        </Card>
      )}

      {activeGate === 'FACT_STATEMENT' && planGate?.status === 'APPROVED' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="text-emerald-500" size={20} />
                Statement of Facts Supervisory Sign-Off
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Verify factual accuracy of FAR functional analysis and taxpayer operational representations.
              </p>
            </div>
            <Badge color="blue">Gate 4: Fieldwork</Badge>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            Auditor has concluded on-site walkthrough tests, verified management service deliverables, and compiled the factual dossier.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Team Leader Factual Sign-Off Notes
            </label>
            <Textarea
              value={tlComments}
              onChange={(e) => setTlComments(e.target.value)}
              rows={3}
              placeholder="Confirm factual evidence supports economic functional analysis..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button onClick={handleSignOffFactStatement} disabled={saving}>
              <CheckCircle2 size={14} className="mr-1.5" />
              Sign-Off Statement of Facts
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 5: BENCHMARK REVIEW (PHASE 4) ──────────────────────────────────── */}
      {activeGate === 'BENCHMARK_REVIEW' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="text-blue-500" size={20} />
                Economic Benchmark & Interquartile Range Review
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Inspect comparable company search matrix, independence criteria, and statistical interquartile range calculation.
              </p>
            </div>
            <Badge color="purple">Gate 5: Economic Analysis</Badge>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Supervisory Comparability Review Notes
            </label>
            <Textarea
              value={tlComments}
              onChange={(e) => setTlComments(e.target.value)}
              rows={3}
              placeholder="Confirm rejection criteria and arm's length range validity..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button onClick={handleConfirmBenchmark} disabled={saving}>
              <CheckCircle2 size={14} className="mr-1.5" />
              Confirm Economic Benchmark & Route to Committee
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 6: REPORT REVIEW (PHASE 5) ────────────────────────────────────── */}
      {activeGate === 'REPORT_REVIEW' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-purple-500" size={20} />
                First-Level Audit Report Supervisory Review
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Conduct supervisory technical review of the draft Transfer Pricing Audit Report, legal grounds under Art. 79, and penalty computations.
              </p>
            </div>
            <Badge color="amber">Gate 6: Reporting</Badge>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Supervisory Review Remarks
            </label>
            <Textarea
              value={tlComments}
              onChange={(e) => setTlComments(e.target.value)}
              rows={3}
              placeholder="Document supervisory endorsement remarks for the TP Review Committee..."
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const notes = prompt('Enter specific revision notes for the auditor:');
                  if (notes) {
                    setRevisionNotes(notes);
                    handleReportDecision('RETURNED');
                  }
                }}
                disabled={saving}
              >
                Request Revisions
              </Button>
              <Button 
                variant="outline" 
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
                onClick={() => {
                  if (confirm('Are you sure you want to escalate this case for Criminal Tax Fraud Investigation?')) {
                    handleReportDecision('FRAUD_ESCALATED');
                  }
                }}
                disabled={saving}
              >
                <AlertOctagon size={14} className="mr-1.5" />
                Escalate for Fraud Investigation
              </Button>
            </div>

            <Button onClick={() => handleReportDecision('APPROVED')} disabled={saving}>
              <Send size={14} className="mr-1.5" />
              Endorse Report & Route to Committee
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
