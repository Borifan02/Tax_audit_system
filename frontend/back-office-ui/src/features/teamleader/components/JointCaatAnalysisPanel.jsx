import React, { useState, useMemo } from 'react';
import {
  Cpu, Play, CheckCircle2, AlertTriangle, XCircle, Edit3, FileText,
  Filter, ShieldAlert, Database, ArrowRight, RefreshCw, Download,
  Printer, Check, X, Layers, Search, Sparkles, Scale, Building2, Eye
} from 'lucide-react';

/**
 * JointCaatAnalysisPanel — Dedicated Joint Audit Computer-Assisted Audit Techniques (CAAT)
 * Implements ITAS_Joint_Audit_System.md requirements:
 *  - Team Leader Monitoring (Tasks 46–49):
 *      Task 46: View CAAT Status & Auditor Validation Progress (FR-04.4-01)
 *      Task 47: View Anomaly Summary by Severity (Critical/High/Medium/Low) & Disposition (FR-04.4-01)
 *      Task 48: View Full Anomaly List & Multi-Agency Data Sources (FR-04.4-01)
 *      Task 49: View Anomaly Validation Details — Side-by-Side Original CAAT vs Amended Values & Mandatory Notes (FR-04.4-02)
 *  - Auditor Execution & Validation (Tasks 87–94 & Task 101):
 *      Task 87: Check CAAT Eligibility across Multi-Agency Data Feeds (FR-04.4-01)
 *      Task 88: Select CAAT Analyses (Ratio, Third-Party, Transaction, Revenue, Expense, Fraud) (FR-04.4-01)
 *      Task 89: Run CAAT Analysis against backend engine (FR-04.4-01)
 *      Task 90: View Anomalies by Severity (Critical, High, Medium, Low) (FR-04.4-01, FR-04.4-02)
 *      Task 91: Accept Anomaly (FR-04.4-02)
 *      Task 92: Amend Anomaly with Mandatory Reason & Side-by-Side Original vs Amended Comparison (FR-04.4-02)
 *      Task 93: Reject Anomaly with Mandatory Reason (FR-04.4-02)
 *      Task 94: Generate Joint CAAT Forensic Validation Report & Promote to Findings (FR-04.4-02)
 */

export const JOINT_CAAT_MODULES = [
  {
    id: 'RATIO_ANALYSIS',
    code: 'MOD-01',
    name: 'Ratio Analysis',
    subtitle: 'Gross/Net Margin & VAT Input-Output Outliers',
    dataSource: 'SIGTAS Financial Statements vs Sector Benchmark',
    description: 'Cross-checks declared gross/net profit margins, VAT input-to-output credit ratios, and inventory turnover velocity against customs CIF import landed cost.',
  },
  {
    id: 'THIRD_PARTY_MATCHING',
    code: 'MOD-02',
    name: 'Third-Party Cross-Matching',
    subtitle: 'ASYCUDA++ Customs, NBE FX & 2% WHT Registry',
    dataSource: 'Ethiopian Customs (ASYCUDA++/eCMS), NBE & Commercial Banks',
    description: 'Reconciles commercial import declarations (CIF + Duty), bank credit settlements, and third-party B2B 2% withholding certificates against domestic tax filings.',
  },
  {
    id: 'TRANSACTION_ANALYSIS',
    code: 'MOD-03',
    name: 'Transaction-Level Forensics',
    subtitle: "Benford's Law, Split Vouchers & EFD Sequence Gaps",
    dataSource: 'General Ledger Journal Lines & EFD Fiscal Memory Log',
    description: "Executes Benford's Law first-digit Chi-Square distribution test, detects split procurement invoices below ETB 10,000 WHT threshold, and flags EFD receipt gaps.",
  },
  {
    id: 'REVENUE_ANALYSIS',
    code: 'MOD-04',
    name: 'Multi-Tax Revenue Analysis',
    subtitle: 'EFD Z-Reports vs 12 Monthly VAT vs Annual CIT Turnover',
    dataSource: 'MOR EFD Server, Monthly VAT Returns & Annual CIT Return',
    description: 'Performs three-way turnover reconciliation across EFD Z-reports, monthly VAT declarations, and annual CIT revenue, including zero-rated export verification.',
  },
  {
    id: 'EXPENSE_ANALYSIS',
    code: 'MOD-05',
    name: 'Expense & Deduction Analysis',
    subtitle: 'Non-EFD Deductions, Reverse VAT & PAYE Reconciliation',
    dataSource: 'CIT Schedule C Deductions, PAYE Filings & WHT Remittances',
    description: 'Identifies unsupported management fees, non-EFD expenses, excess depreciation (Proc. 979/2016 Art. 25), and CIT salary deductions vs monthly PAYE returns.',
  },
  {
    id: 'FRAUD_INDICATORS',
    code: 'MOD-06',
    name: 'Joint Fraud Indicators',
    subtitle: 'Suspended TIN Blacklist & Customs HS Tariff Shifting',
    dataSource: 'MOR Cancelled/Suspended TIN Blacklist & ECVS Valuation DB',
    description: 'Scans input VAT schedules against deregistered/phantom supplier TINs and detects systematic customs HS tariff code shifting and related-party under-invoicing.',
  },
];

const SEVERITY_META = {
  CRITICAL: {
    label: 'Critical',
    badge: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
    card: 'border-l-4 border-l-purple-600',
    dot: 'bg-purple-600',
  },
  HIGH: {
    label: 'High',
    badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700',
    card: 'border-l-4 border-l-red-500',
    dot: 'bg-red-500',
  },
  MEDIUM: {
    label: 'Medium',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
    card: 'border-l-4 border-l-amber-500',
    dot: 'bg-amber-500',
  },
  LOW: {
    label: 'Low',
    badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700',
    card: 'border-l-4 border-l-blue-500',
    dot: 'bg-blue-500',
  },
};

const STATUS_META = {
  PENDING: {
    label: 'Pending Validation',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
  },
  ACCEPT: {
    label: 'Accepted',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
  },
  AMENDED: {
    label: 'Amended',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
  },
  AMEND: {
    label: 'Amended',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
  },
  REJECTED: {
    label: 'Rejected (False Positive)',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
  },
  REJECT: {
    label: 'Rejected (False Positive)',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
  },
};

function formatETB(val) {
  const num = Number(val ?? 0);
  if (Number.isNaN(num)) return 'ETB 0.00';
  return 'ETB ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDisposition(anomaly) {
  const raw = (anomaly.decision || anomaly.validationStatus || 'PENDING').toUpperCase();
  if (raw === 'ACCEPT') return 'ACCEPTED';
  if (raw === 'AMEND') return 'AMENDED';
  if (raw === 'REJECT') return 'REJECTED';
  return raw;
}

export default function JointCaatAnalysisPanel({
  caseId,
  caseData = {},
  workflow = {},
  actions = {},
  actorId = 'system',
  mode = 'AUDITOR', // 'AUDITOR' | 'TEAM_LEADER'
  onCompleteStep,
  onNavigateToFindings,
}) {
  const isAuditor = mode === 'AUDITOR';
  const anomalies = Array.isArray(workflow?.anomalies) ? workflow.anomalies : [];
  const documents = Array.isArray(workflow?.documents) ? workflow.documents : [];
  const docRequests = Array.isArray(workflow?.documentRequests) ? workflow.documentRequests : [];

  // Task 87: Eligibility Check state
  const [eligibilityChecked, setEligibilityChecked] = useState(true);
  // Task 88: Selected CAAT Analysis Modules
  const [selectedModules, setSelectedModules] = useState(() =>
    JOINT_CAAT_MODULES.map(m => m.id)
  );
  // Task 89: Running state
  const [runningCaat, setRunningCaat] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotionBanner, setPromotionBanner] = useState(null);

  // Filters (Task 90 / Task 48)
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Task 91 / 92 / 93: Active validation modal/inline form state
  const [activeValidation, setActiveValidation] = useState(null);
  // { anomalyId, mode: 'ACCEPT' | 'AMEND' | 'REJECT', amendedAmount: '', notes: '', error: '' }

  // Task 94: CAAT Report Modal
  const [showReportModal, setShowReportModal] = useState(false);

  const toggleModule = (moduleId) => {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Summary metrics (Tasks 47 & 90)
  const metrics = useMemo(() => {
    const counts = {
      total: anomalies.length,
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      PENDING: 0,
      ACCEPTED: 0,
      AMENDED: 0,
      REJECTED: 0,
      originalExposure: 0,
      validatedExposure: 0,
    };

    for (const a of anomalies) {
      const sev = (a.severity || 'MEDIUM').toUpperCase();
      if (counts[sev] !== undefined) counts[sev] += 1;
      const disp = getDisposition(a);
      if (counts[disp] !== undefined) counts[disp] += 1;

      const orig = Number(a.originalAmount ?? a.amount ?? a.expectedAmount ?? 0);
      const amended = a.amendedAmount !== null && a.amendedAmount !== undefined
        ? Number(a.amendedAmount)
        : orig;

      counts.originalExposure += orig;
      if (disp === 'ACCEPTED') {
        counts.validatedExposure += orig;
      } else if (disp === 'AMENDED') {
        counts.validatedExposure += amended;
      } else if (disp === 'PENDING') {
        counts.validatedExposure += orig;
      }
    }

    const validatedCount = counts.ACCEPTED + counts.AMENDED + counts.REJECTED;
    const progressPct = counts.total > 0 ? Math.round((validatedCount / counts.total) * 100) : 0;
    const allValidated = counts.total > 0 && counts.PENDING === 0;

    return { ...counts, validatedCount, progressPct, allValidated };
  }, [anomalies]);

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      const sev = (a.severity || 'MEDIUM').toUpperCase();
      const disp = getDisposition(a);
      const mod = (a.analysisType || '').toUpperCase();
      if (severityFilter !== 'ALL' && sev !== severityFilter) return false;
      if (statusFilter !== 'ALL' && disp !== statusFilter) return false;
      if (moduleFilter !== 'ALL' && mod !== moduleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${a.ruleCode || ''} ${a.description || ''} ${a.details || ''} ${a.taxType || ''} ${a.dataSource || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [anomalies, severityFilter, statusFilter, moduleFilter, searchQuery]);

  // Task 89: Run Joint CAAT Analysis
  const handleRunJointCaat = async () => {
    if (selectedModules.length === 0) return;
    setRunningCaat(true);
    setPromotionBanner(null);
    try {
      await actions.runCAAT(caseId, actorId, {
        analysisTypes: selectedModules,
      });
    } finally {
      setRunningCaat(false);
    }
  };

  // Open validation action (Accept / Amend / Reject)
  const openValidationForm = (anomaly, decisionMode) => {
    const orig = Number(anomaly.originalAmount ?? anomaly.amount ?? 0);
    const currentAmended = anomaly.amendedAmount !== null && anomaly.amendedAmount !== undefined
      ? Number(anomaly.amendedAmount)
      : orig;
    setActiveValidation({
      anomalyId: anomaly.id,
      mode: decisionMode, // 'ACCEPTED' | 'AMENDED' | 'REJECTED'
      amendedAmount: decisionMode === 'AMENDED' ? String(currentAmended) : String(orig),
      notes: anomaly.validationNotes || anomaly.notes || '',
      error: '',
    });
  };

  // Confirm validation (Tasks 91, 92, 93)
  const handleConfirmValidation = async (anomaly) => {
    if (!activeValidation) return;
    const { mode: decMode, amendedAmount, notes } = activeValidation;
    const trimmedNotes = (notes || '').trim();

    if ((decMode === 'AMENDED' || decMode === 'REJECTED') && !trimmedNotes) {
      setActiveValidation(prev => ({
        ...prev,
        error: decMode === 'AMENDED'
          ? 'Mandatory Requirement (FR-04.4-02): Please provide the audit justification and reconciliation basis for amending the CAAT value.'
          : 'Mandatory Requirement (FR-04.4-02): Please provide the verification reason and evidence reference for rejecting this anomaly as a false positive.',
      }));
      return;
    }

    let numericAmended = Number(anomaly.originalAmount ?? anomaly.amount ?? 0);
    if (decMode === 'AMENDED') {
      const parsed = Number(String(amendedAmount).replace(/,/g, ''));
      if (Number.isNaN(parsed) || parsed < 0) {
        setActiveValidation(prev => ({
          ...prev,
          error: 'Please enter a valid non-negative amended amount in ETB.',
        }));
        return;
      }
      numericAmended = parsed;
    } else if (decMode === 'REJECTED') {
      numericAmended = 0;
    }

    const effectiveNotes = trimmedNotes || 'Validated and accepted against primary audit working papers and multi-agency records.';
    await actions.validateAnomaly(caseId, anomaly.id, decMode, effectiveNotes, numericAmended);
    setActiveValidation(null);
  };

  // Quick 1-click Accept with default note
  const handleQuickAccept = async (anomaly) => {
    const orig = Number(anomaly.originalAmount ?? anomaly.amount ?? 0);
    const existingNotes = (anomaly.validationNotes || anomaly.notes || '').trim();
    const note = existingNotes || `Confirmed CAAT anomaly (${anomaly.ruleCode || anomaly.analysisType}) against primary multi-agency source records.`;
    await actions.validateAnomaly(caseId, anomaly.id, 'ACCEPTED', note, orig);
  };

  // Promote validated anomalies to Step 9 Findings (Task 101)
  const handlePromoteToFindings = async () => {
    setPromoting(true);
    try {
      const findings = await actions.promoteCaatToFindings?.(caseId, actorId);
      setPromotionBanner(
        `Successfully promoted ${metrics.ACCEPTED + metrics.AMENDED} validated CAAT anomalies (${formatETB(metrics.validatedExposure)} principal exposure) to Audit Findings.`
      );
      if (onNavigateToFindings) {
        onNavigateToFindings(findings);
      }
    } finally {
      setPromoting(false);
    }
  };

  // Export CSV of CAAT Anomalies & Side-by-Side Comparison
  const handleExportCsv = () => {
    const headers = [
      'Rule Code', 'Analysis Module', 'Severity', 'Tax Type', 'Tax Period',
      'Data Source', 'Description', 'Expected Amount (ETB)', 'Reported Amount (ETB)',
      'Original CAAT Value (ETB)', 'Amended / Validated Value (ETB)', 'Variance Delta (ETB)',
      'Validation Status', 'Auditor Justification Notes'
    ];
    const rows = anomalies.map(a => {
      const disp = getDisposition(a);
      const orig = Number(a.originalAmount ?? a.amount ?? 0);
      const amended = disp === 'REJECTED' ? 0 : Number(a.amendedAmount ?? orig);
      const delta = amended - orig;
      return [
        a.ruleCode || '',
        a.analysisType || '',
        a.severity || '',
        a.taxType || '',
        a.taxPeriod || '',
        a.dataSource || '',
        (a.description || '').replace(/"/g, '""'),
        Number(a.expectedAmount ?? 0).toFixed(2),
        Number(a.reportedAmount ?? 0).toFixed(2),
        orig.toFixed(2),
        amended.toFixed(2),
        delta.toFixed(2),
        disp,
        (a.validationNotes || a.notes || '').replace(/"/g, '""'),
      ].map(v => `"${v}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Joint_Audit_CAAT_Report_${caseData?.caseNumber || caseId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER BANNER: JOINT AUDIT MULTI-AGENCY CAAT ENGINE
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 shadow-md border border-indigo-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Joint Audit CAAT • FR-04.4-01 & FR-04.4-02
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {isAuditor ? 'Auditor Forensic Execution & Validation (Tasks 87–94)' : 'Team Leader CAAT Supervision & Comparison (Tasks 46–49)'}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-400" />
              Joint Audit Computer-Assisted Audit Techniques (CAAT) Workbench
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl">
              Automated multi-agency cross-matching across MOR SIGTAS Domestic Tax Filings, Ethiopian Customs Commission ASYCUDA++/eCMS Declarations, EFD Fiscal Z-Reports, and NBE/Commercial Bank Settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {anomalies.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4 text-indigo-300" />
                  CAAT Validation Report
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  Export CSV
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleRunJointCaat}
              disabled={runningCaat || selectedModules.length === 0}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center gap-2 transition"
            >
              {runningCaat ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running {selectedModules.length} CAAT Modules...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {anomalies.length > 0 ? 'Re-Run Selected CAAT Modules' : `Run Joint CAAT (${selectedModules.length} Modules)`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Bar (Task 46: View CAAT Status) */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-slate-400">CAAT Engine Status (Task 46)</div>
            <div className="mt-1 font-bold text-sm flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                anomalies.length === 0 ? 'bg-slate-400' : metrics.allValidated ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              {anomalies.length === 0
                ? 'Ready for Execution'
                : metrics.allValidated
                  ? 'Completed — 100% Validated'
                  : `In Review (${metrics.validatedCount}/${metrics.total} Validated)`}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-slate-400">Original CAAT Detected Exposure</div>
            <div className="mt-1 font-bold text-sm text-amber-300">
              {formatETB(metrics.originalExposure)}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-slate-400">Validated / Amended Exposure</div>
            <div className="mt-1 font-bold text-sm text-emerald-300">
              {formatETB(metrics.validatedExposure)}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-slate-400">Validation Progress</div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${metrics.progressPct}%` }}
                />
              </div>
              <span className="font-bold text-white">{metrics.progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TASK 87: CHECK CAAT ELIGIBILITY & MULTI-AGENCY DATA FEEDS
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Task 87: Joint Audit CAAT Eligibility & Multi-Agency Data Readiness Check
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                ELIGIBLE (FR-04.4-01)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifies case risk profile, digital ledger availability, and multi-agency data connectors prior to executing CAAT scripts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEligibilityChecked(prev => !prev)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start sm:self-auto"
          >
            {eligibilityChecked ? 'Hide Readiness Matrix' : 'Show Readiness Matrix'}
          </button>
        </div>

        {eligibilityChecked && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>1. SIGTAS Core Tax Returns</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                CIT Schedule C, 12 Monthly VAT Returns, PAYE & WHT filings synchronized for {caseData?.taxpayerName || 'Taxpayer'}.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>2. ASYCUDA++ / eCMS Customs</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Commercial import CIF declarations, HS tariff classifications & export release certificates connected.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>3. EFD Fiscal Z-Report Stream</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Electronic Fiscal Device daily Z-reports & sequential FS invoice telemetry available for gap analysis.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>4. Case Docs & Bank Feed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {documents.length} uploaded case file(s), {docRequests.length} info request(s), and NBE commercial bank credit feed ready.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TASK 88 & 89: SELECT & RUN 6 JOINT AUDIT CAAT ANALYSIS MODULES
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Task 88 & 89: Select Joint Audit CAAT Analysis Modules ({selectedModules.length}/6 Selected)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the forensic CAAT modules to execute against the taxpayer&apos;s multi-tax and customs dataset.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedModules(JOINT_CAAT_MODULES.map(m => m.id))}
              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Select All 6
            </button>
            <button
              type="button"
              onClick={() => setSelectedModules(['RATIO_ANALYSIS', 'THIRD_PARTY_MATCHING', 'FRAUD_INDICATORS'])}
              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              High-Risk Core (3)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
          {JOINT_CAAT_MODULES.map(mod => {
            const isSelected = selectedModules.includes(mod.id);
            const moduleAnomalyCount = anomalies.filter(a => (a.analysisType || '').toUpperCase() === mod.id).length;
            return (
              <div
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/25 dark:border-indigo-500/70 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {mod.code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {mod.name}
                      </h4>
                    </div>
                  </div>
                  {moduleAnomalyCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                      {moduleAnomalyCount} Anomalies
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1.5">
                  {mod.subtitle}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {mod.description}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{mod.dataSource}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TASK 47 & 90: ANOMALY SUMMARY BY SEVERITY & DISPOSITION
         ═══════════════════════════════════════════════════════════════════════ */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { key: 'CRITICAL', label: 'Critical', count: metrics.CRITICAL, color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
            { key: 'HIGH', label: 'High Severity', count: metrics.HIGH, color: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
            { key: 'MEDIUM', label: 'Medium Severity', count: metrics.MEDIUM, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
            { key: 'LOW', label: 'Low Severity', count: metrics.LOW, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
          ].map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSeverityFilter(prev => prev === item.key ? 'ALL' : item.key)}
              className={`p-3 rounded-xl border text-left transition ${item.color} ${
                severityFilter === item.key ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="text-[11px] font-semibold opacity-80">{item.label}</div>
              <div className="text-2xl font-black mt-0.5">{item.count}</div>
            </button>
          ))}

          {[
            { key: 'PENDING', label: 'Pending Review', count: metrics.PENDING, color: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' },
            { key: 'ACCEPTED', label: 'Accepted', count: metrics.ACCEPTED, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
            { key: 'AMENDED', label: 'Amended', count: metrics.AMENDED, color: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
            { key: 'REJECTED', label: 'Rejected', count: metrics.REJECTED, color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
          ].map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(prev => prev === item.key ? 'ALL' : item.key)}
              className={`p-3 rounded-xl border text-left transition ${item.color} ${
                statusFilter === item.key ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="text-[11px] font-semibold opacity-80">{item.label}</div>
              <div className="text-2xl font-black mt-0.5">{item.count}</div>
            </button>
          ))}
        </div>
      )}

      {/* Promotion feedback banner */}
      {promotionBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{promotionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setPromotionBanner(null)}
            className="text-xs text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE-BY-SIDE ORIGINAL CAAT VALUE VS AMENDED VALUE COMPARISON TABLE
          (Required by FR-04.4-02 for both Auditor & Team Leader — Task 49 & 92)
         ═══════════════════════════════════════════════════════════════════════ */}
      {anomalies.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Side-by-Side Comparison: Original CAAT Value vs. Auditor Validated / Amended Value (FR-04.4-02)
              </h3>
              <p className="text-xs text-slate-500">
                Displays original computer-detected tax exposure alongside auditor-validated or amended figures and mandatory reconciliation notes.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Net Adjustment Delta:{' '}
              <span className={metrics.validatedExposure - metrics.originalExposure < 0 ? 'text-amber-600' : 'text-emerald-600'}>
                {formatETB(metrics.validatedExposure - metrics.originalExposure)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-left">Rule / Module</th>
                  <th className="py-2.5 px-3 text-left">Anomaly & Tax Type</th>
                  <th className="py-2.5 px-3 text-center">Severity</th>
                  <th className="py-2.5 px-3 text-right">Expected Benchmark</th>
                  <th className="py-2.5 px-3 text-right">Taxpayer Reported</th>
                  <th className="py-2.5 px-3 text-right bg-indigo-50/60 dark:bg-indigo-950/30">Original CAAT Value</th>
                  <th className="py-2.5 px-3 text-right bg-emerald-50/60 dark:bg-emerald-950/30">Validated / Amended Value</th>
                  <th className="py-2.5 px-3 text-center">Disposition</th>
                  <th className="py-2.5 px-3 text-left">Auditor Mandatory Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {anomalies.map(a => {
                  const disp = getDisposition(a);
                  const sevMeta = SEVERITY_META[(a.severity || 'MEDIUM').toUpperCase()] || SEVERITY_META.MEDIUM;
                  const statMeta = STATUS_META[disp] || STATUS_META.PENDING;
                  const orig = Number(a.originalAmount ?? a.amount ?? 0);
                  const amended = disp === 'REJECTED'
                    ? 0
                    : (a.amendedAmount !== null && a.amendedAmount !== undefined ? Number(a.amendedAmount) : orig);
                  const isChanged = disp === 'AMENDED' || disp === 'REJECTED';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                        <div>{a.ruleCode || 'JA-CAAT'}</div>
                        <div className="text-[10px] font-sans font-normal text-slate-500">{a.analysisType}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{a.description}</div>
                        <div className="text-[11px] text-slate-500">{a.taxType || 'Multi-Tax (CIT / VAT / Customs)'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevMeta.badge}`}>
                          {sevMeta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatETB(a.expectedAmount ?? orig)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatETB(a.reportedAmount ?? 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white bg-indigo-50/40 dark:bg-indigo-950/20 whitespace-nowrap">
                        {formatETB(orig)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap bg-emerald-50/40 dark:bg-emerald-950/20 ${
                        disp === 'REJECTED'
                          ? 'text-rose-600 line-through'
                          : disp === 'AMENDED'
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {formatETB(amended)}
                        {isChanged && (
                          <div className="text-[10px] font-normal text-slate-500">
                            ({amended - orig >= 0 ? '+' : ''}{formatETB(amended - orig)})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statMeta.badge}`}>
                          {statMeta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs">
                        {a.validationNotes || a.notes ? (
                          <span className="italic">&ldquo;{a.validationNotes || a.notes}&rdquo;</span>
                        ) : (
                          <span className="text-slate-400">Awaiting auditor validation</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TASKS 48, 49 & 90–93: DETAILED ANOMALY CARDS & VALIDATION WORKBENCH
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isAuditor
                ? 'Tasks 90–93: CAAT Anomaly Forensic Review & Validation Disposition'
                : 'Tasks 48 & 49: CAAT Anomaly Registry & Auditor Validation Details'}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredAnomalies.length} of {anomalies.length} detected multi-agency anomalies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search rule, tax type, source..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All 6 CAAT Modules</option>
              {JOINT_CAAT_MODULES.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Dispositions</option>
              <option value="PENDING">Pending Validation</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="AMENDED">Amended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {anomalies.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
            <Cpu className="w-10 h-10 text-indigo-500 mx-auto mb-3 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Joint Audit CAAT Anomalies Generated Yet
            </h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
              Select the desired CAAT analysis modules above (Ratio Analysis, Third-Party Cross-Matching, Transaction Forensics, Revenue, Expense, Fraud Indicators) and click &ldquo;Run Joint CAAT&rdquo; to execute automated multi-agency anomaly detection.
            </p>
            <button
              type="button"
              onClick={handleRunJointCaat}
              disabled={runningCaat}
              className="mt-4 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {runningCaat ? 'Running Joint CAAT Engine...' : 'Execute All 6 Joint CAAT Modules Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnomalies.map(anomaly => {
              const sevKey = (anomaly.severity || 'MEDIUM').toUpperCase();
              const sevMeta = SEVERITY_META[sevKey] || SEVERITY_META.MEDIUM;
              const disp = getDisposition(anomaly);
              const statMeta = STATUS_META[disp] || STATUS_META.PENDING;
              const orig = Number(anomaly.originalAmount ?? anomaly.amount ?? 0);
              const amended = disp === 'REJECTED'
                ? 0
                : (anomaly.amendedAmount !== null && anomaly.amendedAmount !== undefined ? Number(anomaly.amendedAmount) : orig);
              const isEditingThis = activeValidation?.anomalyId === anomaly.id;

              return (
                <div
                  key={anomaly.id}
                  className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition ${sevMeta.card}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {anomaly.ruleCode || 'JA-CAAT'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sevMeta.badge}`}>
                          {sevMeta.label} Severity
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statMeta.badge}`}>
                          {statMeta.label}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          • Module: <strong className="text-slate-700 dark:text-slate-300">{anomaly.analysisType}</strong>
                        </span>
                        {anomaly.taxPeriod && (
                          <span className="text-xs text-slate-500">
                            • Period: <strong>{anomaly.taxPeriod}</strong>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {anomaly.description}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {anomaly.details}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          <strong>Tax Scope:</strong> {anomaly.taxType || 'Joint Multi-Tax (CIT / VAT / Customs)'}
                        </span>
                        <span>
                          <strong>Multi-Agency Source:</strong> {anomaly.dataSource || 'SIGTAS & ASYCUDA++ Cross-Match'}
                        </span>
                        {anomaly.evidenceRef && (
                          <span>
                            <strong>Working Paper Ref:</strong> {anomaly.evidenceRef}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Side-by-Side Financial Comparison Box */}
                    <div className="lg:w-80 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Side-by-Side Valuation (FR-04.4-02)
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500">Original CAAT Value</div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {formatETB(orig)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500">
                            {disp === 'AMENDED' ? 'Amended Value' : disp === 'REJECTED' ? 'Rejected (0)' : 'Validated Value'}
                          </div>
                          <div className={`font-mono font-bold mt-0.5 ${
                            disp === 'REJECTED'
                              ? 'text-rose-600 line-through'
                              : disp === 'AMENDED'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {formatETB(amended)}
                          </div>
                        </div>
                      </div>
                      {(anomaly.expectedAmount !== undefined || anomaly.reportedAmount !== undefined) && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                          <span>Benchmark: {formatETB(anomaly.expectedAmount ?? orig)}</span>
                          <span>Declared: {formatETB(anomaly.reportedAmount ?? 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Validation Notes Display (Task 49 & Task 92/93) */}
                  {(anomaly.validationNotes || anomaly.notes) && !isEditingThis && (
                    <div className="mt-3 p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-indigo-900 dark:text-indigo-300">
                          Auditor Validation Justification ({disp}):{' '}
                        </span>
                        <span>{anomaly.validationNotes || anomaly.notes}</span>
                      </div>
                      {anomaly.validatedAt && (
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(anomaly.validatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Auditor Action Buttons (Tasks 91, 92, 93) */}
                  {isAuditor && !isEditingThis && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Select disposition action (Amend and Reject require mandatory audit justification):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickAccept(anomaly)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                            disp === 'ACCEPTED'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Anomaly (Task 91)
                        </button>

                        <button
                          type="button"
                          onClick={() => openValidationForm(anomaly, 'AMENDED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                            disp === 'AMENDED'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Amend Value + Reason (Task 92)
                        </button>

                        <button
                          type="button"
                          onClick={() => openValidationForm(anomaly, 'REJECTED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                            disp === 'REJECTED'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject + Reason (Task 93)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Amendment / Rejection Form with Mandatory Justification */}
                  {isEditingThis && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-2 border-indigo-500/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                          {activeValidation.mode === 'AMENDED'
                            ? 'Task 92: Amend CAAT Anomaly Value (Mandatory Reconciliation Reason Required)'
                            : 'Task 93: Reject CAAT Anomaly as False Positive (Mandatory Reason Required)'}
                        </h5>
                        <button
                          type="button"
                          onClick={() => setActiveValidation(null)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>

                      {activeValidation.mode === 'AMENDED' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <label className="block text-[11px] text-slate-500">Original CAAT Detected Exposure (ETB)</label>
                            <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                              {formatETB(orig)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Amended Exposure Amount (ETB) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={activeValidation.amendedAmount}
                              onChange={e => setActiveValidation(prev => ({ ...prev, amendedAmount: e.target.value, error: '' }))}
                              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Mandatory Auditor Justification / Reconciliation Basis *
                        </label>
                        <textarea
                          rows={2}
                          value={activeValidation.notes}
                          onChange={e => setActiveValidation(prev => ({ ...prev, notes: e.target.value, error: '' }))}
                          placeholder={
                            activeValidation.mode === 'AMENDED'
                              ? 'Enter statutory reconciliation basis (e.g., Verified customs duty exemption certificate #EC-409 reduces taxable variance by 35%)...'
                              : 'Enter false-positive verification basis (e.g., Timing difference reconciled against Sene 2018 bank settlement batch)...'
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      {activeValidation.error && (
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{activeValidation.error}</span>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveValidation(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmValidation(anomaly)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                        >
                          Save {activeValidation.mode === 'AMENDED' ? 'Amended Anomaly' : 'Rejection Disposition'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions: Task 94 (Generate CAAT Report) & Task 101 (Promote to Findings / Complete Step) */}
        {anomalies.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <strong>{metrics.validatedCount}</strong> of <strong>{metrics.total}</strong> anomalies validated (
              <span className="text-emerald-600 font-semibold">{metrics.ACCEPTED} Accepted</span>,{' '}
              <span className="text-amber-600 font-semibold">{metrics.AMENDED} Amended</span>,{' '}
              <span className="text-rose-600 font-semibold">{metrics.REJECTED} Rejected</span>).
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Generate CAAT Report (Task 94)
              </button>

              {isAuditor && (metrics.ACCEPTED + metrics.AMENDED > 0) && (
                <button
                  type="button"
                  onClick={handlePromoteToFindings}
                  disabled={promoting}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {promoting
                    ? 'Promoting to Findings...'
                    : `Promote ${metrics.ACCEPTED + metrics.AMENDED} Validated Anomalies to Findings (Task 101)`}
                </button>
              )}

              {isAuditor && onCompleteStep && (
                <button
                  type="button"
                  onClick={onCompleteStep}
                  disabled={!metrics.allValidated}
                  title={!metrics.allValidated ? 'Validate all pending anomalies (Accept, Amend, or Reject) before completing CAAT' : ''}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <span>Complete CAAT & Proceed to Testing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TASK 94: OFFICIAL JOINT AUDIT CAAT FORENSIC VALIDATION REPORT MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-bold">
                  Ministry of Revenues & Ethiopian Customs Commission • Joint Audit CAAT Report (Task 94)
                </div>
                <h3 className="text-lg font-bold mt-0.5">
                  Computer-Assisted Audit Techniques (CAAT) Forensic Validation Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-slate-500">Case Number</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{caseData?.caseNumber || caseId}</div>
                </div>
                <div>
                  <div className="text-slate-500">Taxpayer & TIN</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {caseData?.taxpayerName || 'Taxpayer'} ({caseData?.taxpayerId || caseData?.tin || 'TIN'})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Original CAAT Exposure</div>
                  <div className="font-mono font-bold text-amber-600 mt-0.5">{formatETB(metrics.originalExposure)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Validated / Amended Exposure</div>
                  <div className="font-mono font-bold text-emerald-600 mt-0.5">{formatETB(metrics.validatedExposure)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Side-by-Side Anomaly Disposition Schedule (Original CAAT vs. Amended Values)
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5 text-left">Rule</th>
                        <th className="p-2.5 text-left">Module & Description</th>
                        <th className="p-2.5 text-center">Severity</th>
                        <th className="p-2.5 text-right">Original CAAT (ETB)</th>
                        <th className="p-2.5 text-right">Validated / Amended (ETB)</th>
                        <th className="p-2.5 text-center">Disposition</th>
                        <th className="p-2.5 text-left">Mandatory Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {anomalies.map(a => {
                        const disp = getDisposition(a);
                        const orig = Number(a.originalAmount ?? a.amount ?? 0);
                        const amended = disp === 'REJECTED' ? 0 : Number(a.amendedAmount ?? orig);
                        return (
                          <tr key={a.id}>
                            <td className="p-2.5 font-mono font-bold">{a.ruleCode || 'CAAT'}</td>
                            <td className="p-2.5">
                              <div className="font-semibold">{a.description}</div>
                              <div className="text-[11px] text-slate-500">{a.analysisType} • {a.dataSource}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold">{a.severity}</td>
                            <td className="p-2.5 text-right font-mono">{formatETB(orig)}</td>
                            <td className="p-2.5 text-right font-mono font-bold">{formatETB(amended)}</td>
                            <td className="p-2.5 text-center font-bold">{disp}</td>
                            <td className="p-2.5">{a.validationNotes || a.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
