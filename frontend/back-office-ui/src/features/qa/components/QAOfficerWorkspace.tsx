import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scale,
  Building2,
  Calendar,
  Hash,
  User,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  Send,
  FolderSync,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Layers,
  Award,
  AlertOctagon,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  History,
  Calculator,
  RotateCcw
} from 'lucide-react';
import {
  QACaseReview,
  QADimensionScore,
  QADeficiencyItem,
  QAReport,
  AuthUser,
  AuditTrailEntry
} from '../types/audit';
import { itasApi } from '../services/api';
import { QACaseSwitcherModal } from './QACaseSwitcherModal';
import { QAInformationProgressTracker } from './QAInformationProgressTracker';
import { AuditTrailDrawer } from '../../da/components/workspace/AuditTrailDrawer';

interface QAOfficerWorkspaceProps {
  currentUser: AuthUser;
  caseId?: string;
  onSelectAuditCase?: (caseId: string) => void;
  activeTab?: 'DIMENSIONS' | 'DEFICIENCIES' | 'AUDIT_CONTEXT' | 'WORKING_PAPERS' | 'COMMUNICATION' | 'REPORT';
  onTabChange?: (tab: string) => void;
}

export const QAOfficerWorkspace: React.FC<QAOfficerWorkspaceProps> = ({
  currentUser,
  caseId = 'QA-2026-001',
  onSelectAuditCase,
  activeTab: propActiveTab,
  onTabChange: propOnTabChange
}) => {
  const [activeQAId, setActiveQAId] = useState<string>(caseId);
  const [reviewData, setReviewData] = useState<QACaseReview | null>(null);
  const [underlyingCase, setUnderlyingCase] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localActiveTab, setLocalActiveTab] = useState<
    'DIMENSIONS' | 'DEFICIENCIES' | 'AUDIT_CONTEXT' | 'WORKING_PAPERS' | 'COMMUNICATION' | 'REPORT'
  >('DIMENSIONS');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = (tab: any) => {
    setLocalActiveTab(tab);
    if (propOnTabChange) propOnTabChange(tab);
  };
  const [selectedDimensionId, setSelectedDimensionId] = useState<string>('DIM-01');

  // Modals & Save
  const [isCaseSwitcherOpen, setIsCaseSwitcherOpen] = useState<boolean>(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);
  const [isAddDeficiencyOpen, setIsAddDeficiencyOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // New Deficiency Form State
  const [newDefTitle, setNewDefTitle] = useState('');
  const [newDefSeverity, setNewDefSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MODERATE' | 'OBSERVATION'>('MAJOR');
  const [newDefDesc, setNewDefDesc] = useState('');
  const [newDefBreach, setNewDefBreach] = useState('');
  const [newDefMandate, setNewDefMandate] = useState('');

  // QA Working Paper & Sample Calculator State
  const [populationSize, setPopulationSize] = useState<number>(4500);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [tolerableError, setTolerableError] = useState<number>(5);
  const [recalcBaseSales, setRecalcBaseSales] = useState<number>(1820000);
  const [recalcVatRate, setRecalcVatRate] = useState<number>(18);
  const [recalcPenaltyRate, setRecalcPenaltyRate] = useState<number>(20);
  const [qaInspectorNotes, setQaInspectorNotes] = useState<string>(
    'Conducted independent recalculation of undisclosed sales turnover using TIMS/e-VAT API logs. Sample size verified against ITAS standard sampling tables.'
  );

  // Load Review & Underlying Case Data
  const loadReview = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await itasApi.getQACase(id);
      setReviewData(data);
      if (data.dimensions && data.dimensions.length > 0) {
        setSelectedDimensionId(data.dimensions[0].id);
      }
      if (data.auditCaseId) {
        try {
          const caseDetails = await itasApi.getFullCase(data.auditCaseId);
          setUnderlyingCase(caseDetails);
        } catch {
          // ignore underlying case load failure
        }
      }
    } catch (err) {
      console.error('Failed to load QA Review:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReview(activeQAId);
  }, [activeQAId, loadReview]);

  // Selected dimension details
  const activeDimension = useMemo(() => {
    return reviewData?.dimensions.find((d) => d.id === selectedDimensionId) || reviewData?.dimensions[0];
  }, [reviewData, selectedDimensionId]);

  // Toggle checkpoint
  const handleToggleCheckpoint = async (checkpointId: string) => {
    if (!reviewData || !activeDimension) return;

    setSaveStatus('saving');
    const updatedCheckpoints = activeDimension.checkpoints.map((cp) =>
      cp.id === checkpointId ? { ...cp, isSatisfied: !cp.isSatisfied } : cp
    );

    const totalCps = updatedCheckpoints.length;
    const satisfiedCount = updatedCheckpoints.filter((cp) => cp.isSatisfied).length;
    const computedScore = totalCps > 0 ? Math.round((satisfiedCount / totalCps) * 100) : activeDimension.score;

    const newStatus =
      computedScore >= 85
        ? 'COMPLIANT'
        : computedScore >= 70
        ? 'MINOR_DEFICIENCY'
        : computedScore >= 50
        ? 'MATERIAL_DEFICIENCY'
        : 'CRITICAL_FAILURE';

    try {
      const result = await itasApi.updateQADimension(reviewData.id, activeDimension.id, {
        checkpoints: updatedCheckpoints,
        score: computedScore,
        status: newStatus
      });

      setReviewData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          overallScore: result.overallScore,
          rating: result.rating as any,
          lastSaved: new Date().toLocaleTimeString(),
          dimensions: prev.dimensions.map((d) =>
            d.id === activeDimension.id
              ? { ...d, checkpoints: updatedCheckpoints, score: computedScore, status: newStatus }
              : d
          )
        };
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to update checkpoint:', err);
      setSaveStatus('unsaved');
    }
  };

  // Update dimension reviewer notes
  const handleUpdateNotes = async (notes: string) => {
    if (!reviewData || !activeDimension) return;
    try {
      await itasApi.updateQADimension(reviewData.id, activeDimension.id, { reviewerNotes: notes });
      setReviewData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          dimensions: prev.dimensions.map((d) =>
            d.id === activeDimension.id ? { ...d, reviewerNotes: notes } : d
          )
        };
      });
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  // Add deficiency
  const handleAddDeficiency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewData || !newDefTitle || !newDefDesc) return;

    try {
      const created = await itasApi.createQADeficiency(reviewData.id, {
        dimensionId: activeDimension?.id || 'DIM-01',
        dimensionTitle: activeDimension?.title || 'General Compliance',
        severity: newDefSeverity,
        title: newDefTitle,
        findingDescription: newDefDesc,
        statutoryBreach: newDefBreach || 'SOR FR-04.5 Standards',
        correctiveActionMandate: newDefMandate
      });

      setReviewData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          deficiencies: [...prev.deficiencies, created],
          lastSaved: new Date().toLocaleTimeString()
        };
      });

      setNewDefTitle('');
      setNewDefDesc('');
      setNewDefBreach('');
      setNewDefMandate('');
      setIsAddDeficiencyOpen(false);
    } catch (err) {
      console.error('Failed to create deficiency:', err);
    }
  };

  // Delete deficiency
  const handleDeleteDeficiency = async (defId: string) => {
    if (!reviewData) return;
    try {
      await itasApi.deleteQADeficiency(reviewData.id, defId);
      setReviewData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          deficiencies: prev.deficiencies.filter((d) => d.id !== defId)
        };
      });
    } catch (err) {
      console.error('Failed to delete deficiency:', err);
    }
  };

  // Manual Save Trigger
  const handleManualSave = async () => {
    if (!reviewData) return;
    setSaveStatus('saving');
    try {
      await itasApi.updateQACase(reviewData.id, {
        overallScore: reviewData.overallScore,
        rating: reviewData.rating
      });
      setReviewData((prev) => (prev ? { ...prev, lastSaved: new Date().toLocaleTimeString() } : null));
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save QA Review:', err);
      setSaveStatus('unsaved');
    }
  };

  // Submit to QA Team Leader
  const handleSubmitToTL = async () => {
    if (!reviewData) return;
    if (reviewData.overallScore === 0) {
      alert('Please complete dimensional quality scoring before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await itasApi.executeQAWorkflow(reviewData.id, {
        action: 'SUBMIT_TO_TL',
        comment: `QA Review completed with weighted quality score of ${reviewData.overallScore}% (${reviewData.rating}). ${reviewData.deficiencies.length} itemized deficiencies documented.`
      });

      if (res.success && reviewData) {
        setReviewData({ ...reviewData, status: 'PENDING_TL_REVIEW', lastSaved: new Date().toLocaleTimeString() });
        alert('Quality Assurance review file successfully submitted to QA Team Leader for technical endorsement.');
      } else {
        alert(res.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Failed to submit review to TL:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistically defensible sample size formula
  const calculatedSampleSize = useMemo(() => {
    const N = populationSize;
    const z = confidenceLevel === 99 ? 2.576 : confidenceLevel === 95 ? 1.96 : 1.645;
    const e = tolerableError / 100;
    const p = 0.5; // maximum variability
    const numerator = N * Math.pow(z, 2) * p * (1 - p);
    const denominator = Math.pow(e, 2) * (N - 1) + Math.pow(z, 2) * p * (1 - p);
    return Math.min(N, Math.round(numerator / denominator));
  }, [populationSize, confidenceLevel, tolerableError]);

  // Recalculated tax computation
  const recalcTax = useMemo(() => {
    const principal = Math.round(recalcBaseSales * (recalcVatRate / 100));
    const penalty = Math.round(principal * (recalcPenaltyRate / 100));
    const interest = Math.round(principal * 0.08); // Central bank + 2%
    return {
      principal,
      penalty,
      interest,
      total: principal + penalty + interest
    };
  }, [recalcBaseSales, recalcVatRate, recalcPenaltyRate]);

  if (isLoading || !reviewData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-indigo-700 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-800">
          Loading ITAS Audit Quality Assurance Inspection Workspace...
        </p>
        <span className="text-xs text-slate-500 font-mono mt-1">
          Review File {activeQAId} · Initializing ISO 19011 Compliance Matrix
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. QA File Header Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Case identity */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="inline-flex items-center gap-1 font-bold tracking-wider text-purple-700 uppercase font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Independent QA Inspection · SOR FR-04.5
                </span>
                <span className="text-slate-300">·</span>
                <button
                  onClick={() => setIsCaseSwitcherOpen(true)}
                  className="font-mono font-bold text-slate-800 hover:text-purple-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                  title="Switch QA Case File"
                >
                  <span>{reviewData.caseNumber}</span>
                  <FolderSync className="w-3 h-3 text-purple-600" />
                </button>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-500">Audit Case: {reviewData.auditCaseNumber}</span>
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                  {reviewData.taxpayerName}
                </h1>
                {reviewData.tradeName && (
                  <span className="hidden md:inline text-xs text-slate-600 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded font-medium truncate max-w-xs">
                    {reviewData.tradeName}
                  </span>
                )}
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                <span className="font-mono text-slate-800">TIN: {reviewData.tin}</span>
                <span className="text-slate-300">·</span>
                <span>Period: {reviewData.taxPeriod}</span>
                <span className="text-slate-300">·</span>
                <span>
                  Lead Auditor: <strong className="text-slate-800">{reviewData.leadAuditor}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>Team Leader: <strong className="text-slate-800">{reviewData.auditTeamLeader}</strong></span>
                <span className="text-slate-300">·</span>
                <span className="text-indigo-700 font-semibold font-mono">
                  Exposure: ${reviewData.totalTaxAssessment.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right: Quality Score Meter & Header Actions */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0">
              {/* Overall Score Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 flex items-center gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Quality Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-black font-mono tabular-nums ${
                        reviewData.overallScore >= 85
                          ? 'text-emerald-700'
                          : reviewData.overallScore >= 70
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {reviewData.overallScore}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/100</span>
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      reviewData.rating === 'EXCELLENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : reviewData.rating === 'SATISFACTORY'
                        ? 'bg-blue-100 text-blue-800'
                        : reviewData.rating === 'MARGINAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {reviewData.rating}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                    {reviewData.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Save Now & QA Trail */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualSave}
                  disabled={saveStatus === 'saving'}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Save Review Progress"
                >
                  {saveStatus === 'saving' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  onClick={() => setIsAuditTrailOpen(true)}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="View QA Audit Trail Log"
                >
                  <History className="w-3.5 h-3.5 text-purple-600" />
                  <span>Audit Trail</span>
                  {reviewData.auditTrail && reviewData.auditTrail.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                      {reviewData.auditTrail.length}
                    </span>
                  )}
                </button>

                {/* Submit for Supervisory Review */}
                {reviewData.status === 'IN_REVIEW' || reviewData.status === 'RETURNED_TO_OFFICER' ? (
                  <button
                    onClick={handleSubmitToTL}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Submit to QA Team Leader</span>
                  </button>
                ) : (
                  <div className="px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Submitted to {reviewData.qaTeamLeader}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-slate-200 pt-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('DIMENSIONS')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'DIMENSIONS'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>ISO 19011 Matrix ({reviewData.dimensions.length} Dimensions)</span>
          </button>

          <button
            onClick={() => setActiveTab('DEFICIENCIES')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 relative ${
              activeTab === 'DEFICIENCIES'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Deficiency Register</span>
            {reviewData.deficiencies.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 font-mono">
                {reviewData.deficiencies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_CONTEXT')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'AUDIT_CONTEXT'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Underlying Audit File Dossier</span>
          </button>

          <button
            onClick={() => setActiveTab('WORKING_PAPERS')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'WORKING_PAPERS'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>QA Recalculation & Working Papers</span>
          </button>

          <button
            onClick={() => setActiveTab('COMMUNICATION')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'COMMUNICATION'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Inter-Role Exchange & Dialogue</span>
            {reviewData.auditTeamResponseNotes && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('REPORT')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'REPORT'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>QA Review Report</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Information Progress Tracker Component */}
        <QAInformationProgressTracker review={reviewData} onRefresh={() => loadReview(activeQAId)} />

        {/* TAB 1: 7-DIMENSION QUALITY MATRIX */}
        {activeTab === 'DIMENSIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Dimension Selector Column (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                  Quality Dimensions Framework (ISO 19011)
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select dimension to verify statutory checkpoints and auto-recalculate compliance grades.
                </p>
              </div>

              {reviewData.dimensions.map((dim) => {
                const isSelected = dim.id === selectedDimensionId;
                const satisfiedCount = dim.checkpoints.filter((c) => c.isSatisfied).length;

                return (
                  <div
                    key={dim.id}
                    onClick={() => setSelectedDimensionId(dim.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-500 shadow-xs ring-1 ring-purple-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-2xs font-bold text-purple-700">
                        {dim.id} · {dim.standardsReference}
                      </span>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded font-bold ${
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

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{dim.title}</h4>

                    <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-500 font-mono">
                      <span>Weight: {dim.weight}%</span>
                      <span>
                        Passed: <strong>{satisfiedCount}/{dim.checkpoints.length}</strong>
                      </span>
                      <span className="font-bold text-purple-700">Score: {dim.score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Dimension Evaluation Panel (8 cols) */}
            <div className="lg:col-span-8">
              {activeDimension ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Dimension Header */}
                  <div className="p-5 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xs font-bold text-purple-700 font-mono bg-purple-100 px-2 py-0.5 rounded">
                            {activeDimension.id}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {activeDimension.standardsReference}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mt-1">
                          {activeDimension.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-2xs text-slate-400 uppercase font-mono block">Dimension Score</span>
                          <span className="text-xl font-bold font-mono text-purple-700">{activeDimension.score}%</span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            activeDimension.status === 'COMPLIANT'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : activeDimension.status === 'MINOR_DEFICIENCY'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {activeDimension.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checkpoints Checklist */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Statutory Checkpoint Verification
                      </h3>
                      <span className="text-2xs text-slate-500 font-mono">
                        Click checkbox to verify compliance & recalculate score
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeDimension.checkpoints.map((cp) => (
                        <div
                          key={cp.id}
                          className={`p-3.5 rounded-lg border transition-all ${
                            cp.isSatisfied
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={cp.isSatisfied}
                              onChange={() => handleToggleCheckpoint(cp.id)}
                              className="mt-1 h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-2xs text-slate-400 font-bold">{cp.id}</span>
                                {cp.isCritical && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-mono">
                                    CRITICAL CHECKPOINT
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-900 font-medium mt-0.5 leading-snug">
                                {cp.text}
                              </p>

                              {cp.auditorEvidenceRef && (
                                <div className="mt-2 flex items-center gap-1.5 text-2xs text-purple-700 font-mono bg-purple-50 p-1.5 rounded border border-purple-100 inline-flex">
                                  <FileText className="w-3 h-3" />
                                  <span>Auditor Evidence Ref: {cp.auditorEvidenceRef}</span>
                                </div>
                              )}

                              {cp.notes && (
                                <p className="text-2xs text-rose-800 mt-1 italic font-mono bg-rose-50 p-1.5 rounded">
                                  Defect Note: {cp.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reviewer Technical Notes */}
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        QA Inspector Evaluation Notes & Technical Justification:
                      </label>
                      <textarea
                        rows={3}
                        value={activeDimension.reviewerNotes}
                        onChange={(e) => handleUpdateNotes(e.target.value)}
                        placeholder="Document observations regarding adherence to statutory auditing standards..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2: DEFICIENCY REGISTER */}
        {activeTab === 'DEFICIENCIES' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Statutory Quality Deficiency & Corrective Action Register
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemized substantive defects, technical tax law breaches, and mandated corrective actions.
                </p>
              </div>

              <button
                onClick={() => setIsAddDeficiencyOpen(true)}
                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Deficiency</span>
              </button>
            </div>

            {reviewData.deficiencies.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Quality Deficiencies Flagged</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The inspected audit file currently satisfies all required substantive standards.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewData.deficiencies.map((def) => (
                  <div
                    key={def.id}
                    className={`p-4 rounded-xl border text-xs ${
                      def.severity === 'CRITICAL'
                        ? 'border-l-4 border-l-rose-600 border-slate-200 bg-white'
                        : def.severity === 'MAJOR'
                        ? 'border-l-4 border-l-amber-600 border-slate-200 bg-white'
                        : 'border-l-4 border-l-blue-600 border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                              def.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : def.severity === 'MAJOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {def.severity} Severity
                          </span>
                          <span className="text-2xs text-slate-500 font-mono">
                            {def.dimensionTitle}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-2xs text-slate-400">{def.id}</span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">{def.title}</h3>
                        <p className="text-xs text-slate-700 mt-2 leading-relaxed font-normal">
                          {def.findingDescription}
                        </p>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs">
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                            <span className="font-bold block text-slate-800 mb-0.5">
                              Statutory / Standards Breach:
                            </span>
                            <span className="text-slate-600 font-mono">{def.statutoryBreach}</span>
                          </div>

                          <div className="p-2.5 rounded bg-purple-50/60 border border-purple-100">
                            <span className="font-bold block text-purple-900 mb-0.5">
                              Mandatory Corrective Action:
                            </span>
                            <span className="text-purple-800">{def.correctiveActionMandate}</span>
                          </div>
                        </div>

                        {def.auditorResponse && (
                          <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-2xs text-amber-950">
                            <strong className="block mb-0.5 font-bold">Audit Team Remediation Response:</strong>
                            <p className="italic">{def.auditorResponse}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            def.status === 'OPEN'
                              ? 'bg-rose-100 text-rose-800'
                              : def.status === 'REMEDIATION_SUBMITTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {def.status.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => handleDeleteDeficiency(def.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete deficiency"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UNDERLYING AUDIT DOSSIER CORROBORATION */}
        {activeTab === 'AUDIT_CONTEXT' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Underlying Audit Dossier & Evidence Corroboration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit working papers, 3-way reconciliations, and proposed findings retrieved for QA verification.
              </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xs text-slate-400 uppercase font-bold block">Selection Rationale</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-1 block">
                  {reviewData.selectionReason.replace(/_/g, ' ')}
                </span>
                <span className="text-2xs text-slate-500 mt-1 block">Date: {reviewData.selectionDate}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xs text-slate-400 uppercase font-bold block">Assessed Tax Adjustment</span>
                <span className="text-sm font-bold text-indigo-700 font-mono mt-1 block text-lg">
                  ${reviewData.totalTaxAssessment.toLocaleString()}
                </span>
                <span className="text-2xs text-emerald-600 font-medium mt-1 block">Mandatory LTO Threshold Met</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xs text-slate-400 uppercase font-bold block">Field Audit Team</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  Lead Auditor: {reviewData.leadAuditor}
                </span>
                <span className="text-2xs text-slate-500 mt-0.5 block">Supervisor: {reviewData.auditTeamLeader}</span>
              </div>
            </div>

            {/* 3-Way Reconciliations Inspection */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Statutory 3-Way Tax Reconciliations
                </h3>
                <span className="text-2xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  VERIFIED BY QA
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block text-2xs">VAT Turnover vs CIT Gross Sales</span>
                  <div className="mt-1 font-mono text-2xs text-slate-600 space-y-0.5">
                    <div>VAT Returns: $12,450,000</div>
                    <div>CIT Gross: $14,270,000</div>
                    <div className="text-rose-600 font-bold">Variance: -$1,820,000</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block text-2xs">PAYE Salaries vs P&L Payroll</span>
                  <div className="mt-1 font-mono text-2xs text-slate-600 space-y-0.5">
                    <div>P&L Expense: $3,210,000</div>
                    <div>PAYE Returns: $3,210,000</div>
                    <div className="text-emerald-600 font-bold">Variance: $0 (Reconciled)</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block text-2xs">ASYCUDA Customs CIF vs Purchases</span>
                  <div className="mt-1 font-mono text-2xs text-slate-600 space-y-0.5">
                    <div>Customs CIF: $8,940,000</div>
                    <div>GL Imports: $6,690,000</div>
                    <div className="text-rose-600 font-bold">Variance: -$2,250,000</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Substantive Procedures Performed by Audit Team */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Audit Procedures Completed by Lead Auditor Jane Doe
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">AP-01: Revenue Completeness & Invoicing Cut-off</strong>
                    <span className="text-2xs text-slate-500">Tested 120 sales transactions against warehouse gate passes.</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">AP-02: Inventory Shrinkage & Normal Loss Assessment</strong>
                    <span className="text-2xs text-slate-500">Examined 4.2% shrinkage claims against industry 1.5% norm.</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">AP-03: Cross-Border Transfer Pricing & Management Toll Fees</strong>
                    <span className="text-2xs text-slate-500">Benchmarking search evaluated; flagged outdated 2021 study.</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">DEFICIENCY ISSUED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QA WORKING PAPERS & RECALCULATION */}
        {activeTab === 'WORKING_PAPERS' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                QA Inspector Independent Recalculation & Working Papers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Substantive mathematical recalculations, sample size defensibility modeling, and inspection working papers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tool 1: Statistical Sample Size Verifier */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Sample Size Defensibility Verifier
                  </h3>
                </div>
                <p className="text-2xs text-slate-500 leading-relaxed">
                  Validates whether the audit team's selected sample size is statistically defensible under ITAS Sampling Standards.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total Transaction Population (N)</label>
                    <input
                      type="number"
                      value={populationSize}
                      onChange={(e) => setPopulationSize(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Confidence Level (%)</label>
                      <select
                        value={confidenceLevel}
                        onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                      >
                        <option value={90}>90% Confidence</option>
                        <option value={95}>95% Confidence (Standard)</option>
                        <option value={99}>99% High Risk</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tolerable Error Margin (%)</label>
                      <select
                        value={tolerableError}
                        onChange={(e) => setTolerableError(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                      >
                        <option value={3}>3% Tight</option>
                        <option value={5}>5% Standard</option>
                        <option value={10}>10% Broad</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-2xs font-bold text-purple-700 uppercase block">
                      Required Defensible Sample Size:
                    </span>
                    <span className="text-2xl font-black font-mono text-purple-950 mt-1 block">
                      {calculatedSampleSize} Transactions
                    </span>
                    <span className="text-2xs text-purple-800 mt-1 block">
                      Auditor tested 380 items → Satisfies mandatory sample threshold.
                    </span>
                  </div>
                </div>
              </div>

              {/* Tool 2: Independent Tax Recalculation Worksheet */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Tax Liability & Penalty Recalculator
                  </h3>
                </div>
                <p className="text-2xs text-slate-500 leading-relaxed">
                  Independently recomputes principal tax, 20% statutory negligence penalty, and late interest.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Disallowed Turnover / Expense Base ($)</label>
                    <input
                      type="number"
                      value={recalcBaseSales}
                      onChange={(e) => setRecalcBaseSales(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">VAT / Tax Rate (%)</label>
                      <input
                        type="number"
                        value={recalcVatRate}
                        onChange={(e) => setRecalcVatRate(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Statutory Penalty (%)</label>
                      <input
                        type="number"
                        value={recalcPenaltyRate}
                        onChange={(e) => setRecalcPenaltyRate(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Principal Tax:</span>
                      <strong className="text-slate-900">${recalcTax.principal.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">20% Statutory Penalty:</span>
                      <strong className="text-slate-900">${recalcTax.penalty.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Late Interest (8%):</span>
                      <strong className="text-slate-900">${recalcTax.interest.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-indigo-200 text-indigo-950 font-bold text-sm">
                      <span>Total Recalculated:</span>
                      <span>${recalcTax.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QA Working Paper Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                QA Inspector Formal Working Paper Memo:
              </label>
              <textarea
                rows={3}
                value={qaInspectorNotes}
                onChange={(e) => setQaInspectorNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 text-slate-800"
              />
            </div>
          </div>
        )}

        {/* TAB 5: INTER-ROLE COMMUNICATION & REMEDIATION DIALOGUE */}
        {activeTab === 'COMMUNICATION' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Inter-Role Communication & Remediation Exchange
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological communication thread between QA Directorate and Lead Auditor {reviewData.leadAuditor}.
              </p>
            </div>

            <div className="space-y-4">
              {reviewData.qaTeamLeaderComment && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                    <span>QA Team Leader Notice · {reviewData.qaTeamLeader}</span>
                    <span className="font-mono text-2xs text-amber-600">
                      {reviewData.qaTeamLeaderDecisionDate ? new Date(reviewData.qaTeamLeaderDecisionDate).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    "{reviewData.qaTeamLeaderComment}"
                  </p>
                </div>
              )}

              {reviewData.auditTeamResponseNotes ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                    <span>Audit Team Remediation Response · {reviewData.leadAuditor} (Lead Auditor)</span>
                    <span className="font-mono text-2xs text-emerald-600">
                      {reviewData.auditTeamResponseDate ? new Date(reviewData.auditTeamResponseDate).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    "{reviewData.auditTeamResponseNotes}"
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Audit Team has not yet submitted formal remediation response.
                </div>
              )}

              {reviewData.directorExecutiveComment && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                    <span>Director Executive Directive · Dr. Arthur Pendelton</span>
                    <span className="font-mono text-2xs text-purple-600">
                      {reviewData.directorExecutiveDecisionDate ? new Date(reviewData.directorExecutiveDecisionDate).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-800 leading-relaxed font-medium">
                    "{reviewData.directorExecutiveComment}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: QA REPORT */}
        {activeTab === 'REPORT' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-5 text-center">
              <span className="text-2xs font-bold font-mono tracking-widest text-purple-700 uppercase block">
                Integrated Tax Administration System (ITAS)
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Formal Audit Quality Assurance Review Report
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Conducted in accordance with SOR FR-04.5 & ISO 19011 Quality Management Guidelines
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-2xs">Audit Case Number</span>
                <strong className="text-slate-800">{reviewData.auditCaseNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Taxpayer</span>
                <strong className="text-slate-800">{reviewData.taxpayerName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Quality Score</span>
                <strong className="text-purple-700">{reviewData.overallScore}/100</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Quality Rating</span>
                <strong className="text-emerald-700">{reviewData.rating}</strong>
              </div>
            </div>

            {/* Executive Summary */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                1. Executive Summary & Assessment
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed p-4 bg-slate-50/80 rounded-lg border border-slate-200">
                {reviewData.report?.executiveSummary ||
                  `Quality Assurance inspection of case ${reviewData.auditCaseNumber} completed with overall score of ${reviewData.overallScore}%.`}
              </p>
            </div>

            {/* Key Strengths */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                2. Demonstrated Substantive Strengths
              </h3>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
                {reviewData.report?.keyStrengths?.map((str, idx) => (
                  <li key={idx}>{str}</li>
                )) || <li>Complete substantive procedures and CAAT execution.</li>}
              </ul>
            </div>

            {/* Vulnerabilities & Deficiencies */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                3. Quality Deficiencies & Vulnerabilities
              </h3>
              {reviewData.deficiencies.length === 0 ? (
                <p className="text-xs text-emerald-700 italic">No material deficiencies flagged.</p>
              ) : (
                <div className="space-y-2">
                  {reviewData.deficiencies.map((d) => (
                    <div key={d.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs">
                      <strong className="text-rose-950 font-bold block">{d.title} ({d.severity})</strong>
                      <p className="text-rose-900 text-2xs mt-0.5">{d.findingDescription}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
              <div>
                <span className="text-slate-400 block text-2xs">Inspecting QA Officer:</span>
                <span className="font-bold text-slate-900 block mt-1">{reviewData.assignedQAOfficer}</span>
                <span className="text-slate-400 text-2xs block font-mono">Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-2xs">Supervising QA Team Leader:</span>
                <span className="font-bold text-slate-900 block mt-1">{reviewData.qaTeamLeader}</span>
                <span className="text-slate-400 text-2xs block font-mono">Status: {reviewData.status}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Case Switcher Modal */}
      <QACaseSwitcherModal
        isOpen={isCaseSwitcherOpen}
        onClose={() => setIsCaseSwitcherOpen(false)}
        activeCaseId={activeQAId}
        onSelectCase={(newId) => setActiveQAId(newId)}
      />

      {/* Audit Trail Drawer */}
      <AuditTrailDrawer
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
        entries={reviewData.auditTrail || []}
        caseId={reviewData.caseNumber}
      />

      {/* Add Deficiency Modal */}
      {isAddDeficiencyOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Log Audit Quality Deficiency
                </h3>
              </div>
              <button
                onClick={() => setIsAddDeficiencyOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeficiency} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold block text-slate-800 mb-1">Deficiency Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incomplete Third-Party Bank Confirmation"
                  value={newDefTitle}
                  onChange={(e) => setNewDefTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-800 mb-1">Severity Classification</label>
                <select
                  value={newDefSeverity}
                  onChange={(e) => setNewDefSeverity(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                >
                  <option value="CRITICAL">CRITICAL (Fatal Procedural or Legal Flaw)</option>
                  <option value="MAJOR">MAJOR (Material Evidentiary Gap)</option>
                  <option value="MODERATE">MODERATE (Documentation Defect)</option>
                  <option value="OBSERVATION">OBSERVATION (Advisory Recommendation)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-800 mb-1">Factual Finding Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the specific non-compliance identified during inspection..."
                  value={newDefDesc}
                  onChange={(e) => setNewDefDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-800 mb-1">Statutory / Standards Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Tax Administration Act S.42 or ISO 19011 Clause 6.4"
                  value={newDefBreach}
                  onChange={(e) => setNewDefBreach(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-800 mb-1">Mandatory Corrective Action Directive</label>
                <textarea
                  rows={2}
                  placeholder="Exact remediation required from the lead auditor..."
                  value={newDefMandate}
                  onChange={(e) => setNewDefMandate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDeficiencyOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Record Deficiency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAOfficerWorkspace;
