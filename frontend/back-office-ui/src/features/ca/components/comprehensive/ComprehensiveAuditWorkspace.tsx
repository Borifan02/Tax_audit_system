import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  BadgeAlert,
  Send
} from 'lucide-react';
import {
  AuditCase,
  EvidenceItem,
  AuditProcedure,
  TaxAnalysis,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  DraftReport,
  AuditTrailEntry,
  SaveStatus,
  AuditStats,
  EntryConference,
  CAATAuditData,
  BalanceSheetItem,
  ComprehensiveReconciliation,
  ExitConference,
  AssessmentNotice,
  MultiZoneAllocation,
  AuthUser
} from '../../types/audit';
import { itasApi } from '../../services/api';
import { AuditHeader } from '../workspace/AuditHeader';
import { HorizontalStepper } from '../workspace/HorizontalStepper';
import { StepCompOverview } from './StepCompOverview';
import { StepEntryConference } from './StepEntryConference';
import { StepCAATEvidence } from './StepCAATEvidence';
import { StepCompProcedures } from './StepCompProcedures';
import { StepCompReconciliations } from './StepCompReconciliations';
import { StepQueries } from '../workspace/StepQueries';
import { StepFindings } from '../workspace/StepFindings';
import { StepWorkingPapers } from '../workspace/StepWorkingPapers';
import { StepExitConferenceAssessment } from './StepExitConferenceAssessment';
import { StepCompReviewSubmit } from './StepCompReviewSubmit';
import { AuditTrailDrawer } from '../workspace/AuditTrailDrawer';
import { CaseSwitcherModal } from '../workspace/CaseSwitcherModal';

export const COMP_STEPS = [
  'Overview',
  'Entry Conference',
  'CAAT & Evidence',
  'Audit Procedures',
  'Reconciliations',
  'Queries',
  'Findings',
  'Working Papers',
  'Exit & Assessment',
  'Review & Submit'
];

interface ComprehensiveAuditWorkspaceProps {
  caseId?: string;
  currentUser?: AuthUser;
  onCaseChange?: (newCaseId: string) => void;
}

export const ComprehensiveAuditWorkspace: React.FC<ComprehensiveAuditWorkspaceProps> = ({
  caseId = 'CA-2026-101',
  currentUser,
  onCaseChange
}) => {
  const [activeCaseId, setActiveCaseId] = useState<string>(caseId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  // Loading & Save states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());

  // Workspace Data Entities (from backend API)
  const [caseData, setCaseData] = useState<AuditCase | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [procedures, setProcedures] = useState<AuditProcedure[]>([]);
  const [analysis, setAnalysis] = useState<TaxAnalysis | null>(null);
  const [queries, setQueries] = useState<TaxQuery[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [workingPapers, setWorkingPapers] = useState<WorkingPaper[]>([]);
  const [draftReport, setDraftReport] = useState<DraftReport | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Comprehensive-specific modules
  const [entryConference, setEntryConference] = useState<EntryConference | null>(null);
  const [caatAudit, setCaatAudit] = useState<CAATAuditData | null>(null);
  const [balanceSheetItems, setBalanceSheetItems] = useState<BalanceSheetItem[]>([]);
  const [reconciliations, setReconciliations] = useState<ComprehensiveReconciliation | null>(null);
  const [exitConference, setExitConference] = useState<ExitConference | null>(null);
  const [assessmentNotice, setAssessmentNotice] = useState<AssessmentNotice | null>(null);
  const [multiZoneAllocations, setMultiZoneAllocations] = useState<MultiZoneAllocation[]>([]);

  // Modals
  const [isCaseSwitcherOpen, setIsCaseSwitcherOpen] = useState<boolean>(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);

  // Autosave timer ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (caseId && caseId !== activeCaseId) {
      setActiveCaseId(caseId);
    }
  }, [caseId]);

  // Load Full Case from Backend API
  const loadCaseData = useCallback(async (idToLoad: string) => {
    setIsLoading(true);
    try {
      const fullCase = await itasApi.getFullCase(idToLoad);
      setCaseData(fullCase.auditCase);
      setEvidenceList(fullCase.evidence || []);
      setProcedures(fullCase.procedures || []);
      setAnalysis(fullCase.analysis);
      setQueries(fullCase.queries || []);
      setFindings(fullCase.findings || []);
      setWorkingPapers(fullCase.workingPapers || []);
      setDraftReport(fullCase.draftReport);
      setAuditTrail(fullCase.auditTrail || []);

      // Comprehensive modules
      setEntryConference(fullCase.entryConference || {
        caseId: idToLoad,
        scheduledDate: fullCase.auditCase.startDate || '2026-09-01',
        time: '10:00 AM',
        venue: 'Taxpayer Corporate Headquarters',
        attendees: [
          { name: fullCase.auditCase.assignedAuditor, role: 'Lead Auditor', organization: 'Tax Authority' },
          { name: 'CFO / Financial Controller', role: 'Chief Financial Officer', organization: fullCase.auditCase.taxpayerName }
        ],
        internalControlsReview: 'ERP and general ledger systems reviewed. Document approval matrix operational.',
        premisesInspectionFindings: 'Initial site visit completed; manufacturing and warehouse premises verified.',
        taxpayerConfirmedReceipt: true,
        status: 'CONDUCTED',
        lastUpdated: new Date().toISOString()
      });

      setCaatAudit(fullCase.caatAudit || {
        caseId: idToLoad,
        isCAATEligible: true,
        caatToolName: 'ITAS Automated CAAT Forensic Suite',
        executionTimestamp: new Date().toISOString(),
        samplingMethod: fullCase.auditCase.samplingMethod || 'Stratified Sampling',
        rules: [],
        auditorNotes: 'CAAT execution initiated.'
      });

      setBalanceSheetItems(fullCase.balanceSheetItems || []);
      setReconciliations(fullCase.reconciliations || {
        caseId: idToLoad,
        vatVsSales: {
          annualVatSalesDeclared: 68400000,
          annualCitGrossTurnover: 70220000,
          timsElectronicInvoices: 67980000,
          variance: 1820000,
          status: 'DISCREPANCY_FLAGGED',
          notes: 'Gross revenue declared in CIT return exceeds monthly VAT returns.'
        },
        payrollPayeVsPnL: {
          payrollPayeRemitted: 3450000,
          pnlSalariesExpense: 3890000,
          variance: 440000,
          status: 'DISCREPANCY_FLAGGED',
          notes: 'Discrepancy between payroll PAYE and P&L expenses.'
        },
        customsImportsVsPurchases: {
          asycudaCifImports: 24100000,
          generalLedgerImportCosts: 26350000,
          variance: 2250000,
          status: 'DISCREPANCY_FLAGGED',
          notes: 'ASYCUDA import CIF values differ from GL purchases.'
        }
      });

      setExitConference(fullCase.exitConference || {
        caseId: idToLoad,
        scheduledDate: fullCase.auditCase.dueDate || '2026-11-15',
        time: '02:00 PM',
        venue: 'Regional Tax Center Boardroom',
        agendaItems: ['Substantive audit findings', 'Notice of assessment presentation', 'Objection rights'],
        discussionNotes: 'Deliberation of preliminary audit adjustments.',
        taxpayerResponseNotes: 'Taxpayer acknowledged review of draft findings.',
        attendanceConfirmed: true,
        signedByTaxpayer: true,
        status: 'COMPLETED'
      });

      setAssessmentNotice(fullCase.assessmentNotice || {
        caseId: idToLoad,
        noticeNumber: `NOT-COMP-${idToLoad}`,
        issueDate: new Date().toISOString().split('T')[0],
        statutoryDue30Days: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        principalTax: 584000,
        statutoryPenalty20: 116800,
        interest: 46720,
        totalAssessmentDue: 747520,
        objectionStatus: 'NONE',
        fraudReferralTriggered: false
      });

      setMultiZoneAllocations(fullCase.multiZoneAllocations || []);
      setLastSaved(fullCase.auditCase.lastSaved || new Date().toLocaleTimeString());
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to load comprehensive case data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCaseData(activeCaseId);
  }, [activeCaseId, loadCaseData]);

  // Real Calculated Audit Statistics (SOR FR-04.4)
  const auditStats: AuditStats = useMemo(() => {
    const verifiedEvidence = evidenceList.filter((e) => e.status === 'Verified').length;
    const requiredEvidence = 5;
    const completedProcs = procedures.filter((p) => p.status === 'COMPLETED').length;
    const totalProcs = procedures.length;
    const resolvedQueries = queries.filter((q) => q.status === 'RESOLVED').length;
    const totalQueries = queries.length;
    const totalTax = findings.reduce((sum, f) => sum + f.totalTaxImpact, 0);

    // Dynamic progress calculation:
    // Evidence (15%) + Procedures (30%) + Reconciliations (15%) + Queries (10%) + Findings (10%) + Working Papers (10%) + Exit Conf (10%)
    const evWeight = requiredEvidence > 0 ? (Math.min(verifiedEvidence, requiredEvidence) / requiredEvidence) * 15 : 0;
    const procWeight = totalProcs > 0 ? (completedProcs / totalProcs) * 30 : 0;
    const reconsWeight = reconciliations ? 15 : 0;
    const qWeight = totalQueries > 0 ? (resolvedQueries / totalQueries) * 10 : 10;
    const fWeight = findings.length > 0 ? 10 : 0;
    const wpWeight = workingPapers.length >= 2 ? 10 : (workingPapers.length / 2) * 10;
    const exitWeight = exitConference && exitConference.status === 'COMPLETED' ? 10 : 0;

    const computedProgress = Math.min(100, Math.round(evWeight + procWeight + reconsWeight + qWeight + fWeight + wpWeight + exitWeight));

    return {
      progress: computedProgress,
      evidenceCollected: verifiedEvidence,
      evidenceRequired: requiredEvidence,
      proceduresCompleted: completedProcs,
      proceduresPending: totalProcs - completedProcs,
      proceduresTotal: totalProcs,
      queriesResolved: resolvedQueries,
      queriesTotal: totalQueries,
      findings: findings.length,
      workingPapers: workingPapers.length,
      totalTaxImpact: totalTax,
      status: caseData?.status || 'IN_PROGRESS'
    };
  }, [evidenceList, procedures, queries, findings, workingPapers, reconciliations, exitConference, caseData?.status]);

  // Autosave trigger with debounce
  const triggerAutosave = useCallback(() => {
    setSaveStatus('unsaved');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const timeStr = new Date().toLocaleTimeString();
        if (caseData) {
          await itasApi.updateCase(activeCaseId, { lastSaved: timeStr });
        }
        setLastSaved(timeStr);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('unsaved');
      }
    }, 2000);
  }, [activeCaseId, caseData]);

  // Explicit Save Draft Button
  const handleSaveDraft = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    setSaveStatus('saving');
    try {
      const timeStr = new Date().toLocaleTimeString();
      if (caseData) {
        await itasApi.updateCase(activeCaseId, { lastSaved: timeStr });
      }
      await itasApi.logAuditAction(
        activeCaseId,
        caseData?.assignedAuditor || 'Jane Doe',
        'Draft Saved',
        `Comprehensive audit workspace draft manually saved at step "${COMP_STEPS[currentStepIndex]}".`
      );
      setLastSaved(timeStr);
      setSaveStatus('saved');
      const updatedTrail = await itasApi.getAuditTrail(activeCaseId);
      setAuditTrail(updatedTrail);
    } catch (err) {
      console.error('Manual save failed:', err);
      setSaveStatus('unsaved');
    }
  };

  // Step Navigation: Back & Next
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = async () => {
    await handleSaveDraft();
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps((prev) => [...prev, currentStepIndex]);
    }
    if (currentStepIndex < COMP_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Case Switcher
  const handleCaseChange = (newCaseId: string) => {
    setActiveCaseId(newCaseId);
    setCurrentStepIndex(0);
    setCompletedSteps([0]);
    if (onCaseChange) {
      onCaseChange(newCaseId);
    }
  };

  // Case Metadata Update
  const handleUpdateCase = async (updates: Partial<AuditCase>) => {
    if (!caseData) return;
    try {
      const updated = await itasApi.updateCase(activeCaseId, updates);
      setCaseData(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update case:', err);
    }
  };

  // Entry Conference Update
  const handleUpdateEntryConference = async (updates: Partial<EntryConference>) => {
    try {
      const updated = await itasApi.updateEntryConference(activeCaseId, updates);
      setEntryConference(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update entry conference:', err);
    }
  };

  // CAAT Update
  const handleUpdateCAAT = async (updates: Partial<CAATAuditData>) => {
    try {
      const updated = await itasApi.updateCAATAudit(activeCaseId, updates);
      setCaatAudit(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update CAAT data:', err);
    }
  };

  // Evidence handlers
  const handleAddEvidence = async (item: Partial<EvidenceItem>) => {
    try {
      const created = await itasApi.createEvidence(activeCaseId, item);
      setEvidenceList((prev) => [...prev, created]);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to add evidence:', err);
    }
  };

  const handleDeleteEvidence = async (id: string) => {
    try {
      await itasApi.deleteEvidence(activeCaseId, id);
      setEvidenceList((prev) => prev.filter((e) => e.id !== id));
      triggerAutosave();
    } catch (err) {
      console.error('Failed to delete evidence:', err);
    }
  };

  // Procedures handler
  const handleUpdateProcedure = async (procId: string, updates: Partial<AuditProcedure>) => {
    try {
      const updated = await itasApi.updateProcedure(activeCaseId, procId, updates);
      setProcedures((prev) => prev.map((p) => (p.id === procId ? updated : p)));
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update procedure:', err);
    }
  };

  // Reconciliations handler
  const handleUpdateReconciliations = async (updates: Partial<ComprehensiveReconciliation>) => {
    try {
      const updated = await itasApi.updateReconciliations(activeCaseId, updates);
      setReconciliations(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update reconciliations:', err);
    }
  };

  // Analysis handler
  const handleUpdateAnalysis = async (updates: Partial<TaxAnalysis>) => {
    try {
      const updated = await itasApi.updateAnalysis(activeCaseId, updates);
      setAnalysis(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update analysis:', err);
    }
  };

  // Query handlers
  const handleCreateQuery = async (q: Partial<TaxQuery>) => {
    try {
      const created = await itasApi.createQuery(activeCaseId, q);
      setQueries((prev) => [...prev, created]);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to create query:', err);
    }
  };

  const handleUpdateQuery = async (queryId: string, updates: Partial<TaxQuery>) => {
    try {
      const updated = await itasApi.updateQuery(activeCaseId, queryId, updates);
      setQueries((prev) => prev.map((q) => (q.id === queryId ? updated : q)));
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update query:', err);
    }
  };

  // Finding handlers
  const handleCreateFinding = async (f: Partial<AuditFinding>) => {
    try {
      const created = await itasApi.createFinding(activeCaseId, f);
      setFindings((prev) => [...prev, created]);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to create finding:', err);
    }
  };

  const handleUpdateFinding = async (findingId: string, updates: Partial<AuditFinding>) => {
    try {
      const updated = await itasApi.updateFinding(activeCaseId, findingId, updates);
      setFindings((prev) => prev.map((f) => (f.id === findingId ? updated : f)));
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update finding:', err);
    }
  };

  const handleDeleteFinding = async (findingId: string) => {
    try {
      await itasApi.deleteFinding(activeCaseId, findingId);
      setFindings((prev) => prev.filter((f) => f.id !== findingId));
      triggerAutosave();
    } catch (err) {
      console.error('Failed to delete finding:', err);
    }
  };

  // Working Paper handlers
  const handleCreateWorkingPaper = async (wp: Partial<WorkingPaper>) => {
    try {
      const created = await itasApi.createWorkingPaper(activeCaseId, wp);
      setWorkingPapers((prev) => [...prev, created]);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to create working paper:', err);
    }
  };

  const handleUpdateWorkingPaper = async (wpId: string, updates: Partial<WorkingPaper>) => {
    try {
      const updated = await itasApi.updateWorkingPaper(activeCaseId, wpId, updates);
      setWorkingPapers((prev) => prev.map((w) => (w.id === wpId ? updated : w)));
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update working paper:', err);
    }
  };

  // Exit conference & Notice handlers
  const handleUpdateExitConference = async (updates: Partial<ExitConference>) => {
    try {
      const updated = await itasApi.updateExitConference(activeCaseId, updates);
      setExitConference(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update exit conference:', err);
    }
  };

  const handleUpdateAssessmentNotice = async (updates: Partial<AssessmentNotice>) => {
    try {
      const updated = await itasApi.updateAssessmentNotice(activeCaseId, updates);
      setAssessmentNotice(updated);
      triggerAutosave();
    } catch (err) {
      console.error('Failed to update assessment notice:', err);
    }
  };

  // Fraud referral trigger
  const handleTriggerFraudReferral = async (reason: string) => {
    try {
      const res = await itasApi.executeWorkflow(activeCaseId, {
        action: 'TRIGGER_FRAUD_INVESTIGATION',
        comment: reason,
        user: caseData?.assignedAuditor || 'Lead Auditor'
      });
      if (res.success && caseData) {
        setCaseData({ ...caseData, status: res.status });
        const updatedTrail = await itasApi.getAuditTrail(activeCaseId);
        setAuditTrail(updatedTrail);
        alert('Case formally referred to Intelligence and Tax Fraud Investigation Directorate.');
      }
    } catch (err) {
      console.error('Failed to trigger fraud referral:', err);
    }
  };

  // Team Leader Review Submissions
  const handleSubmitForReview = async () => {
    try {
      const res = await itasApi.executeWorkflow(activeCaseId, {
        action: 'SUBMIT_FOR_REVIEW',
        user: caseData?.assignedAuditor || 'Jane Doe'
      });
      if (res.success && caseData) {
        setCaseData({ ...caseData, status: res.status });
        const updatedTrail = await itasApi.getAuditTrail(activeCaseId);
        setAuditTrail(updatedTrail);
        alert('Comprehensive audit file successfully submitted to Team Leader for sign-off.');
      }
    } catch (err) {
      console.error('Failed to submit for review:', err);
    }
  };

  if (isLoading || !caseData) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-indigo-700 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">
          Loading ITAS Comprehensive Tax Audit Workspace...
        </p>
        <span className="text-xs text-gray-500 font-mono mt-1">
          Case {activeCaseId} · Retrieving Substantive Modules & Reconciliations
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col font-sans">
      {/* 1. Audit Header */}
      <AuditHeader
        caseData={caseData}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        progressPct={auditStats.progress}
        onSwitchCase={() => setIsCaseSwitcherOpen(true)}
        onManualSave={triggerAutosave}
      />

      {/* 2. Horizontal Stepper */}
      <HorizontalStepper
        steps={COMP_STEPS}
        currentIndex={currentStepIndex}
        completedIndices={completedSteps}
        onSelectStep={handleSelectStep}
      />

      {/* 3. Main Workspace Step Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Supervisory Workflow Status & Feedback Banner */}
        {caseData.status === 'RETURNED_FOR_CORRECTION' && (
          <div className="mb-6 bg-rose-50 border-2 border-rose-300 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 font-mono">
                      Supervisory Action Required
                    </span>
                    <span className="text-2xs bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded">
                      RETURNED FOR CORRECTION
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-rose-950 mt-1">
                    Audit Case Returned by Team Leader / Directorate
                  </h3>
                  <div className="mt-2 p-3 bg-white/80 rounded-lg border border-rose-200 text-xs text-rose-900">
                    <span className="font-bold block mb-0.5">Specific Correction Instructions:</span>
                    <p className="italic font-medium leading-relaxed">
                      "{caseData.teamLeaderComment || caseData.directorComment || 'Please adjust substantive procedure conclusion and clarify transfer pricing calculations.'}"
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs text-rose-800">
                    <span className="font-semibold">Quick Jump:</span>
                    <button
                      onClick={() => handleSelectStep(6)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 rounded border border-rose-300 font-bold transition-colors"
                    >
                      Step 7: Findings
                    </button>
                    <button
                      onClick={() => handleSelectStep(3)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 rounded border border-rose-300 font-bold transition-colors"
                    >
                      Step 4: Procedures
                    </button>
                    <button
                      onClick={() => handleSelectStep(4)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 rounded border border-rose-300 font-bold transition-colors"
                    >
                      Step 5: Reconciliations
                    </button>
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-center shrink-0">
                <button
                  onClick={handleSubmitForReview}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Re-Submit to Team Leader</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {caseData.status === 'SUBMITTED' && (
          <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block text-amber-950 font-bold">
                  Audit File Submitted for Supervisory Technical Review
                </strong>
                <span>
                  Case is currently pending review and sign-off by Team Leader <strong>{caseData.teamLeader}</strong>.
                </span>
              </div>
            </div>
            <span className="text-2xs font-mono font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full whitespace-nowrap">
              UNDER SUPERVISORY REVIEW
            </span>
          </div>
        )}

        {caseData.status === 'PENDING_DIRECTOR_APPROVAL' && (
          <div className="mb-6 bg-purple-50 border border-purple-300 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-purple-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <strong className="block text-purple-950 font-bold">
                  Escalated for Executive Director Statutory Endorsement
                </strong>
                <span>
                  Team Leader {caseData.teamLeader} endorsed the findings; currently under executive review by <strong>Director Marcus Vance</strong>.
                </span>
              </div>
            </div>
            <span className="text-2xs font-mono font-bold bg-purple-200 text-purple-950 px-2.5 py-1 rounded-full whitespace-nowrap">
              PENDING DIRECTOR SIGN-OFF
            </span>
          </div>
        )}

        {caseData.status === 'APPROVED' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-emerald-950 font-bold">
                  Comprehensive Audit Officially Approved
                </strong>
                <span>
                  Audit determinations and findings finalized. Formal Notice of Assessment authorized for issuance.
                </span>
              </div>
            </div>
            <span className="text-2xs font-mono font-bold bg-emerald-200 text-emerald-950 px-2.5 py-1 rounded-full whitespace-nowrap">
              FINAL STATUTORY APPROVAL
            </span>
          </div>
        )}

        {caseData.status === 'REFERRED_TO_FRAUD_INVESTIGATION' && (
          <div className="mb-6 bg-rose-950 text-white rounded-xl p-4 flex items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-3">
              <BadgeAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-rose-200 font-bold">
                  Referred to Intelligence & Tax Fraud Investigation Directorate
                </strong>
                <span className="text-slate-300">
                  Case docket transferred under Tax Penal Code for criminal evasion prosecution.
                </span>
              </div>
            </div>
            <span className="text-2xs font-mono font-bold bg-rose-800 text-white px-2.5 py-1 rounded-full whitespace-nowrap">
              CRIMINAL FRAUD DOCKET
            </span>
          </div>
        )}

        {/* STEP 0: OVERVIEW */}
        {currentStepIndex === 0 && (
          <StepCompOverview
            caseData={caseData}
            stats={auditStats}
            multiZoneAllocations={multiZoneAllocations}
            onNavigateToStep={handleSelectStep}
            onUpdateCase={handleUpdateCase}
          />
        )}

        {/* STEP 1: ENTRY CONFERENCE */}
        {currentStepIndex === 1 && entryConference && (
          <StepEntryConference
            entryConference={entryConference}
            onUpdateEntryConference={handleUpdateEntryConference}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 2: CAAT & EVIDENCE */}
        {currentStepIndex === 2 && caatAudit && (
          <StepCAATEvidence
            caatAudit={caatAudit}
            evidenceList={evidenceList}
            procedures={procedures}
            onUpdateCAATAudit={handleUpdateCAAT}
            onAddEvidence={handleAddEvidence}
            onDeleteEvidence={handleDeleteEvidence}
            onTriggerAutosave={triggerAutosave}
            onCreateFinding={handleCreateFinding}
            onCreateQuery={handleCreateQuery}
            onNavigateToStep={handleSelectStep}
          />
        )}

        {/* STEP 3: SUBSTANTIVE AUDIT PROCEDURES */}
        {currentStepIndex === 3 && (
          <StepCompProcedures
            procedures={procedures}
            evidenceList={evidenceList}
            balanceSheetItems={balanceSheetItems}
            onUpdateProcedure={handleUpdateProcedure}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 4: 3-WAY RECONCILIATIONS & ANALYSIS */}
        {currentStepIndex === 4 && reconciliations && analysis && (
          <StepCompReconciliations
            reconciliations={reconciliations}
            analysis={analysis}
            onUpdateReconciliations={handleUpdateReconciliations}
            onUpdateAnalysis={handleUpdateAnalysis}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 5: QUERIES */}
        {currentStepIndex === 5 && (
          <StepQueries
            queries={queries}
            evidenceList={evidenceList}
            onCreateQuery={handleCreateQuery}
            onUpdateQuery={handleUpdateQuery}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 6: FINDINGS */}
        {currentStepIndex === 6 && (
          <StepFindings
            findings={findings}
            procedures={procedures}
            evidenceList={evidenceList}
            queries={queries}
            workingPapers={workingPapers}
            onCreateFinding={handleCreateFinding}
            onUpdateFinding={handleUpdateFinding}
            onDeleteFinding={handleDeleteFinding}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 7: WORKING PAPERS */}
        {currentStepIndex === 7 && (
          <StepWorkingPapers
            workingPapers={workingPapers}
            procedures={procedures}
            findings={findings}
            evidenceList={evidenceList}
            onCreateWorkingPaper={handleCreateWorkingPaper}
            onUpdateWorkingPaper={handleUpdateWorkingPaper}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 8: EXIT CONFERENCE & ASSESSMENT NOTICE */}
        {currentStepIndex === 8 && exitConference && assessmentNotice && (
          <StepExitConferenceAssessment
            exitConference={exitConference}
            assessmentNotice={assessmentNotice}
            findings={findings}
            caseData={caseData}
            onUpdateExitConference={handleUpdateExitConference}
            onUpdateAssessmentNotice={handleUpdateAssessmentNotice}
            onTriggerFraudReferral={handleTriggerFraudReferral}
            onTriggerAutosave={triggerAutosave}
          />
        )}

        {/* STEP 9: REVIEW & SUBMIT */}
        {currentStepIndex === 9 && (
          <StepCompReviewSubmit
            caseData={caseData}
            procedures={procedures}
            evidenceList={evidenceList}
            queries={queries}
            findings={findings}
            workingPapers={workingPapers}
            entryConference={entryConference || undefined}
            caatAudit={caatAudit || undefined}
            reconciliations={reconciliations || undefined}
            exitConference={exitConference || undefined}
            assessmentNotice={assessmentNotice || undefined}
            onNavigateToStep={handleSelectStep}
            onSubmitForReview={handleSubmitForReview}
          />
        )}
      </main>

      {/* 4. Bottom Sticky Navigation Controls */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Center Info: Save Status & Step Counter */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="text-gray-500 font-medium">
              Step <strong className="text-gray-900">{currentStepIndex + 1}</strong> of{' '}
              <strong className="text-gray-900">{COMP_STEPS.length}</strong>:{' '}
              <span className="text-indigo-700 font-semibold">{COMP_STEPS[currentStepIndex]}</span>
            </span>

            <span className="text-gray-300">|</span>

            <span className="text-gray-500 font-mono text-2xs">
              Autosave: {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : `Saved at ${lastSaved}`}
            </span>
          </div>

          {/* Right Buttons: Save Draft & Save & Next */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-2xs transition-colors"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : (
                <Save className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span>Save Draft</span>
            </button>

            {currentStepIndex < COMP_STEPS.length - 1 ? (
              <button
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs transition-colors"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitForReview}
                disabled={caseData.status === 'SUBMITTED' || caseData.status === 'APPROVED'}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-xs transition-colors"
              >
                <span>
                  {caseData.status === 'SUBMITTED'
                    ? 'Submitted'
                    : caseData.status === 'APPROVED'
                    ? 'Approved'
                    : 'Submit for Review'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Case Switcher Modal */}
      <CaseSwitcherModal
        isOpen={isCaseSwitcherOpen}
        onClose={() => setIsCaseSwitcherOpen(false)}
        activeCaseId={activeCaseId}
        onSelectCase={handleCaseChange}
      />

      {/* Audit Trail Drawer */}
      <AuditTrailDrawer
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
        entries={auditTrail}
        caseId={activeCaseId}
      />
    </div>
  );
};

export default ComprehensiveAuditWorkspace;
