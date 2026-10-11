import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardList, Calendar, FileCheck, Scale, AlertOctagon, 
  CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  Users, RefreshCw, Send, Save, Clock, Landmark, FileText, Check, 
  DollarSign, TrendingDown, Building2, ShieldAlert, Sparkles, ChevronRight,
  Lock, Edit3
} from 'lucide-react';
import { Card, Button, Badge, Alert, Input, Textarea, Select } from '../../../components/ui/index.jsx';
import { formatRevenue } from '../../ap/utils/revenueFormatter.js';

const BASE_API = '/api/v1/backoffice/tp/cases';

const COMMITTEE_GATES = [
  { id: 'INTAKE_REVIEW', label: '1. Case Intake & Risk Dossier', icon: FileText },
  { id: 'WORKING_HYPOTHESIS', label: '2. Working Hypothesis & Revenue at Risk', icon: ClipboardList },
  { id: 'PLANNING_MEETING', label: '3. Planning Meeting & Mandate', icon: Users },
  { id: 'PLAN_APPROVAL', label: '4. Audit Plan & Program Approval', icon: Calendar },
  { id: 'PREPARATION_REVIEW', label: '5. Audit Preparation Review', icon: CheckCircle2 },
  { id: 'REPORT_APPROVAL', label: '6. Final TP Report Approval', icon: FileCheck },
  { id: 'NOTICE_AUTHORIZATION', label: '7. Statutory Notice Sign-Off', icon: Scale },
  { id: 'OBJECTION_FRAUD', label: '8. Response & Fraud Referral', icon: AlertOctagon }
];

export default function TpCommitteeWorkspace({ caseData, user, initialGate, onClose, onRefresh }) {
  const [activeGate, setActiveGate] = useState(initialGate || 'INTAKE_REVIEW');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fullState, setFullState] = useState(null);

  // Gate 2: Working Hypothesis & Revenue at Risk Form States 
  const [hypDesc, setHypDesc] = useState('');
  const [identifiedIssue, setIdentifiedIssue] = useState('');
  const [econRationale, setEconRationale] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('TNMM');
  const [baseTurnover, setBaseTurnover] = useState(575000000);
  const [reportedMargin, setReportedMargin] = useState(1.5);
  const [benchmarkMargin, setBenchmarkMargin] = useState(6.4);
  const [managementFees, setManagementFees] = useState(75000000);
  const [whtRate, setWhtRate] = useState(15);
  const [penaltyRate, setPenaltyRate] = useState(40);

  // Gate 3: Planning Meeting & Mandate Form States 
  const [meetingMinutes, setMeetingMinutes] = useState('');
  const [attendees, setAttendees] = useState('');
  const [targetYears, setTargetYears] = useState('FY 2020 - FY 2024 (5 Tax Years)');
  const [mandateDirectives, setMandateDirectives] = useState('Focus audit execution on offshore management & technical services deductibility (Mauritius) and procurement import markups (Singapore hub). Apply TNMM and CUP as appropriate.');
  const [deadlineDays, setDeadlineDays] = useState(20);
  const [committeeComments, setCommitteeComments] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Transfer Pricing Process Owner / Review Committee Chair');
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [assignedTeamLeaderId, setAssignedTeamLeaderId] = useState(caseData?.assignedTeamLeaderId || '');

  const caseId = caseData?.id || caseData?.caseId;

  // Live Revenue at Risk Calculation
  const profitShortfall = Math.max(0, Math.round(baseTurnover * ((benchmarkMargin - reportedMargin) / 100)));
  const citDelta = Math.round(profitShortfall * 0.30);
  const whtDelta = Math.round(managementFees * (whtRate / 100));
  const penaltyDelta = Math.round((citDelta + whtDelta) * (penaltyRate / 100));
  const totalRevenueAtRisk = citDelta + whtDelta + penaltyDelta;

  const loadFullState = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_API}/${caseId}/full-state`, {
        headers: {
          'X-Actor-Id': user?.id || user?.username || 'tp-chair'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFullState(data);

        // Populate hypothesis if exists
        if (data.workingHypothesis) {
          setHypDesc(data.workingHypothesis.hypothesisDescription || '');
          setIdentifiedIssue(data.workingHypothesis.identifiedIssue || '');
          setEconRationale(data.workingHypothesis.economicRationale || '');
          if (data.workingHypothesis.calculationDetails) {
            const cd = data.workingHypothesis.calculationDetails;
            if (cd.baseTurnover) setBaseTurnover(Number(cd.baseTurnover));
            if (cd.reportedEbitMargin) setReportedMargin(Number(cd.reportedEbitMargin));
            if (cd.targetEbitMedian) setBenchmarkMargin(Number(cd.targetEbitMedian));
            if (cd.managementFees) setManagementFees(Number(cd.managementFees));
            if (cd.selectedMethod) setSelectedMethod(cd.selectedMethod);
          }
        } else if (data.caseDetails?.estimatedRevenue) {
          setBaseTurnover(Number(data.caseDetails.estimatedRevenue));
        }

        // Populate meeting if exists
        if (data.planningMeetings) {
          if (data.planningMeetings.discussionNotes) setMeetingMinutes(data.planningMeetings.discussionNotes);
          if (data.planningMeetings.recordedBy) setAttendees(data.planningMeetings.recordedBy);
        }

        if (data.caseDetails?.assignedTeamLeaderId) {
          setAssignedTeamLeaderId(data.caseDetails.assignedTeamLeaderId);
        }

        // Auto-navigate to appropriate active gate if newly opening
        if (!initialGate) {
          const currentPhase = data.caseDetails?.tpCurrentPhase;
          const currentStatus = data.caseDetails?.status;
          if (currentStatus === 'ASSIGNED_TO_COMMITTEE') {
            setActiveGate('INTAKE_REVIEW');
          } else if (currentStatus === 'SUBMITTED_FOR_COMMITTEE' || currentStatus === 'RISK_ASSESSMENT_SUBMITTED_COMMITTEE') {
            setActiveGate('WORKING_HYPOTHESIS');
          } else if (currentPhase === 'HYPOTHESIS_DEVELOPMENT' || currentStatus === 'TP_INTAKE_ACCEPTED') {
            setActiveGate('WORKING_HYPOTHESIS');
          } else if (currentPhase === 'PLANNING_MEETING') {
            setActiveGate('PLANNING_MEETING');
          } else if (currentStatus === 'AUDIT_PLAN_SUBMITTED_COMMITTEE' || currentStatus === 'AUDIT_PLAN_SUBMITTED_TL' || currentStatus === 'SUBMITTED_FOR_REVIEW') {
            setActiveGate('PLAN_APPROVAL');
          } else if (currentPhase === 'FIELD_WORK') {
            setActiveGate('PREPARATION_REVIEW');
          } else if (currentStatus === 'REPORT_SUBMITTED_COMMITTEE' || (data.reports?.length > 0 && data.reports[0].status === 'SUBMITTED_FOR_APPROVAL')) {
            setActiveGate('REPORT_APPROVAL');
          } else if (currentPhase === 'NOTICE' || currentStatus === 'ASSESSMENT_COMPUTED') {
            setActiveGate('NOTICE_AUTHORIZATION');
          } else if (currentPhase === 'CLOSURE' || currentStatus === 'NOTICE_ISSUED') {
            setActiveGate('OBJECTION_FRAUD');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load TP case state:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, user]);

  useEffect(() => {
    loadFullState();
  }, [loadFullState]);

  const effectiveTaxCenter = caseData?.taxCenterCode || user?.taxCenter || (() => {
    const raw = (user?.username || user?.id || '').toLowerCase();
    const stripped = raw.replace(/^u-com-/, '').replace(/-(?:tp|ja|joint|desk|comp|issue|chair|tpchair|jachair|mem\d*|tpmem\d*)$/, '');
    if (stripped === 'fed' || stripped.includes('federal-lto1') || !stripped) return 'federal-lto1';
    return stripped;
  })();

  useEffect(() => {
    const loadTLs = async () => {
      try {
        const tcParam = effectiveTaxCenter ? `&taxCenter=${encodeURIComponent(effectiveTaxCenter)}` : '';
        const r = await fetch(`/api/v1/backoffice/ap/users?role=team_leader&auditType=TRANSFER_PRICING${tcParam}`);
        if (r.ok) {
          const list = await r.json();
          const raw = Array.isArray(list) ? list : (list.data || []);
          const norm = (s) => (s || '').toLowerCase().replace(/[-_]/g, '');
          const targetNorm = norm(effectiveTaxCenter);
          const filtered = raw.filter(tl => {
            if (!effectiveTaxCenter) return true;
            const tlLoc = norm(tl.assignedLocation || '');
            const tlUser = norm(tl.username || '');
            return tlLoc.includes(targetNorm) || tlUser.includes(targetNorm);
          });
          setTeamLeaders(filtered);
        }
      } catch (e) {
        console.error('Failed to load TP team leaders:', e);
      }
    };
    loadTLs();
  }, [effectiveTaxCenter]);

  const executeApiAction = async (endpoint, payload, successMessage) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_API}/${caseId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-chair'
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

  // Gate 1: Acknowledge & Accept Case Intake
  const handleAcceptIntake = async () => {
    await executeApiAction('/accept-intake', {}, 'Case acknowledged and accepted into Tax Center TP Pipeline! Moving to Working Hypothesis formulation.');
    setActiveGate('WORKING_HYPOTHESIS');
  };

  // Gate 2: Save Initial Working Hypothesis & Business Case 
  const handleSaveWorkingHypothesis = async () => {
    const calcDetails = {
      baseTurnover,
      reportedEbitMargin: reportedMargin,
      targetEbitMedian: benchmarkMargin,
      profitShortfall,
      citAdjustment30Pct: citDelta,
      managementFees,
      whtRate,
      whtAdjustment: whtDelta,
      penaltyRate,
      penaltyEstimate: penaltyDelta,
      totalRevenueAtRisk,
      selectedMethod
    };

    await executeApiAction('/working-hypothesis', {
      hypothesisDescription: hypDesc || `Taxpayer is artificially depressing operating profits through excessive offshore management fees and non-arm's length raw material import pricing.`,
      identifiedIssue: identifiedIssue || `Excessive management fees to Mauritius and procurement markups from Singapore affiliate.`,
      economicRationale: econRationale || `Operating margin of ${reportedMargin}% is significantly below industry benchmark median of ${benchmarkMargin}%. Adjustments required to bring to arm's length range.`,
      revenueAtRisk: totalRevenueAtRisk,
      calculationDetails: calcDetails,
      currency: 'ETB'
    }, 'Initial Working Hypothesis & Business Case (Amount of Revenue at Risk) saved to PostgreSQL database.');
  };

  // Gate 3: Planning Meeting Decision & Mandate Trigger 
  const handlePlanningMeetingDecision = async (decision) => {
    await executeApiAction('/planning-meeting/decision', {
      decision: decision,
      discussionNotes: meetingMinutes || 'Review Committee convened statutory planning meeting, confirmed hypothesis soundness and revenue at risk viability, and issued formal audit planning mandate.',
      meetingMinutes: meetingMinutes,
      attendees: attendees || `${user?.name || user?.username} (Chair), Lead TP Economist, Legal Counsel, Audit Process Lead`,
      mandateDirectives: mandateDirectives,
      targetFiscalYears: targetYears,
      statutoryDeadlineDays: Number(deadlineDays),
      assignedTeamLeaderId: assignedTeamLeaderId || undefined
    }, decision === 'CONTINUE' || decision === 'APPROVED'
      ? `Review Committee decided to CONTINUE! Statutory Planning Mandate issued to Team Leader & Auditor (Status: PLANNING_TRIGGERED).`
      : 'Review Committee recorded decision: Discontinue / Close Case.');
  };

  // Gate 2: Approve Endorsed Risk Assessment & Unlock Planning
  const handleApproveRiskAssessment = async () => {
    await executeApiAction('/phases/DETAILED_RISK_ASSESSMENT/review', {
      decision: 'APPROVED',
      comments: committeeComments || 'Committee formally reviewed and approved Detailed Risk Assessment working papers under Art. 79.'
    }, 'Detailed Risk Assessment approved by Review Committee! Audit Planning phase unlocked.');
  };

  // Gate 4: Formal Audit Plan Approval 
  const handleApprovePlan = async (decision) => {
    await executeApiAction('/audit-plan/approve', {
      decision: decision,
      comments: committeeComments || 'Audit plan scope, materiality threshold, and field procedures formally approved.',
      approvedBy: `${user?.name || user?.username} (${signatoryDesignation})`
    }, decision === 'APPROVED'
      ? 'Audit Plan formally approved by TP Process Owner / Committee. Case advanced to Field Work execution phase.'
      : 'Audit Plan returned to Team Leader with committee observations.');

    if (decision === 'APPROVED') {
      try {
        await fetch(`/api/v1/backoffice/tp/cases/${caseId}/phases/AUDIT_PLANNING/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Actor-Id': user?.id || user?.username || 'committee-chair',
            'X-Actor-Role': 'COMMITTEE'
          },
          body: JSON.stringify({
            decision: 'APPROVED',
            comments: committeeComments || 'Statutory Committee Audit Plan approval granted.'
          })
        });
      } catch (e) {
        console.warn('Phase gate approval warning:', e);
      }
    }
  };

  // Gate 6: Final TP Report Approval 
  const handleApproveReport = async (decision) => {
    const reports = fullState?.reports || [];
    const reportId = reports.length > 0 ? reports[0].id : 'latest';

    await executeApiAction(`/report/${reportId}/committee-approval`, {
      decision: decision,
      comments: committeeComments || 'TP Audit Report and exit conference minutes reviewed and approved. Authorized for taxpayer issuance.',
      approvedBy: `${user?.name || user?.username} (${signatoryDesignation})`
    }, decision === 'APPROVED'
      ? 'TP Audit Report approved. Formal report transmitted to Taxpayer for the statutory 30-day response period.'
      : 'TP Audit Report returned to Team Leader for revisions.');
  };

  // Gate 7: Authorize Statutory Notice of Assessment 
  const handleAuthorizeNotice = async () => {
    await executeApiAction('/notice/authorize', {
      authorizedBy: `${user?.name || user?.username} (${signatoryDesignation})`,
      comments: committeeComments || 'Statutory Notice of Assessment legally signed and authorized for formal dispatch.'
    }, 'Statutory Notice of Assessment authorized and sealed by Authorized Official.');
  };

  // Gate 8: Escalate Fraud on Non-Response 
  const handleEscalateFraud = async () => {
    const reports = fullState?.reports || [];
    const reportId = reports.length > 0 ? reports[0].id : 'latest';

    await executeApiAction(`/report/${reportId}/escalate-fraud`, {
      reason: committeeComments || 'Taxpayer failed to respond or agree to TP report within approved statutory period.',
      department: 'CRIMINAL_TAX_FRAUD_INVESTIGATION'
    }, 'Statutory referral dispatched: Tax Intelligence and Criminal Fraud Investigation sub-process triggered.');
  };

  const caseDetails = fullState?.caseDetails || {};
  const currentPhase = caseDetails.tpCurrentPhase || 'HYPOTHESIS_DEVELOPMENT';
  const currentStatus = caseDetails.status || 'ASSIGNED_TO_COMMITTEE';
  const riskAssessment = fullState?.riskAssessment || {};
  const riskDetails = riskAssessment.riskDetails || {};
  const auditedFinancials = riskDetails.auditedFinancials || [];
  const controlledTransactions = riskDetails.controlledTransactions || [];
  const riskIndicators = riskDetails.riskIndicators || [];

  const hyp = fullState?.workingHypothesis || {};
  const plan = fullState?.auditPlan || {};
  const analysis = fullState?.analysis || {};
  const reports = fullState?.reports || [];
  const report = reports[0] || {};
  const notices = fullState?.notices || {};

  const gates = fullState?.phaseGates || [];
  const riskGate = gates.find(g => g.phaseId === 'DETAILED_RISK_ASSESSMENT');
  const planGate = gates.find(g => g.phaseId === 'AUDIT_PLANNING');

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Governance Header */}
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
              <Badge color="red">TP Process Owner / Review Committee</Badge>
              <Badge color="blue">
                Phase: {currentPhase}
              </Badge>
              <Badge color={currentStatus === 'PLANNING_TRIGGERED' ? 'green' : 'amber'}>
                Status: {currentStatus}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <span>Case No: <strong className="text-slate-900 dark:text-slate-200">{caseDetails.caseNumber || caseData?.caseNumber}</strong></span>
              <span>TIN: <strong className="text-slate-900 dark:text-slate-200">{caseDetails.taxpayerId || caseData?.taxpayerId}</strong></span>
              <span>Tax Center: <strong className="text-slate-900 dark:text-slate-200">{caseDetails.taxCenterCode || 'Federal LTO'}</strong></span>
              <span>Process Owner / Chair: <strong className="text-red-600 dark:text-red-400">{user?.name || user?.username}</strong></span>
              <span>Assigned Team: <strong className="text-slate-900 dark:text-slate-200">{caseDetails.assignedTeamLeaderName || 'TL'} / {caseDetails.assignedAuditorName || 'Auditor'}</strong></span>
              <span>Revenue at Risk: <strong className="text-red-600 dark:text-red-400 font-bold">ETB {Number(totalRevenueAtRisk || hyp.revenueAtRisk || 0).toLocaleString()}</strong></span>
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

        {/* Committee Statutory Gates Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex overflow-x-auto gap-2">
          {COMMITTEE_GATES.map((g) => {
            const Icon = g.icon;
            const isActive = activeGate === g.id;

            let badgeText = '';
            let badgeColor = 'slate';

            if (g.id === 'INTAKE_REVIEW') {
              badgeText = caseDetails.assignedTeamLeaderId ? 'Assigned ✓' : 'Pending TL';
              badgeColor = caseDetails.assignedTeamLeaderId ? 'green' : 'amber';
            } else if (g.id === 'WORKING_HYPOTHESIS') {
              if (riskGate?.status === 'APPROVED') {
                badgeText = 'Approved ✓'; badgeColor = 'green';
              } else if (riskGate?.status === 'SUBMITTED_FOR_COMMITTEE') {
                badgeText = '⚡ Vote Due'; badgeColor = 'amber';
              } else {
                badgeText = 'In Prep'; badgeColor = 'slate';
              }
            } else if (g.id === 'PLANNING_MEETING') {
              badgeText = riskGate?.status === 'APPROVED' ? 'Mandate Issued ✓' : 'Pending';
              badgeColor = riskGate?.status === 'APPROVED' ? 'green' : 'slate';
            } else if (g.id === 'PLAN_APPROVAL') {
              if (riskGate?.status !== 'APPROVED') {
                badgeText = 'Locked'; badgeColor = 'slate';
              } else if (planGate?.status === 'APPROVED') {
                badgeText = 'Approved ✓'; badgeColor = 'green';
              } else if (planGate?.status === 'SUBMITTED_FOR_COMMITTEE') {
                badgeText = '⚡ Approval Due'; badgeColor = 'amber';
              } else {
                badgeText = 'In Prep'; badgeColor = 'slate';
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
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-sm font-semibold' 
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{g.label}</span>
                {badgeText && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive
                      ? 'bg-red-800 text-red-100'
                      : badgeColor === 'green'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : badgeColor === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
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
          title={msg.type === 'error' ? 'Committee Action Error' : 'Success'}
          onClose={() => setMsg(null)}
        >
          {msg.text}
        </Alert>
      )}

      {/* ── GATE 1: CASE INTAKE & RISK DOSSIER REVIEW (, ) ── */}
      {activeGate === 'INTAKE_REVIEW' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-blue-500" size={20} />
                  Gate 1: Case Intake & Risk Dossier Review
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  The TP Process Owner / Committee receives the selected case assigned to the Tax Center. Acknowledge intake and review multi-year financials, Schedule 5 controlled transactions, and upstream risk indicators.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge color={currentStatus === 'TP_INTAKE_ACCEPTED' || currentStatus === 'PLANNING_TRIGGERED' ? 'green' : 'amber'}>
                  Intake Status: {currentStatus}
                </Badge>
                {currentStatus === 'ASSIGNED_TO_COMMITTEE' && (
                  <Button onClick={handleAcceptIntake} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 size={14} className="mr-1.5" />
                    Accept Case into TP Workflow
                  </Button>
                )}
              </div>
            </div>

            {/* Sub-panel A: 5-Year Audited Financial Trends */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <TrendingDown className="text-amber-500" size={16} />
                1. Multi-Year Audited Financial Trends (5-Year Lookback)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Financial Year</th>
                      <th className="py-2.5 px-4">Turnover (ETB)</th>
                      <th className="py-2.5 px-4">Gross Margin %</th>
                      <th className="py-2.5 px-4">Operating Margin (EBIT %)</th>
                      <th className="py-2.5 px-4">Net Profit / Loss (ETB)</th>
                      <th className="py-2.5 px-4">Tax Declared & Paid (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditedFinancials.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{f.year}</td>
                        <td className="py-2.5 px-4 font-mono">ETB {Number(f.turnover).toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono">{f.grossMargin}%</td>
                        <td className="py-2.5 px-4 font-mono text-red-600 dark:text-red-400 font-bold">{f.ebit}%</td>
                        <td className={`py-2.5 px-4 font-mono font-semibold ${f.netProfit < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          ETB {Number(f.netProfit).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-mono">ETB {Number(f.taxPaid).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-panel B: Schedule 5 Controlled Transactions */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Building2 className="text-blue-500" size={16} />
                2. Controlled Transactions Inventory (Schedule 5 Disclosures)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Transaction Stream</th>
                      <th className="py-2.5 px-4">Foreign / Domestic Counterparty</th>
                      <th className="py-2.5 px-4">Counterparty Jurisdiction</th>
                      <th className="py-2.5 px-4">Annual Value (ETB)</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">Risk Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {controlledTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4">
                          <Badge color={tx.type === 'INTERNATIONAL' ? 'purple' : 'teal'}>{tx.type}</Badge>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{tx.stream}</td>
                        <td className="py-2.5 px-4">{tx.foreignEntity}</td>
                        <td className="py-2.5 px-4 text-slate-500">{tx.jurisdiction}</td>
                        <td className="py-2.5 px-4 font-mono font-bold">ETB {Number(tx.totalValue).toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono">{tx.method}</td>
                        <td className="py-2.5 px-4">
                          <Badge color={tx.riskFlag === 'CRITICAL' ? 'red' : tx.riskFlag === 'HIGH' ? 'orange' : 'blue'}>
                            {tx.riskFlag}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-panel C: Risk Engine Indicators */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={16} />
                3. Taxpayer Risk Profiling & Screening Triggers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riskIndicators.map((ri) => (
                  <div key={ri.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{ri.title}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{ri.detail}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-mono mt-1 inline-block">Category: {ri.category} | Weight: {ri.weight}</span>
                    </div>
                    <Badge color={ri.status === 'CRITICAL' ? 'red' : 'amber'}>{ri.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Step 1 Complete: Case background & risk indicators reviewed.
              </span>
              <Button onClick={() => setActiveGate('WORKING_HYPOTHESIS')}>
                Proceed to Working Hypothesis & Revenue at Risk <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── GATE 2: INITIAL WORKING HYPOTHESIS & BUSINESS CASE  ─────── */}
      {activeGate === 'WORKING_HYPOTHESIS' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="text-blue-500" size={20} />
                Gate 2: Initial Working Hypothesis & Business Case
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Statutory Rule: The TP Process Owner / Committee develops the preliminary working hypothesis and establishes the potential Amount of Revenue at Risk to justify proceeding with the audit.
              </p>
            </div>
            <Badge color={hyp.status === 'DEVELOPED_BY_PO' || hyp.status === 'APPROVED' ? 'green' : 'amber'}>
              Status: {hyp.status || 'DRAFT'}
            </Badge>
          </div>

          {/* Complete 4-State Statutory Turn Banner */}
          {riskGate?.status === 'APPROVED' ? (
            <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Detailed Risk Assessment Approved & Finalized</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-1">
                  Statutory review of Phase 1 is complete. Working papers are permanently locked as an official audit record. Phase 2 (Audit Planning) is unlocked.
                </p>
              </div>
              <Badge color="green">Phase 1 Approved ✓</Badge>
            </div>
          ) : (['SUBMITTED_FOR_COMMITTEE', 'RISK_ASSESSMENT_SUBMITTED_COMMITTEE'].includes(caseDetails.status) || riskGate?.status === 'SUBMITTED_FOR_COMMITTEE') ? (
            <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between animate-pulse">
              <div>
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles size={15} className="text-purple-600" />
                  <span>⚡ Action Due: Endorsed by Team Leader ({caseDetails.assignedTeamLeaderName || caseDetails.assignedTeamLeaderId || 'Assigned TL'})</span>
                </div>
                <p className="text-xs text-purple-900 dark:text-purple-200 mt-1">
                  Lead auditor completed Detailed Risk Assessment. Team Leader verified and routed to Review Committee. Review findings below and grant approval.
                </p>
              </div>
              <Badge color="purple" size="sm" dot>Approval Due</Badge>
            </div>
          ) : (riskGate?.status === 'SUBMITTED_FOR_REVIEW' || caseDetails.status === 'RISK_ASSESSMENT_SUBMITTED_TL') ? (
            <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Clock size={15} className="text-amber-600" />
                  <span>Under Supervisory Review by Team Leader ({caseDetails.assignedTeamLeaderName || caseDetails.assignedTeamLeaderId || 'Assigned TL'})</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                  Auditor submitted Phase 1 working papers. Team Leader must review and endorse before Review Committee can act.
                </p>
              </div>
              <Badge color="amber">Awaiting TL Review</Badge>
            </div>
          ) : (
            <div className="mb-5 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                  <Edit3 size={15} className="text-slate-500" />
                  <span>Working Papers in Preparation by Lead Auditor</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  The assigned auditor is compiling Schedule 5 disclosures, 5-year financials, and BEPS risk indicators.
                </p>
              </div>
              <Badge color="slate">Auditor Turn</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Qualitative Hypothesis */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Initial Working Hypothesis Description
                </label>
                <Textarea
                  value={hypDesc}
                  onChange={(e) => setHypDesc(e.target.value)}
                  rows={4}
                  placeholder="e.g. Taxpayer is artificially depressing operating profits through excessive offshore management fees paid to Mauritian affiliate and understated domestic transfer pricing to SEZ entities..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Identified Controlled Issues & Key Focus Areas
                </label>
                <Input
                  value={identifiedIssue}
                  onChange={(e) => setIdentifiedIssue(e.target.value)}
                  placeholder="e.g. Excessive management fee deduction without benefit test proof; thin capitalization; procurement markups"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Preliminary Methodological Direction
                </label>
                <Select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  options={[
                    { value: 'TNMM', label: 'Transactional Net Margin Method (TNMM) - Recommended' },
                    { value: 'CUP', label: 'Comparable Uncontrolled Price (CUP)' },
                    { value: 'RPM', label: 'Resale Price Method (RPM)' },
                    { value: 'CPM', label: 'Cost Plus Method (CPM)' },
                    { value: 'PSM', label: 'Profit Split Method (PSM)' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Economic Rationale & Business Case Justification
                </label>
                <Textarea
                  value={econRationale}
                  onChange={(e) => setEconRationale(e.target.value)}
                  rows={3}
                  placeholder="e.g. Benchmarking indicates comparable operating margins at 6.4%, while taxpayer reports 1.5% despite steady 18% annual turnover growth..."
                />
              </div>
            </div>

            {/* Right Column: Quantitative Revenue at Risk Calculator */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign size={16} className="text-red-500" />
                  Revenue at Risk Modeling Engine
                </span>
                <Badge color="red">Live Statutory Calculation</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Audited Turnover (ETB)
                  </label>
                  <Input
                    type="number"
                    value={baseTurnover}
                    onChange={(e) => setBaseTurnover(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Taxpayer EBIT Margin %
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={reportedMargin}
                    onChange={(e) => setReportedMargin(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Industry Median EBIT %
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={benchmarkMargin}
                    onChange={(e) => setBenchmarkMargin(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Offshore Service Fees (ETB)
                  </label>
                  <Input
                    type="number"
                    value={managementFees}
                    onChange={(e) => setManagementFees(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Calculated Breakdown Cards */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Operating Profit Shortfall ({benchmarkMargin}% - {reportedMargin}%):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">ETB {profitShortfall.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Corporate Income Tax Adjustment (30% CIT):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">ETB {citDelta.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Disallowed Fees WHT Exposure ({whtRate}%):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">ETB {whtDelta.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Statutory Penalties & Interest (Est. {penaltyRate}%):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">ETB {penaltyDelta.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Total Amount of Revenue at Risk:</span>
                  <span className="font-mono font-bold text-lg text-red-600 dark:text-red-400">ETB {totalRevenueAtRisk.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <Button variant="ghost" onClick={() => setActiveGate('INTAKE_REVIEW')}>
              <ArrowLeft size={14} className="mr-1.5" /> Back to Intake
            </Button>
            <div className="flex gap-3 items-center">
              {riskGate?.status === 'APPROVED' ? (
                <Badge color="green" className="py-1.5 px-3 font-semibold">
                  <CheckCircle2 size={14} className="mr-1 inline text-emerald-600" />
                  Risk Assessment Approved & Finalized ✓
                </Badge>
              ) : (['SUBMITTED_FOR_COMMITTEE', 'RISK_ASSESSMENT_SUBMITTED_COMMITTEE'].includes(caseDetails.status) || riskGate?.status === 'SUBMITTED_FOR_COMMITTEE') ? (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm animate-pulse" 
                  onClick={handleApproveRiskAssessment} 
                  disabled={saving}
                >
                  <CheckCircle2 size={14} className="mr-1.5" />
                  Approve Risk Assessment & Unlock Planning
                </Button>
              ) : (
                <Badge color="slate" className="py-1.5 px-3 text-slate-500 font-medium">
                  <Lock size={12} className="mr-1 inline" />
                  Approval Inactive (Awaiting TL Endorsement)
                </Badge>
              )}
              <Button onClick={handleSaveWorkingHypothesis} disabled={saving || riskGate?.status === 'APPROVED'}>
                <Save size={14} className="mr-1.5" />
                Save Working Hypothesis & Business Case
              </Button>
              <Button variant="secondary" onClick={() => setActiveGate('PLANNING_MEETING')}>
                Proceed to Planning Meeting <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── GATE 3: REVIEW COMMITTEE PLANNING MEETING & MANDATE  ────── */}
      {activeGate === 'PLANNING_MEETING' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="text-blue-500" size={20} />
                  Gate 3: Review Committee Planning Meeting & Mandate
                </h3>
              <p className="text-sm text-slate-500 mt-1">
                Statutory Rule: Review committee reviews transfer pricing case in planning meeting. As the review committee decides to <strong>CONTINUE</strong>, the <strong>‘Audit Planning and Programming’</strong> will be triggered.
              </p>
            </div>
            <Badge color={currentStatus === 'PLANNING_TRIGGERED' || currentPhase === 'PLANNING' || currentPhase === 'FIELD_WORK' ? 'green' : 'amber'}>
              Phase: {currentPhase}
            </Badge>
          </div>

          {/* Established Hypothesis & Revenue Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Working Hypothesis</h4>
              <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2">{hyp.hypothesisDescription || hypDesc || 'Taxpayer profit compression via offshore services.'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Identified Focus Issues</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300">{hyp.identifiedIssue || identifiedIssue || 'Management fees and raw material imports.'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Revenue at Risk</h4>
              <p className="text-base font-bold font-mono text-red-600 dark:text-red-400">
                ETB {Number(totalRevenueAtRisk || hyp.revenueAtRisk || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Meeting Minutes & Deliberation Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Planning Meeting Attendees & Quorum
              </label>
              <Input
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="e.g. Committee Chair, Lead TP Economist, Legal Advisor, Tax Center Operations Lead"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Target Audit Scope (Fiscal Years)
              </label>
              <Input
                value={targetYears}
                onChange={(e) => setTargetYears(e.target.value)}
                placeholder="e.g. FY 2020 - FY 2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Planning Mandate Directives to Audit Team
              </label>
              <Input
                value={mandateDirectives}
                onChange={(e) => setMandateDirectives(e.target.value)}
                placeholder="Specific instructions to auditor on scope, focus transactions, and benchmarking"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Planning Submission Deadline
              </label>
              <Input
                type="number"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                placeholder="Days (e.g. 20)"
              />
            </div>
          </div>

          {/* Designate / Confirm TP Team Leader for Audit Execution */}
          <div className="mt-4 p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-purple-950 dark:text-purple-200 uppercase flex items-center gap-2">
                <Users size={14} className="text-purple-600" />
                <span>Designated TP Team Leader (Supervisory Execution Lead)</span>
              </label>
              {assignedTeamLeaderId && (
                <Badge color="purple" size="xs">
                  Assigned: {teamLeaders.find(tl => tl.username === assignedTeamLeaderId)?.fullName || assignedTeamLeaderId}
                </Badge>
              )}
            </div>
            <Select
              value={assignedTeamLeaderId}
              onChange={(e) => setAssignedTeamLeaderId(e.target.value)}
              className="bg-white dark:bg-slate-800"
            >
              <option value="">Select a TP Team Leader to assign...</option>
              {teamLeaders.map(tl => (
                <option key={tl.userId || tl.username} value={tl.username}>
                  {tl.fullName || tl.username} ({tl.username}) — {tl.assignedLocation || 'Tax Center'}
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-1">
              Statutory Hand-Off: Upon issuing this planning mandate, the designated TP Team Leader will supervise the field team, review the audit plan & IDR-01, and oversee investigation milestones.
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Planning Meeting Minutes & Deliberation Notes
            </label>
            <Textarea
              value={meetingMinutes}
              onChange={(e) => setMeetingMinutes(e.target.value)}
              rows={3}
              placeholder="Document committee deliberations on hypothesis validity, economic feasibility, and quorum decision..."
            />
          </div>

          {/* Active Mandate Status Notice if already continuous */}
          {(currentStatus === 'PLANNING_TRIGGERED' || currentPhase === 'PLANNING' || currentPhase === 'FIELD_WORK') && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Planning Mandate Active!</strong> The Review Committee decided to continue. Case is currently in Phase 4 (Audit Planning & Programming) on the Auditor & Team Leader Dashboards.
              </span>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={() => {
                const comments = prompt('Enter return notes / reasons for discontinuing:');
                if (comments) {
                  setCommitteeComments(comments);
                  handlePlanningMeetingDecision('DISCONTINUE');
                }
              }}
              disabled={saving}
            >
              Discontinue / Drop Case
            </Button>

            <Button 
              onClick={() => handlePlanningMeetingDecision('CONTINUE')} 
              disabled={saving || currentStatus === 'PLANNING_TRIGGERED' || currentPhase === 'PLANNING' || currentPhase === 'FIELD_WORK'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 size={14} className="mr-1.5" />
              Decide to Continue & Hand Off to TP Team (Trigger Planning)
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 4: FORMAL AUDIT PLAN APPROVAL ─────────────────────────────────── */}
      {activeGate === 'PLAN_APPROVAL' && riskGate?.status !== 'APPROVED' && (
        <Card className="p-8 text-center border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Gate 4: Formal Audit Plan Statutory Approval Locked
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-4">
            Under Art. 79 statutory sequencing, Detailed Risk Assessment (Phase 1) must be formally approved by the Review Committee before the Comprehensive Audit Plan can be submitted and approved.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="sm" onClick={() => setActiveGate('WORKING_HYPOTHESIS')}>
              Go to Gate 2: Risk Assessment & Hypothesis →
            </Button>
          </div>
        </Card>
      )}

      {activeGate === 'PLAN_APPROVAL' && riskGate?.status === 'APPROVED' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-indigo-500" size={20} />
                Gate 4: Formal Audit Plan Statutory Approval
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Process Owner reviews the comprehensive audit plan prepared by the auditor and endorsed by the Team Leader. Approval authorizes progression to Field Work.
              </p>
            </div>
            <Badge color={plan.status === 'APPROVED' || planGate?.status === 'APPROVED' ? 'green' : 'blue'}>
              Plan: {planGate?.status || plan.status || 'DRAFT'}
            </Badge>
          </div>

          {/* Turn-Based Status Banner for Gate 4 */}
          {planGate?.status === 'APPROVED' ? (
            <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Audit Plan Formally Approved & Fieldwork Authorized</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-1">
                  The statutory audit plan is finalized and locked. Audit team is authorized to initiate Phase 3 Field Work and issue IDRs.
                </p>
              </div>
              <Badge color="green">Plan Approved ✓</Badge>
            </div>
          ) : (planGate?.status === 'SUBMITTED_FOR_COMMITTEE' || caseDetails.status === 'AUDIT_PLAN_SUBMITTED_COMMITTEE') ? (
            <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between animate-pulse">
              <div>
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles size={15} className="text-purple-600" />
                  <span>⚡ Action Due: Audit Plan Endorsed by Team Leader</span>
                </div>
                <p className="text-xs text-purple-900 dark:text-purple-200 mt-1">
                  Team Leader has vetted the materiality scope, sampling schedule, and resource allocation. Review plan details and grant final statutory approval.
                </p>
              </div>
              <Badge color="purple" size="sm" dot>Approval Due</Badge>
            </div>
          ) : (planGate?.status === 'SUBMITTED_FOR_REVIEW' || caseDetails.status === 'AUDIT_PLAN_SUBMITTED_TL') ? (
            <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Clock size={15} className="text-amber-600" />
                  <span>Under Supervisory Review by Team Leader</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                  Auditor has submitted the Audit Plan. The Team Leader is currently reviewing work papers before routing to the Review Committee.
                </p>
              </div>
              <Badge color="amber">Awaiting TL Endorsement</Badge>
            </div>
          ) : (
            <div className="mb-5 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                  <Edit3 size={15} className="text-slate-500" />
                  <span>Audit Plan in Preparation by Lead Auditor</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  The auditor is establishing the audit scope, calculating materiality thresholds, and preparing the sampling methodology.
                </p>
              </div>
              <Badge color="slate">Auditor Turn</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Plan Objective & Scope</h4>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{plan.objective || 'Objective defined by auditor.'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Scope: {plan.scope || targetYears}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Materiality Threshold: <strong className="font-mono">ETB {Number(plan.materialityDetails?.materialityThreshold || 5000000).toLocaleString()}</strong>
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Endorsement Chain</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Endorsed by Team Leader: <strong className="text-purple-600">{caseDetails.assignedTeamLeaderName || 'Team Leader'}</strong>
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Sampling: {plan.samplingMethod?.samplingMethodology || 'Stratified high-value selection'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 items-center">
            {planGate?.status === 'APPROVED' ? (
              <Badge color="green" className="py-1.5 px-3 font-semibold">
                <CheckCircle2 size={14} className="mr-1 inline text-emerald-600" />
                Audit Plan Formally Approved ✓
              </Badge>
            ) : (planGate?.status === 'SUBMITTED_FOR_COMMITTEE' || caseDetails.status === 'AUDIT_PLAN_SUBMITTED_COMMITTEE') ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const c = prompt('Enter plan revision directives:');
                    if (c) {
                      setCommitteeComments(c);
                      handleApprovePlan('REJECTED');
                    }
                  }}
                  disabled={saving}
                >
                  Return Plan with Comments
                </Button>
                <Button 
                  onClick={() => handleApprovePlan('APPROVED')} 
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm animate-pulse"
                >
                  <CheckCircle2 size={14} className="mr-1.5" />
                  Grant Final Statutory Plan Approval & Authorize Fieldwork
                </Button>
              </>
            ) : (
              <Badge color="slate" className="py-1.5 px-3 text-slate-500 font-medium">
                <Lock size={12} className="mr-1 inline" />
                Approval Inactive (Awaiting Team Leader Endorsement)
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* ── GATE 5: AUDIT PREPARATION REVIEW ───────────────────────────────────── */}
      {activeGate === 'PREPARATION_REVIEW' && planGate?.status !== 'APPROVED' && (
        <Card className="p-8 text-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Gate 5: Audit Preparation Review Locked
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mb-4">
            Statutory Rule: The Comprehensive Audit Plan (Gate 4) must receive final statutory approval from the Review Committee before Audit Preparation Review can begin.
          </p>
          <Button size="sm" onClick={() => setActiveGate('PLAN_APPROVAL')}>
            View Gate 4: Audit Plan Approval →
          </Button>
        </Card>
      )}

      {activeGate === 'PREPARATION_REVIEW' && planGate?.status === 'APPROVED' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                Gate 5: Review Results of Audit Preparation
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Statutory Rule: The TP Process Owner reviews results of audit preparations (initial taxpayer documentation, data matching, entry conference readiness) before or during fieldwork execution.
              </p>
            </div>
            <Badge color="green">Preparation Checked</Badge>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Audit Preparation Working Papers Status</span>
              <Badge color="blue">Verified by TL</Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Auditor has compiled initial taxpayer transaction dossiers, verified third-party customs declarations, and prepared entrance interview agendas.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setActiveGate('REPORT_APPROVAL')}>
              Proceed to Completed Report Review <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 6: FINAL REPORT APPROVAL ──────────────────────────────────────── */}
      {activeGate === 'REPORT_APPROVAL' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="text-purple-500" size={20} />
                Gate 6: Second-Level / Final TP Report Approval
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Review the completed TP Audit Report endorsed by the Team Leader. Approving the report authorizes formal transmission to the Taxpayer for the statutory 30-day signing window.
              </p>
            </div>
            <Badge color={report.status === 'COMMITTEE_APPROVED' ? 'green' : 'blue'}>
              Report Status: {report.status || 'DRAFT'}
            </Badge>
          </div>

          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Executive Summary</h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{report.executiveSummary || 'Audit completed with adjustments under TNMM.'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Economic Analysis Confirmation</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Method: <strong>{analysis.selectedTpMethod || selectedMethod}</strong> | Profit Adjustment: <strong>ETB {Number(analysis.varianceAmount || profitShortfall).toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                const c = prompt('Enter report rejection/revision directives:');
                if (c) {
                  setCommitteeComments(c);
                  handleApproveReport('RETURNED');
                }
              }}
              disabled={saving}
            >
              Request Revisions
            </Button>
            <Button onClick={() => handleApproveReport('APPROVED')} disabled={saving || report.status === 'COMMITTEE_APPROVED'}>
              <Send size={14} className="mr-1.5" />
              Approve Report & Authorize Dispatch for Signoff
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 7: STATUTORY NOTICE AUTHORIZATION ────────────────────────────── */}
      {activeGate === 'NOTICE_AUTHORIZATION' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="text-emerald-500" size={20} />
                Gate 7: Statutory Assessment Notice Sign-Off
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                The Assessment Notice must be signed by the Authorized Official (Committee Process Owner) before it carries legal enforceability under the Federal Tax Administration Proclamation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-500 uppercase">Principal Tax Adjustment</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                ETB {Number(notices.assessedPrincipalTax || citDelta).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Statutory Penalties</span>
              <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                ETB {Number(notices.penaltyAmount || penaltyDelta).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Total Legal Demand</span>
              <p className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
                ETB {(
                  Number(notices.assessedPrincipalTax || citDelta) +
                  Number(notices.penaltyAmount || penaltyDelta) +
                  Number(notices.interestAmount || Math.round(citDelta * 0.15))
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleAuthorizeNotice} disabled={saving}>
              <Scale size={14} className="mr-1.5" />
              Sign Assessment Notice as Authorized Official
            </Button>
          </div>
        </Card>
      )}

      {/* ── GATE 8: OBJECTION REVIEW & FRAUD REFERRAL ──────────────────────────── */}
      {activeGate === 'OBJECTION_FRAUD' && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="text-red-500" size={20} />
                Gate 8: Taxpayer Objection Review & Fraud Referral
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Statutory Rule: If taxpayer fails to raise objection or sign within the approved statutory window, the system SHALL trigger the Intelligence & Tax Fraud Investigation sub-process.
              </p>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 space-y-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-sm">
              <AlertTriangle size={16} />
              <span>Statutory Non-Response / Tax Fraud Referral Mechanism</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">
              Triggering this referral compiles an immutable forensic dossier and securely dispatches the case to the Ministry of Revenues Criminal Tax Fraud and Intelligence Directorate.
            </p>
            <div className="pt-2">
              <Button variant="destructive" size="sm" onClick={handleEscalateFraud} disabled={saving}>
                <AlertOctagon size={14} className="mr-1.5" />
                Dispatch Criminal Tax Fraud Investigation Referral
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
