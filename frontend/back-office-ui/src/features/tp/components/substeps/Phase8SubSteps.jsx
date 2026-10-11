import React, { useState } from 'react';
import { 
  CheckCircle2, FileText, Award, ShieldCheck, DollarSign, 
  Landmark, Database, Shield, Lock, Check, ArrowRight, 
  ExternalLink, Download, Printer, UserCheck, AlertOctagon,
  FolderArchive, Cpu, BookOpen, RefreshCw
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select } from '../../../../components/ui/index.jsx';

// Default Settlement Vouchers
const DEFAULT_VOUCHERS = [
  {
    ref: 'CBE-DEP-2026-9041238',
    type: '25% Mandatory Statutory Deposit (Art. 99(2))',
    bank: 'Commercial Bank of Ethiopia (Finfine Branch)',
    date: '2026-10-08',
    amount: 10141875,
    status: 'CLEARED_RECONCILED'
  },
  {
    ref: 'CBE-DEP-2026-9812401',
    type: 'Final Balance Settlement (Determination Order)',
    bank: 'Commercial Bank of Ethiopia (Finfine Branch)',
    date: '2026-10-26',
    amount: 29708125,
    status: 'CLEARED_RECONCILED'
  }
];

export default function Phase8SubSteps({
  subStepId,
  onSelectSubStep,
  onProceedToPhase,
  isReadOnly,
  fullState,
  completedSubSteps = [],
  onToggleComplete,
  saving,
  executeApiAction,
  onClose,
  onRefresh
}) {
  const isDone = completedSubSteps.includes(subStepId);

  // Local state
  const [vouchers, setVouchers] = useState(DEFAULT_VOUCHERS);
  const totalRemitted = vouchers.reduce((acc, v) => acc + v.amount, 0); // 39,850,000

  // Sub-step navigation helper
  const navigateSubStep = (step) => {
    if (onSelectSubStep) onSelectSubStep(step);
  };

  // ==============================================================
  // 8.1 Collection Order & Revenue Remittance Verification
  // ==============================================================
  if (subStepId === '8.1') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 8.1 Revenue Collection
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 102
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Landmark className="text-emerald-600 dark:text-emerald-400" size={18} />
            Treasury Remittance & Collection Order Verification (ETB 39,850,000)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Audit closure requires 100% reconciliation of all assessed taxes, penalties, and interest into Ministry 
            of Revenues central treasury accounts prior to releasing the audit file.
          </p>
        </div>

        {/* Bank Payment Vouchers Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Treasury Settlement Vouchers (Commercial Bank of Ethiopia)
            </h4>
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
              100% Reconciled
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Deposit Ref</th>
                  <th className="p-3">Payment Description</th>
                  <th className="p-3">Bank Branch</th>
                  <th className="p-3">Remittance Date</th>
                  <th className="p-3 text-right">Amount (ETB)</th>
                  <th className="p-3 text-center">Reconciliation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {vouchers.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600">{v.ref}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{v.type}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{v.bank}</td>
                    <td className="p-3 font-mono text-slate-500">{v.date}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {v.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Cleared & Verified ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="p-3 uppercase">Total Treasury Collection Remitted</td>
                  <td className="p-3 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">
                    ETB {totalRemitted.toLocaleString()}
                  </td>
                  <td className="p-3 text-center text-emerald-600">Reconciled in ITAS</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProceedToPhase && onProceedToPhase('NOTICE')}
            className="text-xs"
          >
            ← Back to Phase 7: Notice & Objection
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/revenue-reconciliation', {
                  vouchers,
                  totalRemitted,
                  subStep: '8.1',
                  status: 'COMPLETED'
                }, 'Revenue remittance reconciled and verified.');
                onToggleComplete('8.1', !isDone, { totalRemitted });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 8.1 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 8.1 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('8.2')}
              className="text-xs"
            >
              Continue to 8.2 Tax Clearance <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 8.2 Tax Clearance / Audit Concluded Certificate
  // ==============================================================
  if (subStepId === '8.2') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 8.2 Clearance
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Federal Democratic Republic of Ethiopia Ministry of Revenues
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Award className="text-emerald-600 dark:text-emerald-400" size={18} />
            Official Certificate of Transfer Pricing Audit Conclusion & Tax Clearance
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Official certificate confirming the conclusion of transfer pricing audit proceedings and 
            discharging the taxpayer from further transfer pricing reassessments for FY 2020 through FY 2024.
          </p>
        </div>

        {/* Official Certificate Document Preview */}
        <div className="border-4 border-amber-300 dark:border-amber-700 rounded-3xl bg-gradient-to-b from-amber-50/20 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-8 shadow-2xl space-y-6 max-w-3xl mx-auto relative overflow-hidden">
          {/* Security Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Shield size={320} />
          </div>

          <div className="text-center space-y-2 border-b-2 border-amber-200 dark:border-amber-800 pb-4">
            <div className="inline-block px-4 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full uppercase tracking-widest">
              Federal Democratic Republic of Ethiopia • Ministry of Revenues
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide pt-2">
              CERTIFICATE OF TRANSFER PRICING AUDIT CONCLUSION
            </h1>
            <p className="text-xs font-mono text-amber-700 dark:text-amber-400 font-bold">
              Certificate Serial Ref: MOR-TPA-CLEAR-2026-0041
            </p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 text-center max-w-xl mx-auto font-serif">
            <p>
              THIS IS TO CERTIFY that the Transfer Pricing Directorate has officially concluded its statutory 
              audit examination of <strong>Apex Healthcare Ethiopia SC</strong> (TIN: <code>0002847192</code>) 
              for the audited tax years covering <strong>FY 2020 through FY 2024 (EFY 2012 - EFY 2016)</strong>.
            </p>
            <p>
              All transfer pricing adjustments, corporate income tax liabilities, statutory under-declaration penalties, 
              and accrued late interest totaling <strong>ETB 39,850,000.00</strong> have been fully determined and 
              remitted into the public treasury under reconciliation code <code>ITAS-RECON-2026-99214</code>.
            </p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Pursuant to Article 27 of Proclamation No. 979/2016, the taxpayer’s accounts for the audited periods are hereby 
              closed and discharged from further transfer pricing audit proceedings.
            </p>
          </div>

          <div className="border-t-2 border-amber-200 dark:border-amber-800 pt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="text-left space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Conclusion</span>
              <strong className="text-slate-900 dark:text-white font-mono">28 October 2026</strong>
              <p className="text-[10px] text-slate-500">Addis Ababa, Ethiopia</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Seal & Signature</span>
              <strong className="text-slate-900 dark:text-white">Director, Large Taxpayers Office</strong>
              <p className="text-[10px] text-emerald-600 font-mono font-bold">Digital PKI Seal Verified ✓</p>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('8.1')}
            className="text-xs"
          >
            ← Back to 8.1 Collection
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/tax-clearance', {
                  subStep: '8.2',
                  status: 'COMPLETED'
                }, 'Tax Clearance Certificate issued.');
                onToggleComplete('8.2', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 8.2 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 8.2 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('8.3')}
              className="text-xs"
            >
              Continue to 8.3 Risk Profile Update <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 8.3 Risk Profile & Machine Learning Update
  // ==============================================================
  if (subStepId === '8.3') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
              Phase 8.3 Risk Intelligence
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Central ITAS Machine Learning Risk Engine
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Cpu className="text-purple-600 dark:text-purple-400" size={18} />
            Risk Profile & Machine Learning Risk Engine Ingestion
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Post-audit findings and verified profit-shifting typologies are ingested into the central risk scoring engine 
            to update the taxpayer’s risk rating and calibrate automated risk algorithms for the pharmaceutical sector.
          </p>
        </div>

        {/* Risk Metrics Comparison Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Taxpayer Risk Profile Evolution
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 space-y-1">
              <span className="text-[10px] font-bold text-red-600 uppercase block">Pre-Audit Risk Score</span>
              <strong className="text-2xl font-bold font-mono text-red-600">88 / 100</strong>
              <span className="text-[11px] text-red-700 block">High Risk (Aggressive Profit Shifting)</span>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">Post-Audit Risk Score</span>
              <strong className="text-2xl font-bold font-mono text-emerald-600">28 / 100</strong>
              <span className="text-[11px] text-emerald-700 block">Monitored Compliant (Settled & Calibrated)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-2">
            <strong className="text-slate-900 dark:text-white block">Automated Surveillance Flags Configured:</strong>
            <p className="text-slate-600 dark:text-slate-400">
              • Automatic flag if intercompany management fee deductions exceed 2% of turnover in future tax filings.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              • Automated benchmark check against 6.40% median operating margin on Schedule 5 declarations.
            </p>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('8.2')}
            className="text-xs"
          >
            ← Back to 8.2 Tax Clearance
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/risk-engine-update', {
                  subStep: '8.3',
                  status: 'COMPLETED'
                }, 'Risk Engine updated with case findings.');
                onToggleComplete('8.3', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 8.3 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 8.3 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('8.4')}
              className="text-xs"
            >
              Continue to 8.4 Lessons Learned <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 8.4 Lessons Learned & Directives Feedback
  // ==============================================================
  if (subStepId === '8.4') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-sky-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Phase 8.4 Policy Feedback
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              MoR Tax Policy & Legislation Directorate
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" size={18} />
            Lessons Learned & Policy Recommendations for TP Directives
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Practical audit insights regarding data limitations, foreign exchange safe harbors, and statutory management 
            fee deduction caps forwarded to the Ministry of Finance and MoR Tax Policy Directorate.
          </p>
        </div>

        {/* Policy Recommendations Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recommendations for Future Regulatory Directives
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong className="text-slate-900 dark:text-white block">1. Statutory Ceiling on Intra-Group Management Fees</strong>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Recommend amending Directive No. 43/2015 to enact a quantitative cap (maximum 2% of EBITDA) on deductible 
                headquarter management charges to curb conduit profit shifting to tax havens.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong className="text-slate-900 dark:text-white block">2. Standardized Pan-African Comparable Database Subscriptions</strong>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Institutionalize access to Bureau van Dijk Orbis and TP Catalyst across all audit teams to eliminate taxpayer 
                comparability challenges during objection hearings.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong className="text-slate-900 dark:text-white block">3. Foreign Exchange Allocation Safe Harbor Rules</strong>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Clarify statutory rules defining which entity must bear currency depreciation risk in contract toll-manufacturing agreements.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('8.3')}
            className="text-xs"
          >
            ← Back to 8.3 Risk Profile
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/lessons-learned', {
                  subStep: '8.4',
                  status: 'COMPLETED'
                }, 'Policy feedback and lessons learned recorded.');
                onToggleComplete('8.4', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 8.4 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 8.4 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('8.5')}
              className="text-xs"
            >
              Continue to 8.5 Dossier Archival <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 8.5 Complete Digital Audit Dossier Archival
  // ==============================================================
  if (subStepId === '8.5') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 8.5 Archival
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 45 (10-Year Record Retention)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FolderArchive className="text-blue-600 dark:text-blue-400" size={18} />
            Complete Digital Audit Dossier Archival & Cryptographic Seal
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 45, all audit evidence, workpapers, minutes, and notices must be archived in a tamper-evident 
            encrypted digital repository with a mandatory 10-year retention lock.
          </p>
        </div>

        {/* Digital Archive Package Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Digital Dossier Archive Package (62 Documents Across 8 Phases)
              </h4>
              <p className="text-[11px] text-slate-500">
                Encrypted with AES-256 and locked under statutory retention rules
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Cryptographically Sealed ✓
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">SHA-256 Verification Checksum</span>
            <code className="text-[11px] font-mono text-blue-600 dark:text-blue-400 block break-all">
              9f83a21b4e5d6c7e8a90123456789abcdef0123456789abcdef0123456789abc
            </code>
            <span className="text-[10px] text-slate-500 block pt-1">
              Retention Expiry: <strong>28 October 2036 (10-Year Statutory Period)</strong>
            </span>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('8.4')}
            className="text-xs"
          >
            ← Back to 8.4 Lessons Learned
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/archive-dossier', {
                  subStep: '8.5',
                  status: 'COMPLETED'
                }, 'Digital Audit Dossier sealed and archived.');
                onToggleComplete('8.5', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 8.5 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 8.5 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('8.6')}
              className="text-xs"
            >
              Continue to 8.6 Final Sign-Off <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 8.6 Final Supervisory Sign-Off & Case Status CONCLUDED
  // ==============================================================
  if (subStepId === '8.6') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 8.6 Case Conclusion
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Final Executive Close-Out Memorandum
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
            Final Supervisory Sign-Off & Case Formal Conclusion
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Executing this step marks all 8 phases and 48 sub-steps complete. 
            The case lifecycle transitions to <strong className="text-emerald-700 dark:text-emerald-300">CONCLUDED</strong>.
          </p>
        </div>

        {/* Case Close-Out Summary Card */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-indigo-800/60 pb-4">
            <div>
              <h2 className="text-base font-bold tracking-wide">
                TRANSFER PRICING AUDIT CASE DISPOSITION
              </h2>
              <p className="text-xs text-indigo-300 font-mono">
                Taxpayer: Apex Healthcare Ethiopia SC • TIN: 0002847192
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
              CONCLUDED ✓
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[10px] text-indigo-300 uppercase block font-bold">Total Base Adjusted</span>
              <strong className="text-base font-mono block mt-1">ETB 64,850,000</strong>
            </div>

            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[10px] text-indigo-300 uppercase font-bold block">Tax Collected</span>
              <strong className="text-base font-mono block mt-1">ETB 22,090,000</strong>
            </div>

            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[10px] text-indigo-300 uppercase font-bold block">Penalties & Interest</span>
              <strong className="text-base font-mono block mt-1">ETB 17,760,000</strong>
            </div>

            <div className="p-3 bg-emerald-500/20 rounded-xl backdrop-blur-sm border border-emerald-400/30">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Total Remitted</span>
              <strong className="text-base font-mono text-emerald-300 block mt-1">ETB 39,850,000</strong>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 leading-relaxed font-serif text-center">
            "All statutory requirements under Proclamation No. 979/2016, Transfer Pricing Directive No. 43/2015, 
            and Tax Administration Proclamation No. 983/2016 have been executed with strict procedural regularity. 
            The case file is formally closed and archived."
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={async () => {
                await executeApiAction('/close', {
                  concluded: true,
                  subStep: '8.6',
                  status: 'CONCLUDED'
                }, 'Case status successfully transitioned to CONCLUDED!');
                onToggleComplete('8.6', true);
                if (onRefresh) onRefresh();
              }}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-lg text-sm w-full sm:w-auto"
            >
              <CheckCircle2 size={18} className="mr-2" />
              Finalize & Conclude Case File
            </Button>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('8.5')}
            className="text-xs"
          >
            ← Back to 8.5 Dossier Archival
          </Button>

          <span className="text-xs text-emerald-600 font-bold">
            All 8 Phases & 48 Sub-Steps Fully Completed ✓
          </span>
        </div>
      </div>
    );
  }

  return null;
}
