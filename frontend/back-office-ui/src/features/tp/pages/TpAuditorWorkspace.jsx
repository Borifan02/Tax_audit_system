import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, FileText, Calendar, CheckCircle2, AlertTriangle, 
  Send, Layers, BarChart2, DollarSign, Calculator, ChevronRight,
  ArrowRight, ArrowLeft, UserCheck, Scale, AlertOctagon, RefreshCw, X, Users,
  FileCheck, Building2, ShieldCheck, Search, Clock, ClipboardList, Plus, Save,
  Lock, CheckCircle, HelpCircle, Check
} from 'lucide-react';
import { Card, Button, Badge, Alert, Input, Textarea, Select } from '../../../components/ui/index.jsx';
import { formatRevenue } from '../../ap/utils/revenueFormatter.js';
import { 
  AUDITOR_PHASES, 
  PHASE_SUB_STEPS, 
  getPreviousPhaseId, 
  getNextPhaseId, 
  getPhaseConfig 
} from '../data/tpSubStepConfigs.js';

import PhaseGateLockScreen from '../components/PhaseGateLockScreen.jsx';
import PhaseSubmissionModal from '../components/PhaseSubmissionModal.jsx';
import PhaseReviewBanner from '../components/PhaseReviewBanner.jsx';
import PhaseSubStepTracker from '../components/PhaseSubStepTracker.jsx';

import Phase1SubSteps from '../components/substeps/Phase1SubSteps.jsx';
import Phase2SubSteps from '../components/substeps/Phase2SubSteps.jsx';
import Phase3SubSteps from '../components/substeps/Phase3SubSteps.jsx';
import Phase4SubSteps from '../components/substeps/Phase4SubSteps.jsx';
import Phase5SubSteps from '../components/substeps/Phase5SubSteps.jsx';
import Phase6SubSteps from '../components/substeps/Phase6SubSteps.jsx';
import Phase7SubSteps from '../components/substeps/Phase7SubSteps.jsx';
import Phase8SubSteps from '../components/substeps/Phase8SubSteps.jsx';

const BASE_API = '/api/v1/backoffice/tp/cases';

const PHASE_ICONS = {
  DETAILED_RISK_ASSESSMENT: ShieldAlert,
  AUDIT_PLANNING: Calendar,
  FIELD_WORK: Layers,
  ANALYSIS: BarChart2,
  REPORT: FileText,
  ASSESSMENT: Calculator,
  NOTICE: Scale,
  CLOSURE: CheckCircle2
};

export default function TpAuditorWorkspace({ 
  caseData, 
  user, 
  onClose, 
  onRefresh, 
  initialGate, 
  assignedCases = [], 
  onSwitchCase 
}) {
  const [activeTab, setActiveTab] = useState(initialGate || 'DETAILED_RISK_ASSESSMENT');
  const [activeSubStepId, setActiveSubStepId] = useState('1.1');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fullState, setFullState] = useState(null);
  const [phaseGates, setPhaseGates] = useState([]);
  const [submittingPhase, setSubmittingPhase] = useState(null);

  // Form states bound to database
  // Phase 1: Risk Assessment
  const [riskLevel, setRiskLevel] = useState('HIGH');
  const [riskComments, setRiskComments] = useState('');
  const [taxpayerEvidenceNotes, setTaxpayerEvidenceNotes] = useState(
    'Taxpayer submitted 2024 annual audited financial statements, Schedule 5 related party disclosure, and foreign parent master file.'
  );

  // Phase 2: Audit Planning & Programming
  const [planObj, setPlanObj] = useState('');
  const [planScope, setPlanScope] = useState('');
  const [materialityThreshold, setMaterialityThreshold] = useState(5000000);
  const [planningMaterialityPct, setPlanningMaterialityPct] = useState(1.0);
  const [tolerableMisstatement, setTolerableMisstatement] = useState(3500000);
  const [qualitativeFactors, setQualitativeFactors] = useState(
    'Transactions with low-tax jurisdiction entities and SEZ affiliates are deemed qualitatively material.'
  );
  const [industryResearch, setIndustryResearch] = useState('');
  const [samplingMethod, setSamplingMethod] = useState('');
  const [allocatedHours, setAllocatedHours] = useState(480);
  const [timelineDays, setTimelineDays] = useState(90);

  // Phase 3: Field Work & Facts
  const [accountingNotes, setAccountingNotes] = useState('');
  const [factSummary, setFactSummary] = useState('');
  const [interviewMinutes, setInterviewMinutes] = useState('');
  const [newIdrSubject, setNewIdrSubject] = useState('');
  const [newIdrDescription, setNewIdrDescription] = useState('');
  const [showIdrModal, setShowIdrModal] = useState(false);

  // Phase 4: Economic Analysis
  const [selectedMethod, setSelectedMethod] = useState('TNMM');
  const [methodJustification, setMethodJustification] = useState('');
  const [iqrMin, setIqrMin] = useState(4.8);
  const [iqrMedian, setIqrMedian] = useState(6.4);
  const [iqrMax, setIqrMax] = useState(8.2);
  const [taxpayerResult, setTaxpayerResult] = useState(1.5);
  const [varianceAmt, setVarianceAmt] = useState(0);

  // Phase 5: Report & Exit Conference
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [legalGrounds, setLegalGrounds] = useState('');
  const [exitConfVenue, setExitConfVenue] = useState('');
  const [exitConfNotes, setExitConfNotes] = useState('');

  // Phase 6: Assessment
  const [assessedTax, setAssessedTax] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);

  const caseId = caseData?.id || caseData?.caseId;

  // Sync initialGate if passed
  useEffect(() => {
    if (initialGate) {
      setActiveTab(initialGate);
    }
  }, [initialGate]);

  const loadPhaseGates = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`${BASE_API}/${caseId}/phase-gates`, {
        headers: {
          'X-Actor-Id': user?.id || user?.username || 'tp-auditor'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPhaseGates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load phase gates:', err);
    }
  }, [caseId, user]);

  const loadFullState = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const [resState, resGates] = await Promise.all([
        fetch(`${BASE_API}/${caseId}/full-state`, {
          headers: { 'X-Actor-Id': user?.id || user?.username || 'tp-auditor' }
        }),
        fetch(`${BASE_API}/${caseId}/phase-gates`, {
          headers: { 'X-Actor-Id': user?.id || user?.username || 'tp-auditor' }
        })
      ]);

      if (resState.ok) {
        const data = await resState.json();
        setFullState(data);

        // Populate fields from real DB state
        if (data.riskAssessment) {
          setRiskLevel(data.riskAssessment.riskLevel || 'HIGH');
          setRiskComments(data.riskAssessment.comments || '');
        }

        if (data.auditPlan) {
          setPlanObj(data.auditPlan.objective || '');
          setPlanScope(data.auditPlan.scope || '');
          if (data.auditPlan.materialityDetails?.materialityThreshold != null) {
            setMaterialityThreshold(Number(data.auditPlan.materialityDetails.materialityThreshold));
          }
          if (data.auditPlan.materialityDetails?.planningMaterialityPct != null) {
            setPlanningMaterialityPct(Number(data.auditPlan.materialityDetails.planningMaterialityPct));
          }
          if (data.auditPlan.materialityDetails?.tolerableMisstatement != null) {
            setTolerableMisstatement(Number(data.auditPlan.materialityDetails.tolerableMisstatement));
          }
          if (data.auditPlan.materialityDetails?.qualitativeFactors) {
            setQualitativeFactors(data.auditPlan.materialityDetails.qualitativeFactors);
          }
          if (data.auditPlan.industryResearch?.businessModel) {
            setIndustryResearch(data.auditPlan.industryResearch.businessModel);
          }
          if (data.auditPlan.plannedProcedures?.allocatedHours != null) {
            setAllocatedHours(Number(data.auditPlan.plannedProcedures.allocatedHours));
          }
          if (data.auditPlan.samplingMethod?.samplingMethodology) {
            setSamplingMethod(data.auditPlan.samplingMethod.samplingMethodology);
          }
        }

        if (data.fieldWork) {
          setAccountingNotes(data.fieldWork.accountingMethods || '');
          if (data.fieldWork.factStatement?.summaryOfFacts) {
            setFactSummary(data.fieldWork.factStatement.summaryOfFacts);
          }
          if (data.fieldWork.factStatement?.taxpayerObservations) {
            setInterviewMinutes(data.fieldWork.factStatement.taxpayerObservations);
          }
        }

        if (data.analysis) {
          setSelectedMethod(data.analysis.selectedTpMethod || 'TNMM');
          if (data.analysis.armsLengthRangeMin != null) setIqrMin(Number(data.analysis.armsLengthRangeMin));
          if (data.analysis.armsLengthRangeMedian != null) setIqrMedian(Number(data.analysis.armsLengthRangeMedian));
          if (data.analysis.armsLengthRangeMax != null) setIqrMax(Number(data.analysis.armsLengthRangeMax));
          if (data.analysis.taxpayerActualResult != null) setTaxpayerResult(Number(data.analysis.taxpayerActualResult));
          if (data.analysis.varianceAmount != null) setVarianceAmt(Number(data.analysis.varianceAmount));
        }

        if (data.reports && data.reports.length > 0) {
          const rep = data.reports[0];
          setExecutiveSummary(rep.executiveSummary || '');
          setLegalGrounds(rep.legalGrounds || '');
        }

        if (data.exitConference) {
          setExitConfVenue(data.exitConference.venue || '');
          setExitConfNotes(data.exitConference.auditorNotes || '');
        }

        if (data.notices) {
          if (data.notices.assessedPrincipalTax != null) setAssessedTax(Number(data.notices.assessedPrincipalTax));
          if (data.notices.penaltyAmount != null) setPenaltyAmount(Number(data.notices.penaltyAmount));
          if (data.notices.interestAmount != null) setInterestAmount(Number(data.notices.interestAmount));
        }
      }

      if (resGates.ok) {
        const gatesData = await resGates.json();
        setPhaseGates(Array.isArray(gatesData) ? gatesData : []);
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

  // Adjust activeSubStepId when activeTab changes
  useEffect(() => {
    const config = getPhaseConfig(activeTab);
    const subSteps = PHASE_SUB_STEPS[activeTab] || [];
    if (subSteps.length > 0) {
      const exists = subSteps.some(s => s.id === activeSubStepId);
      if (!exists) {
        setActiveSubStepId(subSteps[0].id);
      }
    }
  }, [activeTab]);

  const getGate = useCallback((phaseId) => {
    return phaseGates.find(g => g.phaseId === phaseId) || null;
  }, [phaseGates]);

  const isPhaseUnlocked = useCallback((phaseId) => {
    if (phaseId === 'DETAILED_RISK_ASSESSMENT') return true;
    const g = getGate(phaseId);
    return g ? !!g.isUnlocked : false;
  }, [getGate]);

  const executeApiAction = async (endpoint, payload, successMessage) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_API}/${caseId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-auditor'
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

  const handleToggleSubStep = async (subStepId, completed, data) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_API}/${caseId}/phases/${activeTab}/sub-steps/${subStepId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-auditor'
        },
        body: JSON.stringify({ completed, data })
      });
      if (res.ok) {
        await loadPhaseGates();
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: err.message || 'Failed to update sub-step completion status' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPhase = async (phaseId, authorityRole, remarks) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_API}/${caseId}/phases/${phaseId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': user?.id || user?.username || 'tp-auditor'
        },
        body: JSON.stringify({ authority: authorityRole, remarks })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Submission failed');
      }
      setMsg({ 
        type: 'success', 
        text: `Phase dossier successfully submitted to ${authorityRole} for statutory review.` 
      });
      setSubmittingPhase(null);
      await loadPhaseGates();
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Phase 3: Create IDR
  const handleCreateIdr = async () => {
    if (!newIdrSubject) return;
    await executeApiAction('/field-work/idr/create', {
      requestSubject: newIdrSubject,
      detailedItemsRequested: newIdrDescription,
      submissionDeadline: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
    }, 'Information Document Request (IDR) issued and logged.');
    setNewIdrSubject('');
    setNewIdrDescription('');
    setShowIdrModal(false);
  };

  const caseDetails = fullState?.caseDetails || {};
  const currentGate = getGate(activeTab);
  const currentPhaseConfig = getPhaseConfig(activeTab);
  const currentSubSteps = PHASE_SUB_STEPS[activeTab] || [];
  const completedSubSteps = Array.isArray(currentGate?.subStepsCompleted) 
    ? currentGate.subStepsCompleted 
    : [];
  const unlocked = isPhaseUnlocked(activeTab);
  const isPhaseLockedForEditing = ['SUBMITTED_FOR_REVIEW', 'SUBMITTED_FOR_COMMITTEE', 'APPROVED'].includes(currentGate?.status);

  return (
    <div className="space-y-6 pb-16">
      {/* Sleek, Professional Executive Case Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button 
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs flex-shrink-0"
              title="Back to Case Selection"
            >
              <ArrowLeft size={14} />
              <span>Back to Cases</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {caseDetails.taxpayerName || caseData?.taxpayerName || 'Transfer Pricing Case'}
                </h1>
                <Badge color={caseDetails.riskScore >= 80 ? 'red' : 'amber'}>
                  Risk Score: {caseDetails.riskScore || '—'}
                </Badge>
                <Badge color="blue">
                  {currentPhaseConfig.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 text-xs text-slate-500 font-mono">
                <span>Case: <strong className="text-slate-800 dark:text-slate-200">{caseDetails.caseNumber || caseData?.caseNumber}</strong></span>
                <span>TIN: <strong className="text-slate-800 dark:text-slate-200">{caseDetails.taxpayerId || caseData?.taxpayerId}</strong></span>
                <span>Tax Center: <strong className="text-slate-800 dark:text-slate-200">{caseDetails.taxCenterCode || 'Federal LTO'}</strong></span>
                <span>Supervisor: <strong className="text-blue-600">{caseDetails.assignedTeamLeaderName || caseDetails.assignedTeamLeaderId || 'Assigned TL'}</strong></span>
                <span>Est. Revenue: <strong className="text-slate-800 dark:text-slate-200">{formatRevenue(caseDetails.estimatedRevenue)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-center">
            {assignedCases && assignedCases.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch:</span>
                <select
                  value={caseId}
                  onChange={(e) => {
                    const found = assignedCases.find(c => (c.id || c.caseId) === e.target.value);
                    if (found && onSwitchCase) onSwitchCase(found);
                  }}
                  className="text-xs font-bold bg-transparent border-0 text-slate-900 dark:text-white cursor-pointer max-w-[200px] truncate focus:ring-0"
                >
                  {assignedCases.map(c => {
                    const cid = c.id || c.caseId;
                    const name = c.taxpayerName || c.taxpayerId || 'Case';
                    const shortNum = c.caseNumber ? c.caseNumber.split('-').slice(-2).join('-') : cid.slice(0, 8);
                    return (
                      <option key={cid} value={cid}>
                        {name} ({shortNum})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={loadFullState} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin mr-1' : 'mr-1'} />
              Sync DB
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {msg && (
        <Alert 
          type={msg.type === 'error' ? 'error' : 'success'} 
          title={msg.type === 'error' ? 'Operation Failed' : 'Success'}
          onClose={() => setMsg(null)}
        >
          {msg.text}
        </Alert>
      )}

      {/* Strict Phase Gate Lock Screen or Active Phase Workspace */}
      {!unlocked ? (
        <PhaseGateLockScreen 
          phaseId={activeTab} 
          getGate={getGate} 
          onNavigatePhase={(targetId) => setActiveTab(targetId)} 
        />
      ) : (
        <div className="space-y-6">
          {/* Phase Review Status Banner (Appears when Under Review, Approved, or Revision Requested) */}
          <PhaseReviewBanner
            gate={currentGate}
            phaseConfig={currentPhaseConfig}
            saving={saving}
            user={user}
          />

          <Card className="p-6 space-y-6">
            {/* 6-Sub-Step Progress Tracker */}
            <PhaseSubStepTracker
              subSteps={currentSubSteps}
              activeSubStepId={activeSubStepId}
              onSelectSubStep={setActiveSubStepId}
              completedSubSteps={completedSubSteps}
              phaseConfig={currentPhaseConfig}
              gate={currentGate}
            />

            {/* Sub-Step Content Rendering */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              {activeTab === 'DETAILED_RISK_ASSESSMENT' && (
                <Phase1SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  fullState={fullState}
                  riskLevel={riskLevel}
                  setRiskLevel={setRiskLevel}
                  riskComments={riskComments}
                  setRiskComments={setRiskComments}
                  taxpayerEvidenceNotes={taxpayerEvidenceNotes}
                  setTaxpayerEvidenceNotes={setTaxpayerEvidenceNotes}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                  isReadOnly={isPhaseLockedForEditing}
                />
              )}

              {activeTab === 'AUDIT_PLANNING' && (
                <Phase2SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  fullState={fullState}
                  planObj={planObj}
                  setPlanObj={setPlanObj}
                  planScope={planScope}
                  setPlanScope={setPlanScope}
                  materialityThreshold={materialityThreshold}
                  setMaterialityThreshold={setMaterialityThreshold}
                  planningMaterialityPct={planningMaterialityPct}
                  setPlanningMaterialityPct={setPlanningMaterialityPct}
                  tolerableMisstatement={tolerableMisstatement}
                  setTolerableMisstatement={setTolerableMisstatement}
                  qualitativeFactors={qualitativeFactors}
                  setQualitativeFactors={setQualitativeFactors}
                  industryResearch={industryResearch}
                  setIndustryResearch={setIndustryResearch}
                  samplingMethod={samplingMethod}
                  setSamplingMethod={setSamplingMethod}
                  allocatedHours={allocatedHours}
                  setAllocatedHours={setAllocatedHours}
                  timelineDays={timelineDays}
                  setTimelineDays={setTimelineDays}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                  isReadOnly={isPhaseLockedForEditing}
                />
              )}

              {activeTab === 'FIELD_WORK' && (
                <Phase3SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  isReadOnly={isPhaseLockedForEditing}
                  fullState={fullState}
                  accountingNotes={accountingNotes}
                  setAccountingNotes={setAccountingNotes}
                  factSummary={factSummary}
                  setFactSummary={setFactSummary}
                  interviewMinutes={interviewMinutes}
                  setInterviewMinutes={setInterviewMinutes}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                  onOpenIdrModal={() => setShowIdrModal(true)}
                />
              )}

              {activeTab === 'ANALYSIS' && (
                <Phase4SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  isReadOnly={isPhaseLockedForEditing}
                  fullState={fullState}
                  selectedMethod={selectedMethod}
                  setSelectedMethod={setSelectedMethod}
                  methodJustification={methodJustification}
                  setMethodJustification={setMethodJustification}
                  iqrMin={iqrMin}
                  setIqrMin={setIqrMin}
                  iqrMedian={iqrMedian}
                  setIqrMedian={setIqrMedian}
                  iqrMax={iqrMax}
                  setIqrMax={setIqrMax}
                  taxpayerResult={taxpayerResult}
                  setTaxpayerResult={setTaxpayerResult}
                  varianceAmt={varianceAmt}
                  setVarianceAmt={setVarianceAmt}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                />
              )}

              {activeTab === 'REPORT' && (
                <Phase5SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  isReadOnly={isPhaseLockedForEditing}
                  fullState={fullState}
                  executiveSummary={executiveSummary}
                  setExecutiveSummary={setExecutiveSummary}
                  legalGrounds={legalGrounds}
                  setLegalGrounds={setLegalGrounds}
                  exitConfVenue={exitConfVenue}
                  setExitConfVenue={setExitConfVenue}
                  exitConfNotes={exitConfNotes}
                  setExitConfNotes={setExitConfNotes}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                />
              )}

              {activeTab === 'ASSESSMENT' && (
                <Phase6SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  isReadOnly={isPhaseLockedForEditing}
                  fullState={fullState}
                  varianceAmt={varianceAmt}
                  assessedTax={assessedTax}
                  setAssessedTax={setAssessedTax}
                  penaltyAmount={penaltyAmount}
                  setPenaltyAmount={setPenaltyAmount}
                  interestAmount={interestAmount}
                  setInterestAmount={setInterestAmount}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                />
              )}

              {activeTab === 'NOTICE' && (
                <Phase7SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  isReadOnly={isPhaseLockedForEditing}
                  fullState={fullState}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                />
              )}

              {activeTab === 'CLOSURE' && (
                <Phase8SubSteps
                  subStepId={activeSubStepId}
                  onSelectSubStep={setActiveSubStepId}
                  onProceedToPhase={setActiveTab}
                  isReadOnly={isPhaseLockedForEditing}
                  fullState={fullState}
                  completedSubSteps={completedSubSteps}
                  onToggleComplete={handleToggleSubStep}
                  saving={saving}
                  executeApiAction={executeApiAction}
                  onClose={onClose}
                  onRefresh={onRefresh}
                />
              )}
            </div>
          </Card>

          {/* Phase Governance Execution Bottom Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                completedSubSteps.length === currentSubSteps.length 
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
              }`}>
                {completedSubSteps.length}/{currentSubSteps.length}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Phase {currentPhaseConfig.num} Sub-Step Governance: {completedSubSteps.length} of {currentSubSteps.length} Completed
                </div>
                <div className="text-[11px] text-slate-500">
                  {completedSubSteps.length === currentSubSteps.length
                    ? 'All mandatory sub-steps completed. Phase dossier is eligible for supervisory submission.'
                    : `${currentSubSteps.length - completedSubSteps.length} sub-steps remaining before formal transmittal.`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentGate?.status === 'APPROVED' ? (
                <div className="flex items-center gap-2">
                  <Badge color="green" className="py-1 px-3 font-semibold">
                    <Check size={13} className="mr-1 inline" /> Phase Formally Approved ✓
                  </Badge>
                  {getNextPhaseId(activeTab) && (
                    <Button
                      size="sm"
                      onClick={() => setActiveTab(getNextPhaseId(activeTab))}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Proceed to Phase {getPhaseConfig(getNextPhaseId(activeTab)).num} →
                    </Button>
                  )}
                </div>
              ) : currentGate?.status === 'SUBMITTED_FOR_REVIEW' ? (
                <Badge color="amber" className="py-1.5 px-3.5 font-semibold text-xs flex items-center gap-1.5">
                  <Clock size={13} /> Submitted to {currentPhaseConfig.authority} (Under Supervisory Review)
                </Badge>
              ) : currentGate?.status === 'SUBMITTED_FOR_COMMITTEE' ? (
                <Badge color="purple" className="py-1.5 px-3.5 font-semibold text-xs flex items-center gap-1.5">
                  <Clock size={13} /> Endorsed by TL & Under Review by TP Committee
                </Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={completedSubSteps.length < currentSubSteps.length || saving}
                  onClick={() => setSubmittingPhase(currentPhaseConfig)}
                  className={completedSubSteps.length === currentSubSteps.length 
                    ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}
                >
                  <Send size={14} className="mr-1.5" />
                  Submit Phase Dossier to {currentPhaseConfig.authority}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Submit Phase Dossier for Formal Approval */}
      <PhaseSubmissionModal
        isOpen={!!submittingPhase}
        onClose={() => setSubmittingPhase(null)}
        phaseConfig={submittingPhase}
        onSubmit={handleSubmitPhase}
        saving={saving}
      />

      {/* IDR Create Modal for Phase 3 */}
      {showIdrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Issue Information Document Request (IDR)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Formally request transfer pricing local files, intercompany agreements, or management service deliverables.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <Input
                  value={newIdrSubject}
                  onChange={(e) => setNewIdrSubject(e.target.value)}
                  placeholder="e.g. Schedule 5 Technical Services Documentation Request"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Specific Items Requested</label>
                <Textarea
                  value={newIdrDescription}
                  onChange={(e) => setNewIdrDescription(e.target.value)}
                  rows={4}
                  placeholder="1. Intercompany contract copies&#10;2. Proof of benefit test&#10;3. Timesheets and deliverables"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowIdrModal(false)}>Cancel</Button>
              <Button onClick={handleCreateIdr} disabled={saving || !newIdrSubject}>
                Issue & Send to Taxpayer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
