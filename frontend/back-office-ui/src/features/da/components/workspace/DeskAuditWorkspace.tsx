import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  AlertCircle
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
  AuditStats
} from '../../types/audit';
import { itasApi } from '../../services/api';
import { AuditHeader } from './AuditHeader';
import { HorizontalStepper } from './HorizontalStepper';
import { StepOverview } from './StepOverview';
import { StepEvidence } from './StepEvidence';
import { StepProcedures } from './StepProcedures';
import { StepAnalysis } from './StepAnalysis';
import { StepQueries } from './StepQueries';
import { StepFindings } from './StepFindings';
import { StepWorkingPapers } from './StepWorkingPapers';
import { StepDraftReport } from './StepDraftReport';
import { StepReviewSubmit } from './StepReviewSubmit';
import { TeamLeaderActionModal } from './TeamLeaderActionModal';
import { EscalationModal } from './EscalationModal';
import { AuditTrailDrawer } from './AuditTrailDrawer';
import { CaseSwitcherModal } from './CaseSwitcherModal';

export const STEPS = [
  'Overview',
  'Evidence',
  'Audit Procedures',
  'Analysis',
  'Queries',
  'Findings',
  'Working Papers',
  'Draft Report',
  'Review & Submit'
];

interface DeskAuditWorkspaceProps {
  caseId?: string;
  initialCaseInfo?: any;
  onCaseChange?: (newCaseId: string) => void;
}

export const DeskAuditWorkspace: React.FC<DeskAuditWorkspaceProps> = ({
  caseId = 'DA-2026-001',
  initialCaseInfo,
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

  // Dialogs & Modals
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [isTeamLeaderModalOpen, setIsTeamLeaderModalOpen] = useState(false);
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [isCaseSwitcherOpen, setIsCaseSwitcherOpen] = useState(false);

  // Autosave timer ref
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load case data when activeCaseId changes
  const loadCase = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await itasApi.getCaseData(id, initialCaseInfo);
      setCaseData(data.auditCase);
      setEvidenceList(data.evidence || []);
      setProcedures(data.procedures || []);
      setAnalysis(data.analysis);
      setQueries(data.queries || []);
      setFindings(data.findings || []);
      setWorkingPapers(data.workingPapers || []);
      setDraftReport(data.draftReport);
      setAuditTrail(data.auditTrail);
      setLastSaved(data.auditCase.lastSaved || new Date().toLocaleTimeString());
      setSaveStatus('saved');
      if (data.auditCase.id && data.auditCase.id !== activeCaseId) {
        setActiveCaseId(data.auditCase.id);
      }
    } catch (err) {
      console.error('Failed to load ITAS case data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveCaseId(caseId);
  }, [caseId]);

  useEffect(() => {
    loadCase(activeCaseId);
    
    // Load saved step
    const savedStep = localStorage.getItem(`ITAS_WORKSPACE_STEP_${activeCaseId}`);
    if (savedStep) {
      setCurrentStepIndex(parseInt(savedStep, 10));
    } else {
      setCurrentStepIndex(0);
    }
  }, [activeCaseId, loadCase]);

  // Save current step whenever it changes
  useEffect(() => {
    if (activeCaseId) {
      localStorage.setItem(`ITAS_WORKSPACE_STEP_${activeCaseId}`, currentStepIndex.toString());
    }
  }, [currentStepIndex, activeCaseId]);

  // Real Audit Progress & Counts Calculation (from actual persisted entity states)
  const stats: AuditStats = useMemo(() => {
    const procTotal = procedures.length || 8;
    const procDone = procedures.filter((p) => p.status === 'COMPLETED').length;
    const procPending = procTotal - procDone;

    const evVerified = evidenceList.filter((e) => e.status === 'Verified').length;
    const evReq = 5;

    const qTotal = queries?.length || 0;
    const qResolved = (queries || []).filter((q) => q.status === 'RESOLVED').length;

    const fCount = findings?.length || 0;
    const wpCount = workingPapers?.length || 0;

    const totalTaxExposure = (findings || []).reduce((sum, f) => sum + (Number(f.totalTaxImpact) || 0), 0);

    // Weighted mathematical progress calculation:
    // Procedures: 35%, Evidence: 20%, Queries: 15%, Findings & WP: 15%, Draft Report: 15%
    const procWeight = procTotal > 0 ? (procDone / procTotal) * 35 : 0;
    const evWeight = Math.min(evVerified / evReq, 1) * 20;
    const qWeight = qTotal > 0 ? (qResolved / qTotal) * 15 : 15;
    const wpWeight = Math.min(wpCount / 4, 1) * 15;
    const repWeight = draftReport?.executiveSummary ? 15 : 0;

    const calculatedPct = Math.round(procWeight + evWeight + qWeight + wpWeight + repWeight);

    return {
      progress: Math.min(calculatedPct, 100),
      evidenceCollected: evVerified,
      evidenceRequired: evReq,
      proceduresCompleted: procDone,
      proceduresPending: procPending,
      proceduresTotal: procTotal,
      queriesResolved: qResolved,
      queriesTotal: qTotal,
      findings: fCount,
      workingPapers: wpCount,
      totalTaxImpact: totalTaxExposure,
      status: caseData?.status || 'IN_PROGRESS'
    };
  }, [procedures, evidenceList, queries, findings, workingPapers, draftReport, caseData?.status]);

  // Real backend autosave trigger
  const triggerAutosave = useCallback(() => {
    setSaveStatus('unsaved');
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const result = await itasApi.autosaveCase(activeCaseId, {
          procedures,
          evidence: evidenceList,
          queries,
          findings,
          workingPapers,
          draftReport: draftReport || undefined,
          analysis: analysis || undefined
        });
        setSaveStatus('saved');
        setLastSaved(result.lastSaved);
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('unsaved');
      }
    }, 1200);
  }, [activeCaseId, procedures, evidenceList, queries, findings, workingPapers, draftReport, analysis]);

  // Manual Save Draft Handler
  const handleSaveDraft = async () => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    setSaveStatus('saving');
    try {
      const result = await itasApi.autosaveCase(activeCaseId, {
        procedures,
        evidence: evidenceList,
        queries,
        findings,
        workingPapers,
        draftReport: draftReport || undefined,
        analysis: analysis || undefined
      });
      setSaveStatus('saved');
      setLastSaved(result.lastSaved);
    } catch (err) {
      console.error('Manual save failed:', err);
      setSaveStatus('unsaved');
    }
  };

  // Next Step with Validation & Auto-Persist
  const handleNext = async () => {
    // Save draft first
    await handleSaveDraft();

    // Mark current step as completed in list
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps((prev) => [...prev, currentStepIndex]);
    }

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Back Step (Preserves saved data, never silently discards)
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step Select from Horizontal Stepper
  const handleSelectStep = (index: number) => {
    handleSaveDraft();
    setCurrentStepIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Evidence Operations
  const handleAddEvidence = async (item: Partial<EvidenceItem>) => {
    const created = await itasApi.addEvidence(activeCaseId, item);
    setEvidenceList((prev) => [...prev, created]);
    triggerAutosave();
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    await itasApi.deleteEvidence(activeCaseId, evidenceId);
    setEvidenceList((prev) => prev.filter((e) => e.id !== evidenceId));
    triggerAutosave();
  };

  // Procedure Operations
  const handleUpdateProcedure = async (procId: string, updates: Partial<AuditProcedure>) => {
    const updated = await itasApi.updateProcedure(activeCaseId, procId, updates);
    setProcedures((prev) => prev.map((p) => (p.id === procId ? updated : p)));
    triggerAutosave();
  };

  // Analysis Operations
  const handleUpdateAnalysis = async (updates: Partial<TaxAnalysis>) => {
    const updated = await itasApi.updateAnalysis(activeCaseId, updates);
    setAnalysis(updated);
    triggerAutosave();
  };

  // Query Operations
  const handleCreateQuery = async (query: Partial<TaxQuery>) => {
    const created = await itasApi.createQuery(activeCaseId, query);
    setQueries((prev) => [...prev, created]);
    triggerAutosave();
  };

  const handleUpdateQuery = async (queryId: string, updates: Partial<TaxQuery>) => {
    const updated = await itasApi.updateQuery(activeCaseId, queryId, updates);
    setQueries((prev) => prev.map((q) => (q.id === queryId ? updated : q)));
    triggerAutosave();
  };

  // Finding Operations
  const handleCreateFinding = async (finding: Partial<AuditFinding>) => {
    const created = await itasApi.createFinding(activeCaseId, finding);
    setFindings((prev) => [...prev, created]);
    triggerAutosave();
  };

  const handleUpdateFinding = async (findingId: string, updates: Partial<AuditFinding>) => {
    const updated = await itasApi.updateFinding(activeCaseId, findingId, updates);
    setFindings((prev) => prev.map((f) => (f.id === findingId ? updated : f)));
    triggerAutosave();
  };

  const handleDeleteFinding = async (findingId: string) => {
    await itasApi.deleteFinding(activeCaseId, findingId);
    setFindings((prev) => prev.filter((f) => f.id !== findingId));
    triggerAutosave();
  };

  // Working Paper Operations
  const handleCreateWorkingPaper = async (wp: Partial<WorkingPaper>) => {
    const created = await itasApi.createWorkingPaper(activeCaseId, wp);
    setWorkingPapers((prev) => [...prev, created]);
    triggerAutosave();
  };

  const handleUpdateWorkingPaper = async (wpId: string, updates: Partial<WorkingPaper>) => {
    const updated = await itasApi.updateWorkingPaper(activeCaseId, wpId, updates);
    setWorkingPapers((prev) => prev.map((w) => (w.id === wpId ? updated : w)));
    triggerAutosave();
  };

  // Draft Report Operations
  const handleUpdateReport = async (report: Partial<DraftReport>) => {
    const updated = await itasApi.updateReport(activeCaseId, report);
    setDraftReport(updated);
    triggerAutosave();
  };

  // Workflow: Submit for Review
  const handleSubmitForReview = async () => {
    const res = await itasApi.executeWorkflow(activeCaseId, {
      action: 'SUBMIT_FOR_REVIEW',
      user: caseData?.assignedAuditor || 'Auditor Jane Doe'
    });
    setCaseData(res.auditCase);
    const trail = await itasApi.getAuditTrail(activeCaseId);
    setAuditTrail(trail);
  };

  // Team Leader Review Execution (Approve or Return)
  const handleTeamLeaderReview = async (
    action: 'APPROVE_AUDIT' | 'RETURN_FOR_CORRECTION',
    comment: string
  ) => {
    const res = await itasApi.executeWorkflow(activeCaseId, {
      action,
      comment,
      user: caseData?.teamLeader || 'Team Leader John Smith'
    });
    setCaseData(res.auditCase);
    const trail = await itasApi.getAuditTrail(activeCaseId);
    setAuditTrail(trail);
  };

  // Escalation: Desk to Comprehensive
  const handleConfirmEscalation = async (escalationDetails: {
    reason: string;
    extendedScope: string;
    estimatedTaxExposure: number;
  }) => {
    const res = await itasApi.executeWorkflow(activeCaseId, {
      action: 'ESCALATE_COMPREHENSIVE',
      escalationDetails,
      user: caseData?.assignedAuditor || 'Auditor'
    });
    setCaseData(res.auditCase);
    const trail = await itasApi.getAuditTrail(activeCaseId);
    setAuditTrail(trail);
  };

  const handleCaseSelect = (newId: string) => {
    setActiveCaseId(newId);
    if (onCaseChange) onCaseChange(newId);
    setCurrentStepIndex(0);
  };

  if (isLoading || !caseData || !analysis || !draftReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">
            Initializing ITAS Desk Audit Workspace for {activeCaseId}...
          </p>
          <p className="text-xs text-gray-400">Loading statutory cases, evidence, and procedures</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ENTERPRISE STICKY AUDIT HEADER */}
      <AuditHeader
        caseData={caseData}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        progressPct={stats.progress}
        onOpenAuditTrail={() => setIsAuditTrailOpen(true)}
        onOpenEscalation={() => setIsEscalationModalOpen(true)}
        onOpenTeamLeaderReview={() => setIsTeamLeaderModalOpen(true)}
        onSwitchCase={() => setIsCaseSwitcherOpen(true)}
      />

      {/* HORIZONTAL WIZARD STEPPER */}
      <HorizontalStepper
        steps={STEPS}
        currentIndex={currentStepIndex}
        completedIndices={completedSteps}
        onSelectStep={handleSelectStep}
      />

      {/* WORKSPACE CONTENT AREA */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Team Leader Feedback Banners */}
        {caseData?.status === 'SUBMITTED' && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded flex items-start gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <div>
              <span className="font-bold text-sm block">Case Locked - Read Only</span>
              <span className="text-xs">This audit has been submitted for Team Leader review and is currently locked. You can navigate through the tabs to view the records, but no modifications can be made.</span>
            </div>
          </div>
        )}

        {caseData?.status === 'APPROVED' && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded flex items-start gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
              <span className="font-bold text-sm block">Case Approved by Team Leader</span>
              <span className="text-xs">The Team Leader has approved your audit findings and report. No further modifications can be made.</span>
              {caseData?.teamLeaderComment && (
                <div className="mt-2 p-2 bg-emerald-100/50 rounded border border-emerald-100 text-sm">
                  <span className="font-semibold block">Team Leader Comment:</span>
                  {caseData.teamLeaderComment}
                </div>
              )}
            </div>
          </div>
        )}

        {caseData?.status === 'IN_PROGRESS' && caseData?.teamLeaderComment && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded flex items-start gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            <div>
              <span className="font-bold text-sm block">Returned for Correction</span>
              <span className="text-xs">The Team Leader has returned this case. Please review the feedback and update the case accordingly.</span>
              <div className="mt-2 p-2 bg-white rounded border border-rose-100 text-sm">
                <span className="font-semibold block text-rose-800">Team Leader Feedback:</span>
                {caseData.teamLeaderComment}
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white border border-gray-200 rounded shadow-2xs min-h-[560px] flex flex-col ${caseData?.status === 'SUBMITTED' || caseData?.status === 'APPROVED' ? 'pointer-events-none opacity-90' : ''}`}>
          {/* Step Title Header */}
          <div className="border-b border-gray-200 px-6 sm:px-8 py-4 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 uppercase bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-tight">
                {STEPS[currentStepIndex]}
              </h2>
            </div>

            <div className="text-xs text-gray-500 font-mono hidden sm:block">
              Case: {caseData.id} · Ref: {caseData.caseNumber}
            </div>
          </div>

          {/* Dynamic Step Component */}
          <div className="flex-1 p-6 sm:p-8">
            {currentStepIndex === 0 && (
              <StepOverview
                caseData={caseData}
                stats={stats}
                onNavigateToStep={handleSelectStep}
              />
            )}

            {currentStepIndex === 1 && (
              <StepEvidence
                evidence={evidenceList}
                procedures={procedures}
                findings={findings}
                onAddEvidence={handleAddEvidence}
                onDeleteEvidence={handleDeleteEvidence}
              />
            )}

            {currentStepIndex === 2 && (
              <StepProcedures
                procedures={procedures}
                evidenceList={evidenceList}
                onUpdateProcedure={handleUpdateProcedure}
                onTriggerAutosave={triggerAutosave}
              />
            )}

            {currentStepIndex === 3 && (
              <StepAnalysis
                analysis={analysis}
                onUpdateAnalysis={handleUpdateAnalysis}
                onTriggerAutosave={triggerAutosave}
              />
            )}

            {currentStepIndex === 4 && (
              <StepQueries
                queries={queries}
                evidenceList={evidenceList}
                onCreateQuery={handleCreateQuery}
                onUpdateQuery={handleUpdateQuery}
                onTriggerAutosave={triggerAutosave}
              />
            )}

            {currentStepIndex === 5 && (
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

            {currentStepIndex === 6 && (
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

            {currentStepIndex === 7 && (
              <StepDraftReport
                draftReport={draftReport}
                caseData={caseData}
                procedures={procedures}
                evidenceList={evidenceList}
                findings={findings}
                workingPapers={workingPapers}
                queries={queries}
                onUpdateReport={handleUpdateReport}
                onTriggerAutosave={triggerAutosave}
              />
            )}

            {currentStepIndex === 8 && (
              <StepReviewSubmit
                caseData={caseData}
                procedures={procedures}
                evidenceList={evidenceList}
                queries={queries}
                findings={findings}
                workingPapers={workingPapers}
                draftReport={draftReport}
                onNavigateToStep={handleSelectStep}
                onSubmitForReview={handleSubmitForReview}
                onOpenTeamLeaderReview={() => setIsTeamLeaderModalOpen(true)}
                onOpenEscalation={() => setIsEscalationModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-5 flex items-center justify-between bg-white border border-gray-200 rounded p-4 shadow-2xs">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className={`px-5 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              currentStepIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saveStatus === 'saving'}
              className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-semibold text-xs uppercase tracking-wider rounded shadow-2xs hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4 text-gray-500" />
              <span>Save Draft</span>
            </button>

            {currentStepIndex < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs uppercase tracking-wider rounded shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitForReview}
                disabled={
                  stats.proceduresPending > 0 ||
                  stats.evidenceCollected < 3 ||
                  caseData.status === 'SUBMITTED' ||
                  caseData.status === 'APPROVED'
                }
                className={`px-6 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors ${
                  stats.proceduresPending === 0 &&
                  stats.evidenceCollected >= 3 &&
                  caseData.status !== 'SUBMITTED' &&
                  caseData.status !== 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {caseData.status === 'SUBMITTED'
                    ? 'Submitted for Review'
                    : caseData.status === 'APPROVED'
                    ? 'Audit Endorsed'
                    : 'Submit for Review'}
                </span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Global Modals */}
      <AuditTrailDrawer
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
        entries={auditTrail}
        caseId={activeCaseId}
      />

      <TeamLeaderActionModal
        isOpen={isTeamLeaderModalOpen}
        onClose={() => setIsTeamLeaderModalOpen(false)}
        caseData={caseData}
        onExecuteAction={handleTeamLeaderReview}
      />

      <EscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        caseData={caseData}
        totalTaxImpact={stats.totalTaxImpact}
        onConfirmEscalation={handleConfirmEscalation}
      />

      <CaseSwitcherModal
        isOpen={isCaseSwitcherOpen}
        onClose={() => setIsCaseSwitcherOpen(false)}
        activeCaseId={activeCaseId}
        onSelectCase={handleCaseSelect}
      />
    </div>
  );
};

export default DeskAuditWorkspace;
