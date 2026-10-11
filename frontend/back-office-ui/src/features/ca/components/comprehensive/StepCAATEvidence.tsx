import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Database,
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  X,
  ExternalLink,
  ShieldCheck,
  Play,
  ArrowRight,
  Filter,
  BarChart3,
  ListFilter,
  Check,
  FileSpreadsheet,
  Layers,
  Terminal,
  Download,
  AlertOctagon,
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Send,
  Flag,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  CAATAuditData,
  CAATAuditRule,
  CAATExceptionItem,
  BenfordDigitStat,
  EvidenceItem,
  AuditProcedure,
  AuditFinding,
  TaxQuery
} from '../../types/audit';

interface StepCAATEvidenceProps {
  caatAudit: CAATAuditData;
  evidenceList: EvidenceItem[];
  procedures: AuditProcedure[];
  onUpdateCAATAudit: (updates: Partial<CAATAuditData>) => Promise<void>;
  onAddEvidence: (item: Partial<EvidenceItem>) => Promise<void>;
  onDeleteEvidence: (id: string) => Promise<void>;
  onTriggerAutosave: () => void;
  onCreateFinding?: (finding: Partial<AuditFinding>) => Promise<void>;
  onCreateQuery?: (query: Partial<TaxQuery>) => Promise<void>;
  onNavigateToStep?: (stepIndex: number) => void;
}

export const StepCAATEvidence: React.FC<StepCAATEvidenceProps> = ({
  caatAudit,
  evidenceList,
  procedures,
  onUpdateCAATAudit,
  onAddEvidence,
  onDeleteEvidence,
  onTriggerAutosave,
  onCreateFinding,
  onCreateQuery,
  onNavigateToStep
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'caat' | 'exceptions' | 'benford' | 'evidence' | 'logs'>('caat');

  // Execution states
  const [isExecutingCAAT, setIsExecutingCAAT] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionPhaseText, setExecutionPhaseText] = useState('');
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [activeRuleRunningId, setActiveRuleRunningId] = useState<string | null>(null);

  // Local state for rules, exceptions, benford stats
  const [caatRules, setCaatRules] = useState<CAATAuditRule[]>(caatAudit.rules || []);
  const [exceptions, setExceptions] = useState<CAATExceptionItem[]>(caatAudit.exceptions || []);
  const [benfordStats, setBenfordStats] = useState<BenfordDigitStat[]>(caatAudit.benfordStats || [
    { digit: 1, expectedPct: 30.1, observedPct: 24.2, observedCount: 1016, isAnomalous: false, deviation: -5.9 },
    { digit: 2, expectedPct: 17.6, observedPct: 16.5, observedCount: 693, isAnomalous: false, deviation: -1.1 },
    { digit: 3, expectedPct: 12.5, observedPct: 11.8, observedCount: 496, isAnomalous: false, deviation: -0.7 },
    { digit: 4, expectedPct: 9.7, observedPct: 9.2, observedCount: 386, isAnomalous: false, deviation: -0.5 },
    { digit: 5, expectedPct: 7.9, observedPct: 8.1, observedCount: 340, isAnomalous: false, deviation: 0.2 },
    { digit: 6, expectedPct: 6.7, observedPct: 6.9, observedCount: 290, isAnomalous: false, deviation: 0.2 },
    { digit: 7, expectedPct: 5.8, observedPct: 12.4, observedCount: 521, isAnomalous: true, deviation: 6.6 },
    { digit: 8, expectedPct: 5.1, observedPct: 8.3, observedCount: 349, isAnomalous: true, deviation: 3.2 },
    { digit: 9, expectedPct: 4.6, observedPct: 2.6, observedCount: 109, isAnomalous: false, deviation: -2.0 }
  ]);
  const [executionLogs, setExecutionLogs] = useState<string[]>(caatAudit.executionLogs || [
    'Initialized ITAS Automated CAAT Engine v4.2 in compliance with SOR FR-04.4-01 & FR-04.4-02.',
    'Extracted 18,160 SAP journal entries, 12,500 TIMS fiscal tokens, and 842 ASYCUDA customs declarations.',
    'Executed Benford First-Digit distribution: Chi-square test rejected null hypothesis (p=0.0012) due to digits 7 & 8 spikes.',
    'Cross-matched Sales Sub-ledger 4000 against TIMS Central Gateway: isolated 16 un-invoiced shipments ($420,000).',
    'Scanned Manual Journal Entries: isolated 7 off-hour adjustments totaling $315,000 without supervisory authorization.',
    'Substantive CAAT testing complete. 110 total exceptions identified with $947,500 tax exposure.'
  ]);

  const [auditorNotes, setAuditorNotes] = useState(caatAudit.auditorNotes || 'CAAT algorithms successfully mined 18,160 transactions, isolating 110 priority exceptions totaling $947,500 in potential tax adjustments.');
  const [samplingMethod, setSamplingMethod] = useState(caatAudit.samplingMethod || 'Stratified Sampling');

  // Filter & Search states for Exceptions Explorer
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuleFilter, setSelectedRuleFilter] = useState('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [selectedTaxHeadFilter, setSelectedTaxHeadFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal states
  const [selectedExceptionDetail, setSelectedExceptionDetail] = useState<CAATExceptionItem | null>(null);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceItem | null>(null);

  // New Rule Form State
  const [newRuleCode, setNewRuleCode] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<CAATAuditRule['category']>('THRESHOLD');
  const [newRuleTargetLedger, setNewRuleTargetLedger] = useState('');
  const [newRuleThreshold, setNewRuleThreshold] = useState(50000);
  const [newRuleDetails, setNewRuleDetails] = useState('');

  // New Evidence Form State
  const [newRef, setNewRef] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSource, setNewSource] = useState('Electronic Invoicing System (TIMS)');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('4.2 MB');
  const [newProcedureId, setNewProcedureId] = useState('');

  // Toast / Banner feedback state
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'info' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Filtered Exceptions
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exc) => {
      const matchesSearch =
        exc.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exc.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exc.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRule = selectedRuleFilter === 'ALL' || exc.ruleCode === selectedRuleFilter;
      const matchesRisk = selectedRiskFilter === 'ALL' || exc.riskLevel === selectedRiskFilter;
      const matchesTaxHead = selectedTaxHeadFilter === 'ALL' || exc.taxHead === selectedTaxHeadFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || exc.status === selectedStatusFilter;

      return matchesSearch && matchesRule && matchesRisk && matchesTaxHead && matchesStatus;
    });
  }, [exceptions, searchTerm, selectedRuleFilter, selectedRiskFilter, selectedTaxHeadFilter, selectedStatusFilter]);

  // Statistics
  const totalMined = caatAudit.totalRecordsMined || 18160;
  const totalFlaggedAmount = exceptions.reduce((sum, e) => (e.status !== 'DISMISSED' ? sum + e.amount : sum), 0);
  const criticalCount = exceptions.filter((e) => e.riskLevel === 'CRITICAL').length;
  const highCount = exceptions.filter((e) => e.riskLevel === 'HIGH').length;
  const pendingCount = exceptions.filter((e) => e.status === 'PENDING_REVIEW').length;

  // --------------------------------------------------------------------------
  // WORKFLOW ACTION 1: Execute CAAT Engine (Multi-Phase Realistic Simulation)
  // --------------------------------------------------------------------------
  const handleExecuteCAAT = async (specificRuleId?: string) => {
    setIsExecutionModalOpen(true);
    setIsExecutingCAAT(true);
    setExecutionProgress(0);
    setActiveRuleRunningId(specificRuleId || null);

    const phases = [
      { pct: 15, text: 'Extracting ERP General Ledgers (SAP FI/CO, 18,160 rows)...', log: 'Ingestion of SAP ERP Financials completed. 18,160 rows staged.' },
      { pct: 35, text: "Applying Benford's Law Chi-Square distribution on 4,200 vendor invoices...", log: "Benford 1st-Digit Chi-Square test: Anomalous digit 7 (+114%) and digit 8 (+63%) detected." },
      { pct: 55, text: 'Cross-referencing 12,500 TIMS Central Electronic Invoicing tokens...', log: 'TIMS Reconciliation: 16 unrecorded bulk dispatches identified totaling $420,000 output VAT exposure.' },
      { pct: 75, text: 'Mining Manual Weekend Journal Adjustments (> $50,000)...', log: 'Off-Hour Scan: 7 Sunday midnight journal entries isolated without supervisor countersignature.' },
      { pct: 90, text: 'Reconciling ASYCUDA Customs Manifests against GL Raw Material Debits...', log: 'Customs Discrepancy: $2,250,000 transfer pricing uplift omitted from import VAT returns.' },
      { pct: 100, text: 'Synthesizing Forensic Results & Updating Case Exception Dossier...', log: 'CAAT Automated Execution Completed successfully in 1.42s.' }
    ];

    let currentLogIndex = 0;
    const interval = setInterval(async () => {
      if (currentLogIndex < phases.length) {
        const currentPhase = phases[currentLogIndex];
        setExecutionProgress(currentPhase.pct);
        setExecutionPhaseText(currentPhase.text);
        setExecutionLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] ${currentPhase.log}`,
          ...prev.slice(0, 19)
        ]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsExecutingCAAT(false);

        // Update rule statuses based on variance
        const updatedRules = caatRules.map((r) => {
          if (specificRuleId && r.id !== specificRuleId) return r;
          return {
            ...r,
            status: r.varianceAmount > 100000 ? ('FLAGGED' as const) : ('VERIFIED' as const),
            lastExecuted: new Date().toISOString()
          };
        });
        setCaatRules(updatedRules);

        await onUpdateCAATAudit({
          rules: updatedRules,
          executionTimestamp: new Date().toISOString(),
          totalRecordsMined: 18160,
          totalFlaggedExposure: 947500,
          exceptions,
          benfordStats,
          executionLogs
        });
        onTriggerAutosave();
        showNotice('CAAT Automated Forensic Engine executed across 18,160 SAP ledger entries.');
      }
    }, 450);
  };

  // --------------------------------------------------------------------------
  // WORKFLOW ACTION 2: Convert Transaction Exception to Formal Finding
  // --------------------------------------------------------------------------
  const handleConvertExceptionToFinding = async (exc: CAATExceptionItem) => {
    if (!onCreateFinding) {
      alert('Finding creation service available in audit file.');
      return;
    }

    const newFindingRef = `FND-CAAT-${exc.ruleCode.split('-')[0]}-${exc.transactionRef.slice(-4)}`;
    const underDeclared = exc.amount;
    const penaltyAmount = Math.round(underDeclared * 0.2); // 20% statutory penalty
    const interestAmount = Math.round(underDeclared * 0.08); // 8% statutory interest
    const totalTaxImpact = underDeclared + penaltyAmount + interestAmount;

    await onCreateFinding({
      reference: newFindingRef,
      auditArea: exc.taxHead === 'VAT' ? 'Value Added Tax (VAT)' : exc.taxHead === 'CIT' ? 'Corporate Income Tax (CIT)' : exc.taxHead === 'WHT' ? 'Withholding Tax (WHT)' : 'Customs & Excise',
      title: `${exc.anomalyType} - ${exc.counterparty} ($${exc.amount.toLocaleString()})`,
      description: `Automated CAAT testing (Rule: ${exc.ruleCode}) on ${exc.accountName} isolated transaction ${exc.transactionRef} dated ${exc.transactionDate} for $${exc.amount.toLocaleString()}. ${exc.details}`,
      condition: `Automated CAAT testing (Rule: ${exc.ruleCode}) on ${exc.accountName} isolated transaction ${exc.transactionRef} dated ${exc.transactionDate} for $${exc.amount.toLocaleString()}. ${exc.details}`,
      criteria: exc.taxHead === 'VAT'
        ? 'Value Added Tax Act Section 12 (Mandatory Electronic Invoicing & Output Tax Invoicing Requirements).'
        : exc.taxHead === 'CIT'
        ? 'Income Tax Act Section 15 (Wholly and Exclusively Incurred Deductibility Standard) and Section 23 (Transfer Pricing Substance).'
        : 'Tax Administration Act Section 83 (Statutory Penalty for Deliberate Tax Evasion).',
      cause: 'Taxpayer internal control breakdown and failure to reconcile physical dispatch logs with central electronic tax gateways.',
      effect: `Loss of statutory public revenue amounting to $${underDeclared.toLocaleString()} plus statutory 20% penalty ($${penaltyAmount.toLocaleString()}) and late interest ($${interestAmount.toLocaleString()}).`,
      underDeclaredAmount: underDeclared,
      penaltyRate: 20,
      penaltyAmount,
      interestAmount,
      totalTaxImpact,
      auditorAnalysis: `CAAT forensic analysis verified source ledger entries against external third-party repositories. Transaction ref ${exc.transactionRef} demonstrates prima facie non-compliance.`,
      conclusion: `Tax adjustment of $${totalTaxImpact.toLocaleString()} recommended for assessment notice determination.`,
      recommendation: `Issue statutory additional assessment for $${totalTaxImpact.toLocaleString()} and mandate automated real-time TIMS gateway integration.`,
      status: 'CONFIRMED',
      isSignificant: exc.riskLevel === 'CRITICAL' || exc.riskLevel === 'HIGH',
      indicatesFraud: exc.riskLevel === 'CRITICAL',
      fraudIndicators: exc.riskLevel === 'CRITICAL' ? 'Off-the-books supply and suppression of electronic fiscal tokens.' : undefined,
      relatedEvidenceIds: []
    });

    // Update exception status locally
    const updatedExceptions = exceptions.map((e) =>
      e.id === exc.id ? { ...e, status: 'FINDING_CREATED' as const, actionTakenNotes: `Converted to Formal Finding ${newFindingRef}` } : e
    );
    setExceptions(updatedExceptions);
    await onUpdateCAATAudit({ exceptions: updatedExceptions });
    onTriggerAutosave();

    showNotice(`Exception ${exc.transactionRef} successfully converted to Formal Finding ${newFindingRef}!`);
  };

  // --------------------------------------------------------------------------
  // WORKFLOW ACTION 3: Escalate Exception to Formal Statutory Tax Query
  // --------------------------------------------------------------------------
  const handleEscalateToQuery = async (exc: CAATExceptionItem) => {
    if (!onCreateQuery) {
      alert('Query creation service available in audit file.');
      return;
    }

    const queryRef = `QRY-CAAT-${exc.transactionRef}`;
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    await onCreateQuery({
      reference: queryRef,
      subject: `Statutory Explanation Demand: ${exc.anomalyType} (${exc.transactionRef})`,
      question: `In accordance with Section 38 of the Tax Administration Act, you are formally required to provide documentary justification for transaction ref ${exc.transactionRef} of $${exc.amount.toLocaleString()} involving ${exc.counterparty} dated ${exc.transactionDate}. Issue identified: ${exc.details}`,
      statutoryBasis: 'Tax Administration Act Section 38 (Power to Call for Records and Require Explanations under Oath).',
      dueDate,
      status: 'OPEN',
      attachedEvidenceIds: []
    });

    const updatedExceptions = exceptions.map((e) =>
      e.id === exc.id ? { ...e, status: 'QUERY_ISSUED' as const, actionTakenNotes: `Statutory Query ${queryRef} issued (14-day reply window)` } : e
    );
    setExceptions(updatedExceptions);
    await onUpdateCAATAudit({ exceptions: updatedExceptions });
    onTriggerAutosave();

    showNotice(`Statutory Query ${queryRef} issued to taxpayer with 14-day response deadline.`);
  };

  // --------------------------------------------------------------------------
  // WORKFLOW ACTION 4: Add Exception as Formal Evidence
  // --------------------------------------------------------------------------
  const handleAddExceptionAsEvidence = async (exc: CAATExceptionItem) => {
    const evRef = `EVD-CAAT-${exc.transactionRef.slice(-6)}`;
    await onAddEvidence({
      reference: evRef,
      description: `CAAT Forensic Ledger Extraction: ${exc.anomalyType} on ${exc.counterparty} ($${exc.amount.toLocaleString()})`,
      source: exc.taxHead === 'CUSTOMS' ? 'Customs Declaration (ASYCUDA)' : exc.taxHead === 'VAT' ? 'Electronic Invoicing System (TIMS)' : 'CAAT Automated Forensic Engine',
      date: exc.transactionDate.split(' ')[0],
      status: 'Verified',
      fileName: `caat_forensic_extract_${exc.transactionRef}.xlsx`,
      fileSize: '1.8 MB',
      fileType: 'application/vnd.ms-excel',
      uploadedBy: 'Lead CAAT Forensic Specialist'
    });

    onTriggerAutosave();
    showNotice(`Transaction ${exc.transactionRef} registered as verified audit evidence (${evRef}).`);
  };

  // --------------------------------------------------------------------------
  // WORKFLOW ACTION 5: Add Custom CAAT Testing Rule
  // --------------------------------------------------------------------------
  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleCode || !newRuleName) return;

    const newRule: CAATAuditRule = {
      id: `CAAT-USR-${Date.now().toString().slice(-4)}`,
      ruleCode: newRuleCode.toUpperCase().trim(),
      ruleName: newRuleName.trim(),
      category: newRuleCategory,
      targetLedger: newRuleTargetLedger.trim() || 'General Ledger Sub-Account',
      sampleSize: 1500,
      discrepanciesCount: 0,
      varianceAmount: 0,
      status: 'VERIFIED',
      thresholdAmount: newRuleThreshold,
      details: newRuleDetails.trim() || 'Custom computerized substantive audit testing rule.'
    };

    const updatedRules = [...caatRules, newRule];
    setCaatRules(updatedRules);
    await onUpdateCAATAudit({ rules: updatedRules });
    onTriggerAutosave();
    setIsAddRuleModalOpen(false);

    // Reset form
    setNewRuleCode('');
    setNewRuleName('');
    setNewRuleTargetLedger('');
    setNewRuleDetails('');
    showNotice(`Custom CAAT Rule ${newRule.ruleCode} configured and ready for execution.`);
  };

  // --------------------------------------------------------------------------
  // Evidence Form Handlers
  // --------------------------------------------------------------------------
  const handleOpenAddEvidence = () => {
    setNewRef(`EVD-2026-${String(evidenceList.length + 1).padStart(3, '0')}`);
    setNewDesc('');
    setNewSource('Electronic Invoicing System (TIMS)');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewFileName('');
    setNewProcedureId(procedures[0]?.id || '');
    setIsAddEvidenceOpen(true);
  };

  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    await onAddEvidence({
      reference: newRef,
      description: newDesc,
      source: newSource,
      date: newDate,
      relatedProcedureId: newProcedureId,
      status: 'Verified',
      fileName: newFileName || 'customs_or_bank_dump.xlsx',
      fileSize: newFileSize || '2.4 MB',
      fileType: 'application/vnd.ms-excel',
      uploadedBy: 'Jane Doe'
    });
    setIsAddEvidenceOpen(false);
    onTriggerAutosave();
    showNotice(`Audit Evidence ${newRef} successfully registered.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className="bg-indigo-900 text-white px-4 py-2.5 rounded shadow-md text-xs font-semibold flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-indigo-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              CAAT Automated Forensic Engine & Substantive Evidence (SOR FR-04.4-01 & FR-04.4-02)
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              CAAT Eligible: YES
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Interoperate with Computer Assisted Audit Techniques, execute Benford's Law anomaly algorithms, match 3rd-party Customs & TIMS datasets, and directly generate formal tax findings from ledger exceptions.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExecuteCAAT()}
            disabled={isExecutingCAAT}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isExecutingCAAT ? 'Mining Ledgers...' : 'Run CAAT Analysis'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddRuleModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded border border-gray-200 shadow-2xs">
          <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider block">Total Mined</span>
          <div className="text-lg font-bold font-mono text-gray-900 mt-0.5">{totalMined.toLocaleString()}</div>
          <span className="text-2xs text-gray-400">SAP entries scanned</span>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200 shadow-2xs">
          <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider block">Rules Executed</span>
          <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">{caatRules.length} Scenarios</div>
          <span className="text-2xs text-gray-400">All tests calibrated</span>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200 shadow-2xs">
          <span className="text-2xs font-bold text-rose-600 uppercase tracking-wider block">Critical Exceptions</span>
          <div className="text-lg font-bold font-mono text-rose-700 mt-0.5">{criticalCount} Priority</div>
          <span className="text-2xs text-gray-400">Immediate adjustments</span>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200 shadow-2xs">
          <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider block">Flagged Exposure</span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">${totalFlaggedAmount.toLocaleString()}</div>
          <span className="text-2xs text-gray-400">Calculated variance</span>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider block">Sampling Mode</span>
          <div className="text-xs font-bold text-gray-900 mt-1 truncate">{samplingMethod}</div>
          <span className="text-2xs text-emerald-700 font-medium">95% Conf / 5% Margin</span>
        </div>
      </div>

      {/* Navigation View Switcher Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('caat')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'caat'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>CAAT Test Rules ({caatRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'exceptions'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span>Transaction Exceptions Explorer ({exceptions.length})</span>
          {pendingCount > 0 && (
            <span className="text-2xs px-1.5 py-0.2 rounded font-mono bg-rose-100 text-rose-800 font-bold">
              {pendingCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('benford')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'benford'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Benford's Law Visualizer</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Evidence Register ({evidenceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Engine Execution Trace ({executionLogs.length})</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: CAAT RULES & ENGINE OVERVIEW */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'caat' && (
        <div className="space-y-5">
          {/* Sampling & Tool Configuration Bar */}
          <div className="bg-white border border-gray-200 rounded p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                  <span>{caatAudit.caatToolName}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] font-mono text-gray-500">
                    Last Run: {new Date(caatAudit.executionTimestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Sampling Strategy: <strong className="text-gray-700">{samplingMethod}</strong> · Automated Ledger Extraction active
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={samplingMethod}
                onChange={(e) => {
                  setSamplingMethod(e.target.value as any);
                  onUpdateCAATAudit({ samplingMethod: e.target.value as any });
                }}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-700 font-medium"
              >
                <option value="Stratified Sampling">Stratified Sampling</option>
                <option value="Random Sampling">Random Sampling</option>
                <option value="Systematic Monetary Unit Sampling">Monetary Unit Sampling</option>
              </select>

              <button
                type="button"
                onClick={() => handleExecuteCAAT()}
                disabled={isExecutingCAAT}
                className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run All CAAT Tests</span>
              </button>
            </div>
          </div>

          {/* CAAT Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caatRules.map((rule) => {
              const isFlagged = rule.status === 'FLAGGED';

              return (
                <div
                  key={rule.id}
                  className={`bg-white border rounded p-4 shadow-2xs space-y-3 transition-all ${
                    isFlagged ? 'border-rose-200 ring-1 ring-rose-100 hover:border-rose-300' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">
                          {rule.ruleCode}
                        </span>
                        {rule.category && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-gray-100 text-gray-600">
                            {rule.category}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 mt-0.5">{rule.ruleName}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isFlagged
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded border border-gray-100 text-[11px] font-mono text-gray-600">
                    Target: {rule.targetLedger}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-gray-100 font-mono">
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block uppercase">Sampled</span>
                      <span className="font-bold text-gray-800">{rule.sampleSize.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block uppercase">Exceptions</span>
                      <span className="font-bold text-rose-700">{rule.discrepanciesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block uppercase">Variance ($)</span>
                      <span className="font-bold text-rose-700">${rule.varianceAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed pt-1 border-t border-gray-100">
                    {rule.details}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRuleFilter(rule.ruleCode);
                        setActiveTab('exceptions');
                      }}
                      className="text-2xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                    >
                      <span>Drill into Exceptions</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecuteCAAT(rule.id)}
                      disabled={isExecutingCAAT}
                      className="px-2.5 py-1 text-2xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-gray-500" />
                      <span>Re-test Rule</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CAAT Auditor Synthesis */}
          <div className="bg-white border border-gray-200 rounded p-4 shadow-2xs space-y-2 text-xs">
            <label className="block font-bold text-gray-800 uppercase text-[11px]">
              CAAT Automated Testing Auditor Evaluation & Legal Conclusion
            </label>
            <textarea
              rows={3}
              value={auditorNotes}
              onChange={(e) => setAuditorNotes(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  await onUpdateCAATAudit({ auditorNotes });
                  onTriggerAutosave();
                  showNotice('CAAT auditor technical evaluation notes saved.');
                }}
                className="px-3.5 py-1.5 bg-indigo-700 text-white rounded text-xs font-semibold hover:bg-indigo-800"
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: TRANSACTION EXCEPTIONS EXPLORER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Ref, Counterparty, Anomaly..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
                {/* Rule filter */}
                <select
                  value={selectedRuleFilter}
                  onChange={(e) => setSelectedRuleFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-xs"
                >
                  <option value="ALL">All CAAT Rules</option>
                  {caatRules.map((r) => (
                    <option key={r.id} value={r.ruleCode}>
                      {r.ruleCode}
                    </option>
                  ))}
                </select>

                {/* Risk filter */}
                <select
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-xs"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                {/* Tax Head filter */}
                <select
                  value={selectedTaxHeadFilter}
                  onChange={(e) => setSelectedTaxHeadFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-xs"
                >
                  <option value="ALL">All Tax Heads</option>
                  <option value="VAT">VAT</option>
                  <option value="CIT">CIT</option>
                  <option value="WHT">WHT</option>
                  <option value="CUSTOMS">Customs</option>
                  <option value="PAYE">PAYE</option>
                </select>

                {/* Status filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="FINDING_CREATED">Finding Created</option>
                  <option value="QUERY_ISSUED">Query Issued</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>

                {(searchTerm || selectedRuleFilter !== 'ALL' || selectedRiskFilter !== 'ALL' || selectedTaxHeadFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedRuleFilter('ALL');
                      setSelectedRiskFilter('ALL');
                      setSelectedTaxHeadFilter('ALL');
                      setSelectedStatusFilter('ALL');
                    }}
                    className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-300 rounded"
                    title="Reset filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-2xs text-gray-500 font-mono pt-1 border-t border-gray-100">
              <span>Showing {filteredExceptions.length} of {exceptions.length} isolated transactions</span>
              <span className="text-indigo-700 font-semibold">
                Exposure: ${filteredExceptions.reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Exceptions Table */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Ref & Date</th>
                    <th className="py-2.5 px-3">Account & Counterparty</th>
                    <th className="py-2.5 px-3">Anomaly Type & Cause</th>
                    <th className="py-2.5 px-3 text-right">Amount ($)</th>
                    <th className="py-2.5 px-3 text-center">Tax Head</th>
                    <th className="py-2.5 px-3 text-center">Risk</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Auditor Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExceptions.map((exc) => {
                    const isCritical = exc.riskLevel === 'CRITICAL';
                    const isHigh = exc.riskLevel === 'HIGH';

                    return (
                      <tr key={exc.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-indigo-700 block">{exc.transactionRef}</span>
                          <span className="text-[11px] font-mono text-gray-500">{exc.transactionDate}</span>
                          <span className="text-[10px] font-mono text-gray-400 block">{exc.ruleCode}</span>
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <span className="font-bold text-gray-900 block truncate">{exc.counterparty}</span>
                          <span className="text-[11px] text-gray-500 font-mono block truncate">{exc.accountName}</span>
                        </td>

                        <td className="py-3 px-3 max-w-sm">
                          <span className="font-semibold text-gray-900 block">{exc.anomalyType}</span>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{exc.details}</p>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                          ${exc.amount.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {exc.taxHead}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isCritical
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : isHigh
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {exc.riskLevel}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              exc.status === 'FINDING_CREATED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : exc.status === 'QUERY_ISSUED'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : exc.status === 'DISMISSED'
                                ? 'bg-gray-100 text-gray-500 border-gray-300'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {exc.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Convert to finding */}
                            {exc.status !== 'FINDING_CREATED' && (
                              <button
                                onClick={() => handleConvertExceptionToFinding(exc)}
                                className="px-2 py-1 text-2xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 flex items-center gap-1"
                                title="Convert to Formal Audit Finding"
                              >
                                <Flag className="w-3 h-3 text-indigo-600" />
                                <span>Create Finding</span>
                              </button>
                            )}

                            {/* Escalate to Query */}
                            {exc.status !== 'QUERY_ISSUED' && exc.status !== 'FINDING_CREATED' && (
                              <button
                                onClick={() => handleEscalateToQuery(exc)}
                                className="px-2 py-1 text-2xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 flex items-center gap-1"
                                title="Issue Statutory Tax Query"
                              >
                                <Send className="w-3 h-3 text-purple-600" />
                                <span>Issue Query</span>
                              </button>
                            )}

                            {/* Add as Evidence */}
                            <button
                              onClick={() => handleAddExceptionAsEvidence(exc)}
                              className="p-1 text-gray-400 hover:text-indigo-600 rounded border border-gray-200"
                              title="Register as Audit Evidence"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* View Detail Modal */}
                            <button
                              onClick={() => setSelectedExceptionDetail(exc)}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded border border-gray-200"
                              title="Inspect full transaction details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: BENFORD'S LAW VISUALIZER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'benford' && (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white p-5 rounded border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-700" />
                  Benford's Law First-Digit Statistical Distribution
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Natural non-fabricated financial distributions follow Log10(1 + 1/d). Deviations exceeding critical limits indicate manual manipulation, fraud, or artificial threshold splitting.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  Chi-Square: 38.42 (p = 0.0012 · Reject Null Hypothesis)
                </span>
              </div>
            </div>

            {/* Distribution Visual Chart */}
            <div className="pt-2">
              <div className="grid grid-cols-9 gap-2">
                {benfordStats.map((stat) => {
                  const maxVal = 35;
                  const expHeight = (stat.expectedPct / maxVal) * 100;
                  const obsHeight = (stat.observedPct / maxVal) * 100;

                  return (
                    <div key={stat.digit} className="flex flex-col items-center">
                      {/* Bar comparison area */}
                      <div className="h-44 w-full bg-gray-50 rounded border border-gray-200 flex items-end justify-center p-1.5 gap-1.5 relative">
                        {/* Expected bar */}
                        <div
                          style={{ height: `${expHeight}%` }}
                          className="w-1/2 bg-gray-300 rounded-t transition-all"
                          title={`Expected: ${stat.expectedPct}%`}
                        />

                        {/* Observed bar */}
                        <div
                          style={{ height: `${obsHeight}%` }}
                          className={`w-1/2 rounded-t transition-all ${
                            stat.isAnomalous ? 'bg-rose-600 shadow-xs' : 'bg-indigo-600'
                          }`}
                          title={`Observed: ${stat.observedPct}% (${stat.observedCount} invoices)`}
                        />
                      </div>

                      {/* Digit label & stats */}
                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold font-mono text-gray-900 block">Digit {stat.digit}</span>
                        <div className="text-[10px] font-mono mt-0.5">
                          <span className="text-gray-500">{stat.expectedPct}% exp</span>
                          <span
                            className={`block font-bold ${
                              stat.isAnomalous ? 'text-rose-700' : 'text-indigo-700'
                            }`}
                          >
                            {stat.observedPct}% obs
                          </span>
                        </div>
                        {stat.isAnomalous && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 mt-1 block">
                            +{stat.deviation}% Spike
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-gray-300" />
                  <span>Theoretical Benford Distribution</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-indigo-600" />
                  <span>Auditee General Ledger Observed Distribution</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-rose-600" />
                  <span>Statistically Anomalous Cluster (Fraud Risk)</span>
                </div>
              </div>
            </div>

            {/* Forensic Explanation Callout */}
            <div className="p-3.5 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Forensic Interpretation for Working Papers (WP-CAAT-01)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
                The massive clustering at First-Digit 7 (12.4% observed vs 5.8% expected, +114% excess) corresponds to offshore consulting invoices structured between $70,000 and $79,900. These transactions systematically stop right before the $80,000 threshold requiring mandatory Board Audit Committee pre-clearance and non-resident withholding tax deduction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: EVIDENCE REGISTER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">
              3rd-Party Customs ASYCUDA, Central TIMS, and Commercial Bank Data
            </span>
            <button
              onClick={handleOpenAddEvidence}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Evidence File</span>
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Ref</th>
                    <th className="py-2.5 px-4">Description & File</th>
                    <th className="py-2.5 px-4">Data Source</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evidenceList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {item.reference}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <span className="font-semibold text-gray-900 block">{item.description}</span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono mt-0.5">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span>{item.fileName}</span>
                          <span className="text-gray-300">·</span>
                          <span>{item.fileSize}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">
                        {item.source}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewEvidence(item)}
                            className="p-1 text-gray-500 hover:text-indigo-600 rounded"
                            title="Preview evidence"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove evidence ${item.reference}?`)) {
                                onDeleteEvidence(item.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded"
                            title="Delete evidence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: EXECUTION LOGS & TRACE */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-lg p-5 font-mono text-xs text-emerald-400 shadow-md space-y-2 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400 text-2xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>ITAS CAAT Engine Machine Log Terminal (ISO 27037 Compliant)</span>
              </div>
              <span>Hash Algorithm: SHA-256</span>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pt-2">
              {executionLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-slate-600 select-none">{String(index + 1).padStart(2, '0')}.</span>
                  <span className="text-slate-200">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: REAL-TIME CAAT ENGINE EXECUTION SIMULATION */}
      {/* --------------------------------------------------------------------- */}
      {isExecutionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-300" />
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  Automated CAAT Forensic Engine Running
                </h4>
              </div>
              {!isExecutingCAAT && (
                <button
                  onClick={() => setIsExecutionModalOpen(false)}
                  className="text-indigo-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div>
                <div className="flex justify-between text-2xs font-mono font-bold text-gray-600 mb-1">
                  <span>{executionPhaseText || 'Initializing algorithms...'}</span>
                  <span>{executionProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div
                    style={{ width: `${executionProgress}%` }}
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="space-y-2 font-mono text-[11px] bg-gray-50 p-3 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  {executionProgress >= 25 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  <span className={executionProgress >= 25 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                    SAP General Ledger Ingestion (18,160 rows)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {executionProgress >= 50 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  <span className={executionProgress >= 50 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                    Benford's Law Chi-Square First-Digit Analytics
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {executionProgress >= 75 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  <span className={executionProgress >= 75 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                    TIMS Central E-Invoicing & Customs Reconciliation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {executionProgress >= 100 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  <span className={executionProgress >= 100 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                    Off-Hour Journal Adjustments & Risk Synthesis
                  </span>
                </div>
              </div>

              {!isExecutingCAAT && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>CAAT Execution Completed Successfully!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Mined 18,160 transactions, verified 7 computerized audit rules, and isolated 110 priority exceptions with $947,500 potential exposure.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                {!isExecutingCAAT ? (
                  <>
                    <button
                      onClick={() => {
                        setIsExecutionModalOpen(false);
                        setActiveTab('exceptions');
                      }}
                      className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>Explore Flagged Exceptions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsExecutionModalOpen(false)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <span className="text-2xs text-gray-400 font-mono flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    Processing ledger data...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: CONFIGURE CUSTOM CAAT RULE */}
      {/* --------------------------------------------------------------------- */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Configure Custom Computer-Assisted Audit Technique
              </h4>
              <button onClick={() => setIsAddRuleModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRuleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAAT-WHT-DIV"
                    value={newRuleCode}
                    onChange={(e) => setNewRuleCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Testing Category *</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-xs"
                  >
                    <option value="BENFORD">Benford Distribution</option>
                    <option value="E_INVOICING">E-Invoicing / TIMS Gaps</option>
                    <option value="PAYROLL">Payroll & Biometrics</option>
                    <option value="JOURNAL_ENTRIES">Manual Journal Postings</option>
                    <option value="THRESHOLD">Approval Threshold Evasions</option>
                    <option value="CUSTOMS">ASYCUDA Customs CIF Matches</option>
                    <option value="DUPLICATES">Duplicate Payments</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Rule Name / Objective *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Undisclosed Intercompany Dividend Distributions"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Target ERP Sub-Ledger *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Account 3200 - Retained Earnings"
                    value={newRuleTargetLedger}
                    onChange={(e) => setNewRuleTargetLedger(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Materiality Threshold ($)</label>
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Testing Criteria & Algorithm Details</label>
                <textarea
                  rows={3}
                  placeholder="Detail anomaly detection logic, e.g. Flag debit entries without matching WHT returns..."
                  value={newRuleDetails}
                  onChange={(e) => setNewRuleDetails(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-bold"
                >
                  Save & Stage Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: EXCEPTION DETAIL INSPECTOR */}
      {/* --------------------------------------------------------------------- */}
      {selectedExceptionDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden text-xs">
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-400" />
                <span className="font-mono font-bold">{selectedExceptionDetail.transactionRef}</span>
              </div>
              <button onClick={() => setSelectedExceptionDetail(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-2xs font-bold text-gray-400 uppercase tracking-wider block">Counterparty</span>
                <div className="text-sm font-bold text-gray-900 mt-0.5">{selectedExceptionDetail.counterparty}</div>
                <div className="text-[11px] font-mono text-gray-500">{selectedExceptionDetail.accountName}</div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded border border-gray-200 font-mono">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">Amount</span>
                  <span className="font-bold text-gray-900">${selectedExceptionDetail.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">Date</span>
                  <span className="text-gray-800">{selectedExceptionDetail.transactionDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">Tax Head</span>
                  <span className="text-indigo-700 font-bold">{selectedExceptionDetail.taxHead}</span>
                </div>
              </div>

              <div>
                <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Forensic Anomaly Details
                </span>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                  {selectedExceptionDetail.details}
                </p>
              </div>

              {selectedExceptionDetail.actionTakenNotes && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-900">
                  <span className="font-bold block text-2xs uppercase">Action History</span>
                  <span>{selectedExceptionDetail.actionTakenNotes}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedExceptionDetail(null)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleConvertExceptionToFinding(selectedExceptionDetail);
                      setSelectedExceptionDetail(null);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-700 text-white rounded font-bold hover:bg-indigo-800 flex items-center gap-1"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Create Finding</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 4: ADD EVIDENCE MODAL */}
      {/* --------------------------------------------------------------------- */}
      {isAddEvidenceOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Register Comprehensive Audit Evidence
              </h4>
              <button onClick={() => setIsAddEvidenceOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEvidenceSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Evidence Reference *</label>
                  <input
                    type="text"
                    required
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Date Obtained *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="E.g. ASYCUDA Customs Manifests for 842 crude polymer shipments..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Evidence Source *</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white"
                >
                  <option value="Customs Declaration (ASYCUDA)">Customs Declaration (ASYCUDA)</option>
                  <option value="Electronic Invoicing System (TIMS)">Electronic Invoicing System (TIMS)</option>
                  <option value="Third-Party Bank Confirmation">Third-Party Bank Confirmation</option>
                  <option value="Taxpayer Submission">Taxpayer Submission</option>
                  <option value="Withholding Tax Returns (WHT)">Withholding Tax Returns (WHT)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Upload File Simulation</label>
                <input
                  type="text"
                  placeholder="filename.xlsx / pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEvidenceOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-semibold"
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 5: EVIDENCE PREVIEW MODAL */}
      {/* --------------------------------------------------------------------- */}
      {previewEvidence && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 p-6 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-mono font-bold text-indigo-700 text-sm">{previewEvidence.reference}</span>
              <button onClick={() => setPreviewEvidence(null)} className="text-gray-400">×</button>
            </div>
            <p className="font-semibold text-gray-900">{previewEvidence.description}</p>
            <div className="bg-gray-50 p-3 rounded font-mono text-[11px] space-y-1">
              <div>Source: {previewEvidence.source}</div>
              <div>File: {previewEvidence.fileName} ({previewEvidence.fileSize})</div>
              <div>Date: {previewEvidence.date}</div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setPreviewEvidence(null)} className="px-4 py-1.5 bg-gray-800 text-white rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
