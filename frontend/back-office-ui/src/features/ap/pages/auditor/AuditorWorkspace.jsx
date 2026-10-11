/**
 * AuditorWorkspace - Dedicated 10-step audit workflow page for auditors
 * 
 * Features:
 * - Sidebar showing all 10 workflow steps
 * - Main content area for the current step
 * - Step-specific action panels
 * - Progress tracking and timeline
 * - Real-time state management
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle, Clock, FileText, Users,
  Send, AlertTriangle, Cpu, TestTube, MessageSquare, Calendar, FileSearch,
  FolderOpen, ClipboardList, Loader2, Download, FileCheck, MapPin,
  Shield, TrendingUp, AlertCircle, Briefcase, Eye, PlayCircle,
  FileSearch as SearchIcon, Scale, Building2, Hash, User, Target, Star
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { useWorkflow } from '../../../teamleader/context/WorkflowContext.jsx';
import { WORKFLOW_STEPS, WORKFLOW_STEP_IDS } from '../../../teamleader/data/workflowConstants.js';
import WorkflowProgress from '../../../teamleader/components/WorkflowProgress.jsx';
import StatusBadge from '../../../teamleader/components/StatusBadge.jsx';
import { Card, Button, Badge, Modal, Textarea, Input } from '../../../../components/ui/index.jsx';
import { auditorAPI } from './services/api.js';
import EntryConferencePanel from '../../../teamleader/components/EntryConferencePanel.jsx';
import DocumentRequestPanel from '../../../teamleader/components/DocumentRequestPanel.jsx';
import FindingsPanel from '../../../teamleader/components/FindingsPanel.jsx';
import JointCaatAnalysisPanel from '../../../teamleader/components/JointCaatAnalysisPanel.jsx';

// ── Step Icons Map ───────────────────────────────────────────────────────────
const STEP_ICONS = {
  CASE_DETAIL: FileText, PLANNING: ClipboardList,
  ENTRY_CONFERENCE: Calendar, INFO_REQUEST: FileSearch,
  CAAT_ANALYSIS: Cpu, AUDIT_TESTING: TestTube, FINDINGS: AlertTriangle,
  TAXPAYER_RESPONSE: MessageSquare, CONCLUSION: CheckCircle,
};


// ── Planning Step Panel ──────────────────────────────────────────────────────
function PlanningStepPanel({ caseData, existingPlan, onSubmit, onProceed }) {
  const [scope, setScope] = useState(existingPlan?.scope || '');
  const [objectives, setObjectives] = useState(existingPlan?.objectives || '');
  const [methodology, setMethodology] = useState(existingPlan?.methodology || '');
  const [timeline, setTimeline] = useState(existingPlan?.timeline || '');
  const [resourcePlan, setResourcePlan] = useState(existingPlan?.resourcePlan || '');

  const isSubmitted = existingPlan?.status === 'SUBMITTED';
  const isApproved = existingPlan?.status === 'APPROVED';
  const isRevision = existingPlan?.status === 'REVISION_REQUESTED';

  const handleSubmit = () => {
    onSubmit({ scope, objectives, methodology, timeline, resourcePlan });
  };

  return (
    <div className="space-y-6">
      {/* Plan Status Banner */}
      {existingPlan && (
        <Card className={`p-4 ${
          isApproved ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          isSubmitted ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
          isRevision ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
          ''
        }`}>
          <div className="flex items-center gap-3">
            {isApproved && <CheckCircle size={20} className="text-green-600 dark:text-green-400" />}
            {isSubmitted && <Send size={20} className="text-blue-600 dark:text-blue-400" />}
            {isRevision && <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {isApproved && 'Plan Approved'}
                {isSubmitted && 'Plan Submitted — Awaiting Team Leader Approval'}
                {isRevision && 'Revision Requested — Please update and resubmit'}
              </p>
              {isRevision && existingPlan.revisionNotes && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{existingPlan.revisionNotes}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <ClipboardList size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audit Planning</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Define scope, objectives, and methodology for this engagement</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Audit Scope
            </label>
            <Textarea
              placeholder="e.g., VAT compliance for FY2022-2024, including import transactions, financial statement accuracy, and withholding tax verification..."
              value={scope}
              onChange={e => setScope(e.target.value)}
              rows={3}
              disabled={isApproved}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Audit Objectives
            </label>
            <Textarea
              placeholder="e.g., Verify accuracy of reported income and VAT declarations, identify potential tax evasion or non-compliance areas..."
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
              rows={3}
              disabled={isApproved}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Methodology
              </label>
              <Textarea
                placeholder="e.g., Substantive testing, analytical procedures, CAAT analysis, bank confirmation, physical verification..."
                value={methodology}
                onChange={e => setMethodology(e.target.value)}
                rows={3}
                disabled={isApproved}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeline
              </label>
              <Textarea
                placeholder="e.g., 45 days from entry conference — Phase 1: Document collection (15 days), Phase 2: Analysis (20 days), Phase 3: Reporting (10 days)..."
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                rows={3}
                disabled={isApproved}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resource Plan
            </label>
            <Textarea
              placeholder="e.g., 2 auditors assigned, estimated 120 person-hours, CAAT tools required, travel to taxpayer premises..."
              value={resourcePlan}
              onChange={e => setResourcePlan(e.target.value)}
              rows={2}
              disabled={isApproved}
            />
          </div>

          {isApproved && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
              <span className="text-xs text-green-700 dark:text-green-300 font-medium flex items-center gap-1.5">
                <CheckCircle size={15} className="text-green-600" />
                Audit Plan approved by Team Leader. Ready for Entry Conference.
              </span>
              <Button variant="primary" icon={ArrowRight} onClick={onProceed}>
                Proceed to Entry Conference
              </Button>
            </div>
          )}

          {isSubmitted && !isApproved && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
                <Clock size={15} className="text-blue-600" />
                Plan submitted — Awaiting Team Leader approval before proceeding.
              </span>
              <Badge color="blue">Pending TL Approval</Badge>
            </div>
          )}

          {!isApproved && !isSubmitted && (
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary">Save Draft</Button>
              <Button variant="primary" icon={Send} onClick={handleSubmit}>
                {isRevision ? 'Resubmit Plan' : 'Submit Plan for Approval'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── CAAT Analysis Panel ──────────────────────────────────────────────────────
function CAATAnalysisPanel({ caseData, onRun, onComplete }) {
  const [selectedTypes, setSelectedTypes] = useState(['ASYCUDA_CUSTOMS_MATCH', 'REVENUE_VS_BANK']);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const analysisTypes = [
    { id: 'ASYCUDA_CUSTOMS_MATCH', label: 'ASYCUDA Customs vs Tax Filings', description: 'Cross-match customs import/export CIF declarations against VAT & CIT returns' },
    { id: 'VAT_WITHHOLDING_RECON', label: 'Inter-Agency Withholding & VAT Recon', description: 'Reconcile third-party withholding certificates with declared turnover' },
    { id: 'REVENUE_VS_BANK', label: 'Revenue vs Bank Deposits', description: 'Compare reported revenue with commercial bank deposit records' },
    { id: 'EXPENSE_RATIO', label: 'Expense Ratio & Deduction Analysis', description: 'Analyze expense-to-revenue ratios and disallowed cost items' },
    { id: 'PATTERN_DETECTION', label: 'Journal Entry Pattern Detection', description: 'Detect round-sum anomalies and unusual ledger adjustments' },
    { id: 'INDUSTRY_BENCHMARK', label: 'Sector Margin Benchmark', description: 'Compare gross & net profit margins against sector averages' },
  ];

  const toggleType = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      await onRun(selectedTypes);
      setResults({
        anomalies: [
          { id: 'anom-1', type: 'ASYCUDA_CUSTOMS_MATCH', severity: 'HIGH', description: 'Unreconciled variance between ASYCUDA CIF import valuation and declared cost of goods sold', amount: 4850000, decision: null },
          { id: 'anom-2', type: 'REVENUE_VS_BANK', severity: 'HIGH', description: 'Revenue underreporting detected against aggregated bank credit inflows', amount: 2300000, decision: null },
          { id: 'anom-3', type: 'EXPENSE_RATIO', severity: 'MEDIUM', description: 'Unsupported inter-branch overhead & customs clearing expense claims', amount: 450000, decision: null },
        ]
      });
    } finally {
      setRunning(false);
    }
  };

  const handleValidate = (anomalyId, decision) => {
    setResults(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        anomalies: prev.anomalies.map(a =>
          a.id === anomalyId ? { ...a, decision } : a
        )
      };
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Cpu size={20} className="text-violet-500" />
        Joint CAAT &amp; Inter-Agency Cross-Matching
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Run computer-assisted audit techniques and customs-tax cross-matching to detect discrepancies.
      </p>

      {!results ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {analysisTypes.map(type => (
              <button
                type="button"
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTypes.includes(type.id)
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{type.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={running ? Loader2 : Cpu}
              onClick={handleRunAnalysis}
              disabled={selectedTypes.length === 0 || running}
              className={running ? 'animate-pulse' : ''}
            >
              {running ? 'Running Analysis...' : 'Run CAAT Analysis'}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
            <p className="font-medium text-violet-800 dark:text-violet-200">
              {results.anomalies.length} anomalies detected across selected joint audit tests
            </p>
          </div>

          {results.anomalies.map(anomaly => (
            <div key={anomaly.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{anomaly.description}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Severity: <Badge color={anomaly.severity === 'HIGH' ? 'red' : 'yellow'}>{anomaly.severity}</Badge></span>
                    <span>· Amount: <strong>ETB {anomaly.amount?.toLocaleString()}</strong></span>
                    {anomaly.decision && (
                      <Badge color={anomaly.decision === 'ACCEPT' ? 'green' : 'gray'}>
                        {anomaly.decision === 'ACCEPT' ? 'Accepted for Finding' : 'Dismissed'}
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="xs" variant="success" onClick={() => handleValidate(anomaly.id, 'ACCEPT')}>Accept</Button>
                  <Button size="xs" variant="danger" onClick={() => handleValidate(anomaly.id, 'REJECT')}>Reject</Button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button variant="primary" icon={ArrowRight} onClick={onComplete}>
              Complete CAAT — Proceed to Testing
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}


// ── Conclusion Panel ─────────────────────────────────────────────────────────
function ConclusionPanel({ caseData, onFinalize }) {
  const [conclusions, setConclusions] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);

  const handleFinalize = () => {
    setIsFinalized(true);
    onFinalize(conclusions);
  };

  if (isFinalized) {
    return (
      <Card className="p-8 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Joint Audit Concluded</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          The joint audit has been finalized and the report is ready for digital signature and committee/supervisory endorsement.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" icon={Download}>Download Report</Button>
          <Button variant="primary" icon={FileText}>View Full Report</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CheckCircle size={20} className="text-green-500" />
        Joint Audit Conclusion
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Make final determinations for each finding and conclude the joint audit engagement.
      </p>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> Review all findings, taxpayer responses, and evidence before concluding.
          Once finalized, the case will be locked for supervisory &amp; committee sign-off.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary">Save Progress</Button>
        <Button variant="primary" icon={CheckCircle} onClick={handleFinalize}>
          Finalize &amp; Conclude Joint Audit
        </Button>
      </div>
    </Card>
  );
}

// ── Main Workspace Component ─────────────────────────────────────────────────
export default function AuditorWorkspace({ caseData, onBack, initialStep }) {
  const { user } = useAuth();
  const { getWorkflow, getStepProgress, actions } = useWorkflow();
  const [activeStep, setActiveStep] = useState(initialStep || 'CASE_DETAIL');
  const [wpTitle, setWpTitle] = useState('');
  const [wpNotes, setWpNotes] = useState('');
  const [localWorkingPapers, setLocalWorkingPapers] = useState([
    { id: 'WP-JA-01', title: 'ASYCUDA Import Declaration vs VAT Input Credit Schedule', reference: 'WP-101', notes: 'Verified 18 customs declarations against monthly VAT returns.' }
  ]);

  const caseId = caseData?.id || caseData?.caseId;
  const workflow = getWorkflow(caseId);
  const progress = getStepProgress(caseId);

  // Hydrate workflow from backend
  useEffect(() => {
    if (caseId && actions.loadWorkflow) {
      actions.loadWorkflow(caseId);
    }
  }, [caseId, actions.loadWorkflow]);

  // Set active step to initialStep or current workflow step
  useEffect(() => {
    if (initialStep) {
      setActiveStep(initialStep);
    } else if (workflow.currentStep && WORKFLOW_STEP_IDS.includes(workflow.currentStep)) {
      setActiveStep(workflow.currentStep);
    }
  }, [initialStep, workflow.currentStep]);

  // Get existing plan from workflow context
  const existingPlan = workflow.plan || null;

  // Build step statuses map
  const stepStatuses = useMemo(() => {
    const statuses = {};
    WORKFLOW_STEP_IDS.forEach(id => {
      const stepData = workflow.steps[id];
      statuses[id] = stepData?.status || 'upcoming';
    });
    return statuses;
  }, [workflow.steps]);


  // Step action handlers
  const handleSubmitPlan = (planData) => {
    actions.submitPlan(caseId, user.id, planData);
  };

  const handleRecordMinutes = () => {
    actions.recordMinutes(caseId, user.id, {
      date: new Date().toISOString(),
      attendees: ['Auditor', 'Taxpayer Representative'],
      agenda: 'Introduction of audit, scope discussion',
      agreements: ['Taxpayer will provide all requested documents within 15 business days'],
    });
    setActiveStep('INFO_REQUEST');
  };

  const handleCreateDocRequest = (requestData) => {
    actions.createDocRequest(caseId, user.id, {
      id: `req-${Date.now()}`,
      title: requestData.documentType,
      items: [requestData.description],
      deadline: requestData.dueDate,
      sentAt: new Date().toISOString(),
    });
  };

  const handleRunCAAT = async (analysisTypes) => {
    actions.runCAAT(caseId, user.id, {
      analysisTypes,
      anomalies: [],
    });
  };

  const handleSubmitFindings = async (findingsList) => {
    for (const f of findingsList) {
      if (!f.id || String(f.id).startsWith('f-')) {
        await actions.addFinding(caseId, {
          title: f.title || `${f.taxType || f.category || 'Tax'} Adjustment`,
          description: f.description,
          severity: f.severity,
          category: f.taxType || f.category || 'VAT',
          principalAmount: f.principalAmount || 0,
          penaltyAmount: f.penaltyAmount || 0,
          interestAmount: f.interestAmount || 0,
          finalAmount: f.finalAmount || f.amount || 0,
          amount: f.finalAmount || f.amount || 0,
          financialImpact: f.finalAmount || f.amount || 0,
          status: 'DRAFT',
        });
      }
    }
    actions.submitFindings(caseId, user.id);
  };

  const handleFinalize = () => {
    actions.concludeCase(caseId, user.id);
  };

  if (!caseData) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Joint Audit Execution Workspace</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Please select an assigned Joint Audit case from your dashboard or My Cases list to launch the 9-step statutory joint audit workspace.
        </p>
        {onBack && (
          <Button variant="primary" onClick={onBack}>
            Go to Assigned Cases
          </Button>
        )}
      </div>
    );
  }

  // Render current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 'CASE_DETAIL': {
        const riskScore = caseData?.riskScore || 0;
        const riskLevel = caseData?.riskPriority || caseData?.riskLevel;
        const riskColor = riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981';
        const riskBg = riskScore > 70 ? 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20' : riskScore > 40 ? 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' : 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20';
        const tin = caseData?.taxIdNumber || caseData?.tin;
        return (
          <div className="space-y-6">
            {/* ── Hero Case Banner ────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                        <Building2 size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-100">Audit Case</p>
                        <p className="text-2xl font-bold tracking-tight">{caseData?.taxpayerName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-sm font-medium">
                        <Hash size={14} /> {caseData?.caseCode || caseData?.caseNumber || caseData?.id?.slice(0, 8) || 'N/A'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-sm font-medium">
                        <User size={14} /> TIN: {tin || 'N/A'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-sm font-medium">
                        <Briefcase size={14} /> {caseData?.segment || caseData?.auditType || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {/* Risk Score Circle */}
                  <div className="text-center">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="52" fill="none"
                          stroke="white"
                          strokeWidth="10"
                          strokeDasharray={`${riskScore * 3.27} 327`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                          className="drop-shadow-lg"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white drop-shadow-md">{riskScore}</span>
                        <span className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider">Risk Score</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase">
                        <span className="w-2 h-2 rounded-full bg-white" /> {riskLevel || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Stats Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Status', value: caseData?.status?.replace(/_/g, ' ') || 'N/A', icon: Target, color: 'blue' },
                { label: 'Total Amount', value: caseData?.totalAmount ? `ETB ${parseFloat(caseData.totalAmount).toLocaleString()}` : 'N/A', icon: TrendingUp, color: 'green' },
                { label: 'Assessment Score', value: caseData?.assessmentScore || 'N/A', icon: Scale, color: 'purple' },
                { label: 'Created', value: caseData?.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : 'N/A', icon: Calendar, color: 'amber' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                const bg = { blue: 'bg-blue-50 dark:bg-blue-900/20', green: 'bg-green-50 dark:bg-green-900/20', purple: 'bg-purple-50 dark:bg-purple-900/20', amber: 'bg-amber-50 dark:bg-amber-900/20' }[stat.color];
                const iconColor = { blue: 'text-blue-600 dark:text-blue-400', green: 'text-green-600 dark:text-green-400', purple: 'text-purple-600 dark:text-purple-400', amber: 'text-amber-600 dark:text-amber-400' }[stat.color];
                return (
                  <Card key={i} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${bg}`}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider">{stat.label}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ── Main Content: Two-Column Layout ─────────────────────────── */}
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column (3/5) - Taxpayer & Address */}
              <div className="col-span-3 space-y-6">
                {/* Taxpayer Profile Card */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Taxpayer Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      { label: 'Business Name', value: caseData?.taxpayerName, bold: true },
                      { label: 'TIN Number', value: tin, mono: true },
                      { label: 'Business Type', value: caseData?.businessType },
                      { label: 'Sector / Industry', value: caseData?.sector },
                      { label: 'Annual Revenue', value: caseData?.annualRevenue ? `ETB ${(caseData.annualRevenue / 1000000).toFixed(1)}M` : null },
                      { label: 'Employees', value: caseData?.employees },
                    ].filter(f => f.value).map((field, i) => (
                      <div key={i}>
                        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">{field.label}</p>
                        <p className={`text-sm text-gray-900 dark:text-white mt-1 ${field.bold ? 'font-semibold text-base' : ''} ${field.mono ? 'font-mono' : ''}`}>{field.value}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Address Card */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <MapPin size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Address Details</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Street', value: caseData?.address },
                      { label: 'City', value: caseData?.city },
                      { label: 'Region', value: caseData?.region },
                    ].map((field, i) => (
                      <div key={i}>
                        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">{field.label}</p>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">{field.value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Tax Center</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">{caseData?.taxCenter || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Region</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">{caseData?.region || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                {/* Committee Justification */}
                {caseData?.committeeJustification && (
                  <Card className="p-6 border-l-4 border-l-violet-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                        <ClipboardList size={20} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Committee Justification</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Approved by Joint Audit Committee</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-violet-50/50 dark:bg-violet-900/10 p-4 rounded-xl">
                      {caseData.committeeJustification}
                    </p>
                    {caseData?.viabilityDecision && (
                      <div className="mt-4 pt-4 border-t border-violet-100 dark:border-violet-900/30 flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Viability:</span>
                        <Badge color={caseData.viabilityDecision === 'VIABLE' ? 'green' : caseData.viabilityDecision === 'CONDITIONALLY_VIABLE' ? 'yellow' : 'red'}>
                          {caseData.viabilityDecision?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                  </Card>
                )}
              </div>

              {/* Right Column (2/5) - Risk & Action */}
              <div className="col-span-2 space-y-6">
                {/* Risk Assessment Card */}
                <Card className={`p-6 bg-gradient-to-br ${riskBg} border border-red-200 dark:border-red-800`}>                  
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <Shield size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Risk Assessment</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Risk Level</span>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-sm font-bold uppercase">{riskLevel || 'N/A'}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mt-3">
                        <div className="bg-red-500 dark:bg-red-400 rounded-full h-3 transition-all duration-700" style={{ width: `${riskScore}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">0</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">100</span>
                      </div>
                    </div>
                    {caseData?.totalAmount && (
                      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Total Amount at Risk</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">ETB {parseFloat(caseData.totalAmount).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Risk Indicators */}
                {caseData?.riskIndicators && caseData.riskIndicators.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Risk Indicators</h3>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                        {caseData.riskIndicators.length} detected
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {caseData.riskIndicators.map((indicator, idx) => (
                        <div
                          key={indicator.id || idx}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition-all hover:shadow-sm ${
                            indicator.severity === 'HIGH'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : indicator.severity === 'MEDIUM'
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg mt-0.5 ${
                            indicator.severity === 'HIGH' ? 'bg-red-100 dark:bg-red-900/40' :
                            indicator.severity === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-900/40' :
                            'bg-green-100 dark:bg-green-900/40'
                          }`}>
                            <AlertTriangle size={14} className={`$
                              indicator.severity === 'HIGH' ? 'text-red-600 dark:text-red-400' :
                              indicator.severity === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400' :
                              'text-green-600 dark:text-green-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white text-xs">{indicator.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                indicator.severity === 'HIGH' ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                                indicator.severity === 'MEDIUM' ? 'bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' :
                                'bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                              }`}>{indicator.severity}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{indicator.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Audit Info Card */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <ClipboardList size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audit Information</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Audit Type', value: caseData?.auditType },
                      { label: 'Linked Plan', value: caseData?.planId, mono: true },
                      { label: 'Segment', value: caseData?.segment },
                    ].filter(f => f.value).map((field, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <span className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold tracking-wider">{field.label}</span>
                        <span className={`text-sm font-medium text-gray-900 dark:text-white ${field.mono ? 'font-mono text-xs' : ''}`}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Decision Reason */}
                {caseData?.decisionReason && (
                  <Card className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={16} className="text-amber-500" />
                      <span className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Decision Reason</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{caseData.decisionReason}</p>
                  </Card>
                )}
              </div>
            </div>

            {/* ── Action Bar ─────────────────────────────────────────────── */}
            <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Eye size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Review Complete?</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Proceed to the planning phase to begin your audit</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="md">Save Notes</Button>
                  <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setActiveStep('PLANNING')}>
                    Proceed to Planning
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      }

      case 'PLANNING':
        return (
          <PlanningStepPanel
            caseData={caseData}
            existingPlan={existingPlan}
            onSubmit={handleSubmitPlan}
            onProceed={() => setActiveStep('ENTRY_CONFERENCE')}
          />
        );

      case 'ENTRY_CONFERENCE':
        return (
          <EntryConferencePanel
            caseId={caseId}
            caseData={caseData}
            conference={workflow.conference}
            onSchedule={(conf) => actions.scheduleConference(caseId, user.id, conf)}
            onRecordMinutes={(mins) => {
              actions.recordMinutes(caseId, user.id, mins);
              setActiveStep('INFO_REQUEST');
            }}
            onSkip={(reason) => {
              actions.skipConference(caseId, user.id, reason);
              setActiveStep('INFO_REQUEST');
            }}
            isAuditor={true}
          />
        );

      case 'INFO_REQUEST':
        return (
          <DocumentRequestPanel
            caseData={caseData}
            requests={workflow.documentRequests || []}
            documents={workflow.documents || []}
            onSubmitRequest={handleCreateDocRequest}
            onUploadDoc={(doc) => actions.uploadDocument?.(caseId, doc)}
            onProceed={() => {
              actions.completeInfoRequest?.(caseId, user.id);
              setActiveStep('CAAT_ANALYSIS');
            }}
          />
        );

      case 'CAAT_ANALYSIS':
        return (
          <JointCaatAnalysisPanel
            caseId={caseId}
            caseData={caseData}
            workflow={workflow}
            actions={actions}
            actorId={user?.id || 'system'}
            mode="AUDITOR"
            onCompleteStep={() => {
              actions.completeCAAT?.(caseId, user?.id);
              setActiveStep('AUDIT_TESTING');
            }}
            onNavigateToFindings={() => setActiveStep('FINDINGS')}
          />
        );

      case 'AUDIT_TESTING':
        return (
          <Card className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TestTube size={20} className="text-yellow-500" />
                Joint Audit Substantive Testing &amp; Working Papers
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Perform manual substantive testing across tax and customs records, record working papers, and link supporting evidence.
              </p>
            </div>

            <div className="space-y-3">
              {localWorkingPapers.map((wp) => (
                <div key={wp.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/60 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge color="blue">{wp.reference}</Badge>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{wp.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{wp.notes}</p>
                  </div>
                  <Badge color="green">Indexed</Badge>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Add Working Paper</p>
              <Input
                placeholder="Working paper title (e.g., Physical Inventory & Bonded Warehouse Inspection)"
                value={wpTitle}
                onChange={e => setWpTitle(e.target.value)}
              />
              <Textarea
                placeholder="Testing procedure performed, sample size, and audit observations..."
                rows={2}
                value={wpNotes}
                onChange={e => setWpNotes(e.target.value)}
              />
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="secondary"
                  icon={FileText}
                  disabled={!wpTitle.trim()}
                  onClick={() => {
                    if (!wpTitle.trim()) return;
                    setLocalWorkingPapers(prev => [
                      ...prev,
                      {
                        id: `WP-JA-0${prev.length + 1}`,
                        reference: `WP-10${prev.length + 1}`,
                        title: wpTitle.trim(),
                        notes: wpNotes.trim() || 'Substantive testing working paper recorded.',
                      }
                    ]);
                    setWpTitle('');
                    setWpNotes('');
                  }}
                >
                  Add Working Paper
                </Button>
                <Button variant="primary" icon={ArrowRight} onClick={() => setActiveStep('FINDINGS')}>
                  Complete Testing — Draft Findings
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'FINDINGS':
        return (
          <FindingsPanel
            caseData={caseData}
            findings={workflow?.findings || []}
            onSubmit={handleSubmitFindings}
            onApprove={() => actions.approveFindings(caseId, user.id)}
            onProceed={() => setActiveStep('TAXPAYER_RESPONSE')}
            isTeamLeader={user?.role === 'TEAM_LEADER' || user?.role === 'SUPERVISOR'}
            isAuditor={true}
          />
        );

      case 'TAXPAYER_RESPONSE':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-sky-500" />
              Taxpayer Response
            </h3>
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-sky-800 dark:text-sky-200">
                Findings have been sent to the taxpayer. They have <strong>30 days</strong> to respond.
              </p>
            </div>
            <Button variant="primary" icon={MessageSquare} onClick={() => setActiveStep('CONCLUSION')}>
              Record Taxpayer Response &amp; Proceed
            </Button>
          </Card>
        );

      case 'CONCLUSION':
        return <ConclusionPanel caseData={caseData} onFinalize={handleFinalize} />;

      default:
        return (
          <Card className="p-6 text-center">
            <p className="text-gray-500">Select a step from the workflow tracker above to begin</p>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6 min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Cases
        </button>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            Joint Audit Execution Workspace
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {caseData?.taxpayerName || 'Joint Audit Execution'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Statutory Joint Audit Workflow — {progress.current} of {progress.total} steps complete ({progress.percent}%)
          </p>
        </div>
        <div className="w-28"></div>
      </div>

      {/* Workflow Progress (clickable steps) */}
      <Card className="p-6 overflow-x-auto">
        <WorkflowProgress
          currentStep={activeStep}
          stepStatuses={stepStatuses}
          onStepClick={(stepId) => setActiveStep(stepId)}
        />
      </Card>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Case Summary Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Taxpayer</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{caseData?.taxpayerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Risk</p>
              <StatusBadge status={caseData?.riskLevel || caseData?.riskPriority} variant="risk" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
              <StatusBadge status={workflow.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">Current Step</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {WORKFLOW_STEPS.find(s => s.id === activeStep)?.label || 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Activity Timeline */}
      {workflow.timeline?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={20} />
            Workflow Timeline
          </h3>
          <div className="space-y-3">
            {workflow.timeline.map((event, idx) => (
              <div key={idx} className="flex gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{event.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Step {WORKFLOW_STEPS.find(s => s.id === event.step)?.number || '?'}: {event.step} · {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
