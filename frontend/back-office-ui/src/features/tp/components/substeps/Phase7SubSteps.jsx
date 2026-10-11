import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, AlertTriangle, Scale, Clock, 
  Check, ArrowRight, ShieldCheck, Landmark, DollarSign,
  AlertOctagon, UserCheck, MessageSquare, Award, Eye, 
  Calendar, FileCheck, Building2, Send, Download
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select } from '../../../../components/ui/index.jsx';

// Default Objection Grounds
const DEFAULT_OBJECTION_GROUNDS = [
  {
    id: 'obj-1',
    groundTitle: 'Ground 1: Challenge against TNMM in Favor of Transactional CUP',
    category: 'METHODOLOGY',
    disputedTax: 12500000,
    taxpayerMemorial: 'Taxpayer asserts that customs prices for identical generic active ingredients imported into Kenya should have been adopted as external CUP under Directive 43/2015 Art. 5(1)(a), rather than applying TNMM net margin benchmarking.',
    auditorRejoinder: 'UNSUSTAINABLE. Directive No. 43/2015 Art. 5 strictly establishes that CUP requires high product comparability and market parity. Cross-border wholesale prices into Kenya cannot satisfy comparability criteria without material adjustments for customs duties, transport infrastructure, and price regulation which cannot be reliably quantified. TNMM remains the statutory MAM.',
    committeeRuling: 'DISMISSED — TNMM Upheld as Most Appropriate Method'
  },
  {
    id: 'obj-2',
    groundTitle: 'Ground 2: Challenge against Disallowance of Mauritius Management Fee',
    category: 'INTRA_GROUP_SERVICES',
    disputedTax: 11550000,
    taxpayerMemorial: 'Taxpayer contends that headquarter strategic management, global IT software access, and brand governance provided vital commercial synergies to the Ethiopian affiliate. Disallowance under Art. 13 is arbitrary.',
    auditorRejoinder: 'UNSUSTAINABLE. Article 13 places the statutory burden of proof squarely on the taxpayer to prove that actual economic services were rendered. The taxpayer failed to provide a single timesheet, activity log, or cost-allocation key. Charging a flat 8.5% turnover surcharge represents profit extraction, not payment for actual services rendered.',
    committeeRuling: 'DISMISSED — Disallowance Upheld in Full'
  },
  {
    id: 'obj-3',
    groundTitle: 'Ground 3: Petition for Penalty Relief under Article 105(2)',
    category: 'PENALTIES',
    disputedTax: 10077500,
    taxpayerMemorial: 'Taxpayer argues that transfer pricing is not an exact science and the company acted in good faith based on OECD Transfer Pricing documentation prepared by professional tax advisors. Requests full waiver of the 50% penalty down to 0% or 10%.',
    auditorRejoinder: 'PARTIALLY MODIFIED. Article 105(2) mandates a 50% penalty for substantial understatement (>25% of tax liability). However, taking into account the taxpayer’s cooperation in providing audited segmental accounts and paying the mandatory 25% deposit promptly, the Committee has discretion to mitigate ancillary documentation surcharges by ETB 717,500.',
    committeeRuling: 'PARTIALLY SUSTAINED — Ancillary Penalty Relieved by ETB 717,500; 50% Core Penalty Upheld'
  }
];

export default function Phase7SubSteps({
  subStepId,
  onSelectSubStep,
  onProceedToPhase,
  isReadOnly,
  fullState,
  completedSubSteps = [],
  onToggleComplete,
  saving,
  executeApiAction
}) {
  const isDone = completedSubSteps.includes(subStepId);

  // Local state
  const [serviceDate, setServiceDate] = useState('2026-09-28');
  const [serviceMethod, setServiceMethod] = useState('Court Bailiff Hand Delivery & ITAS Electronic Portal');
  const [recipientOfficer, setRecipientOfficer] = useState('W/ro Bethlehem Girma (CFO) & Ato Dawit Tadesse (MD)');
  const [bailiffCertRef, setBailiffCertRef] = useState('BLF-AA-2026-8812');

  // Article 99(2) 25% Statutory Deposit State
  const [depositAmount, setDepositAmount] = useState(10141875); // 25% of ETB 40,567,500
  const [depositSlipRef, setDepositSlipRef] = useState('CBE-DEP-2026-9041238');
  const [depositDate, setDepositDate] = useState('2026-10-08');
  const [depositStatus, setDepositStatus] = useState('VERIFIED_TREASURY');

  // Objection grounds state
  const [objectionGrounds, setObjectionGrounds] = useState(DEFAULT_OBJECTION_GROUNDS);

  // Final Administrative Determination
  const [revisedLiability, setRevisedLiability] = useState(39850000); // ETB 40.56M - ETB 717.5K penalty relief
  const [determinationDate, setDeterminationDate] = useState('2026-10-22');

  // Sub-step navigation helper
  const navigateSubStep = (step) => {
    if (onSelectSubStep) onSelectSubStep(step);
  };

  // ==============================================================
  // 7.1 Formal Notice Service & Proof of Delivery
  // ==============================================================
  if (subStepId === '7.1') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 7.1 Formal Service
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 108 & 99
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-400" size={18} />
            Statutory Notice Service, Proof of Delivery & 30-Day Objection Window
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 108, formal notice service must be verified by a signed bailiff return or electronic ITAS acknowledgment. 
            The statutory 30-day objection clock commences on the exact date of legal service.
          </p>
        </div>

        {/* Proof of Service Details Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Proof of Service Statutory Certificate
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Legal Service Date
              </label>
              <Input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                disabled={isReadOnly}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Bailiff Return Certificate Ref
              </label>
              <Input
                value={bailiffCertRef}
                onChange={(e) => setBailiffCertRef(e.target.value)}
                disabled={isReadOnly}
                className="text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Service Delivery Mechanism
              </label>
              <Input
                value={serviceMethod}
                onChange={(e) => setServiceMethod(e.target.value)}
                disabled={isReadOnly}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Acknowledging Taxpayer Officers
              </label>
              <Input
                value={recipientOfficer}
                onChange={(e) => setRecipientOfficer(e.target.value)}
                disabled={isReadOnly}
                className="text-xs"
              />
            </div>
          </div>

          {/* 30-Day Objection Countdown Banner */}
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={13} /> Article 99 30-Day Statutory Objection Countdown
              </span>
              <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                Notice served on <strong>28 September 2026</strong>. Taxpayer statutory deadline to pay or file written objection: 
                <strong className="text-indigo-700 dark:text-indigo-300 font-mono"> 28 October 2026</strong>.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
              <Badge className="bg-indigo-600 text-white font-mono text-xs">
                Clock Expired / Objection Filed
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProceedToPhase && onProceedToPhase('ASSESSMENT')}
            className="text-xs"
          >
            ← Back to Phase 6: Assessment
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/notice-service', {
                  serviceDate,
                  bailiffCertRef,
                  subStep: '7.1',
                  status: 'COMPLETED'
                }, 'Proof of Notice Service recorded.');
                onToggleComplete('7.1', !isDone, { serviceDate, bailiffCertRef });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 7.1 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 7.1 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('7.2')}
              className="text-xs"
            >
              Continue to 7.2 25% Deposit <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 7.2 Taxpayer Payment / Objection Ingestion (25% Deposit)
  // ==============================================================
  if (subStepId === '7.2') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 7.2 Statutory Prerequisite
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Article 99(2)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Landmark className="text-emerald-600 dark:text-emerald-400" size={18} />
            Mandatory 25% Statutory Deposit Verification (CBE Treasury Voucher)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 99(2), a taxpayer objection is legally inadmissible unless the taxpayer deposits 
            <strong> 25% of the disputed tax</strong> with the Authority prior to filing the objection memorial.
          </p>
        </div>

        {/* 25% Deposit Verification Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Commercial Bank of Ethiopia (CBE) Deposit Slip Details
              </h4>
              <p className="text-[11px] text-slate-500">
                MoR Treasury Account No: 010118820019 (Finfine Branch)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Deposit Verified & Acknowledged ✓
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Mandatory 25% Deposit Amount</span>
              <strong className="text-base font-mono font-bold text-emerald-600 block">
                ETB {depositAmount.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500">25% of ETB 40,567,500 total demand</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">CBE Deposit Reference</span>
              <strong className="text-base font-mono font-bold text-slate-900 dark:text-white block">
                {depositSlipRef}
              </strong>
              <span className="text-[10px] text-slate-500">Bank cash deposit receipt</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Deposit Remittance Date</span>
              <strong className="text-base font-mono font-bold text-slate-900 dark:text-white block">
                {depositDate}
              </strong>
              <span className="text-[10px] text-slate-500">Remitted within 10 days of notice</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-emerald-600" />
              <span>Taxpayer Formal Objection Memorial (24 Pages): <strong>Apex_Objection_Memorial_2026.pdf</strong></span>
            </div>
            <Badge variant="outline" className="text-xs">
              Admissible under Art. 99(2)
            </Badge>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('7.1')}
            className="text-xs"
          >
            ← Back to 7.1 Notice Service
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/objection/record', {
                  depositAmount,
                  depositSlipRef,
                  depositDate,
                  subStep: '7.2',
                  status: 'COMPLETED'
                }, 'Mandatory 25% Deposit verified and Objection admitted.');
                onToggleComplete('7.2', !isDone, { depositAmount, depositSlipRef });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 7.2 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 7.2 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('7.3')}
              className="text-xs"
            >
              Continue to 7.3 Objection Grounds <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 7.3 Objection Grounds Legal & Technical Dissection
  // ==============================================================
  if (subStepId === '7.3') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-red-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
              Phase 7.3 Grounds Review
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 99(3)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Scale className="text-amber-600 dark:text-amber-400" size={18} />
            Objection Grounds Legal & Technical Dissection (3 Grounds Raised)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 99(3), the taxpayer must state precisely the grounds of objection, the amendments 
            requested, and the reasons for each amendment. The audit team has classified and evaluated each ground.
          </p>
        </div>

        {/* 3 Grounds Dissection Cards */}
        <div className="space-y-4">
          {objectionGrounds.map((obj) => (
            <div key={obj.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {obj.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {obj.groundTitle}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Disputed Tax</span>
                  <strong className="text-xs font-mono font-bold text-red-600">
                    ETB {obj.disputedTax.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Taxpayer Written Objection Submission:
                </span>
                <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  "{obj.taxpayerMemorial}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('7.2')}
            className="text-xs"
          >
            ← Back to 7.2 25% Deposit
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/objection-grounds', {
                  objectionGrounds,
                  subStep: '7.3',
                  status: 'COMPLETED'
                }, 'Objection Grounds dissected.');
                onToggleComplete('7.3', !isDone, { objectionGrounds });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 7.3 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 7.3 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('7.4')}
              className="text-xs"
            >
              Continue to 7.4 Technical Rejoinder <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 7.4 Auditor Technical Defense Rejoinder
  // ==============================================================
  if (subStepId === '7.4') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Phase 7.4 Auditor Defense
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              MoR Objection Review Directorate Protocols
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={18} />
            Auditor Comprehensive Technical Defense Rejoinder Document
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            The formal Technical Defense Rejoinder represents the audit team’s defense of the assessment before the 
            Tax Review Committee, presenting evidentiary refutation against each objection ground.
          </p>
        </div>

        {/* Defense Rejoinder Grid */}
        <div className="space-y-4">
          {objectionGrounds.map((obj) => (
            <div key={obj.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Rebuttal to {obj.groundTitle}
              </h4>
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">
                  Auditor Technical Rejoinder:
                </span>
                {obj.auditorRejoinder}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('7.3')}
            className="text-xs"
          >
            ← Back to 7.3 Objection Grounds
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/defense-rejoinder', {
                  subStep: '7.4',
                  status: 'COMPLETED'
                }, 'Auditor Technical Defense Rejoinder compiled.');
                onToggleComplete('7.4', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 7.4 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 7.4 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('7.5')}
              className="text-xs"
            >
              Continue to 7.5 Hearing Session <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 7.5 Objection Review Session / Reconciliation Hearing
  // ==============================================================
  if (subStepId === '7.5') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-blue-950/20 border border-teal-200 dark:border-teal-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white uppercase tracking-wider">
              Phase 7.5 Hearing Protocol
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 100
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <MessageSquare className="text-teal-600 dark:text-teal-400" size={18} />
            Objection Review Hearing Session & Committee Reconciliation Minutes
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Formal oral hearing convened before the Ministry of Revenues Tax Review Authority to hear the taxpayer’s 
            arguments and the audit team’s defense before formulating a final administrative determination.
          </p>
        </div>

        {/* Hearing Minutes Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Review Hearing Session Summary (18 October 2026)
              </h4>
              <p className="text-[11px] text-slate-500">
                Presided over by: Review Committee Panel (3 Senior Officers)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Hearing Concluded
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif space-y-2">
            <p>
              "The Tax Review Committee examined the objection filed by Apex Healthcare Ethiopia SC. 
              Counsel for the taxpayer argued that the disallowance of management fees violated international group synergy recognition. 
              The Lead Auditor demonstrated that the taxpayer had provided zero timesheets or activity logs to substantiate actual services."
            </p>
            <p>
              "Regarding penalties, the Committee found that while the under-declaration exceeded 25% threshold (mandating 50% penalty), 
              the taxpayer’s full transparency in depositing 25% of the disputed tax justified relieving ancillary administrative surcharges 
              totaling ETB 717,500."
            </p>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('7.4')}
            className="text-xs"
          >
            ← Back to 7.4 Defense Rejoinder
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/hearing-session', {
                  subStep: '7.5',
                  status: 'COMPLETED'
                }, 'Objection Review hearing session recorded.');
                onToggleComplete('7.5', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 7.5 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 7.5 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('7.6')}
              className="text-xs"
            >
              Continue to 7.6 Determination <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 7.6 Final Administrative Determination Recording
  // ==============================================================
  if (subStepId === '7.6') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 7.6 Administrative Ruling
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 100(4)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Award className="text-emerald-600 dark:text-emerald-400" size={18} />
            Final Administrative Determination Order Recording & Case Resolution
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 100(4), the Authority issues a final written determination affirming, reducing, 
            or increasing the assessment. The final liability is recorded and forwarded for revenue collection in Phase 8.
          </p>
        </div>

        {/* Final Determination Order Document Preview */}
        <div className="border-2 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-200 dark:border-slate-800 pb-4 space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Federal Democratic Republic of Ethiopia • Ministry of Revenues
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide pt-1">
              FINAL ADMINISTRATIVE OBJECTION DETERMINATION ORDER
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Determination Ref: MOR/REV-COMM/DET/2026/0031 • Date: 22 October 2026
            </p>
          </div>

          {/* Ruling Disposition Summary */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              Administrative Ruling: Objection Partially Sustained / Core Assessment Maintained
            </h4>
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1 leading-relaxed">
              <p>• <strong>Ground 1 (MAM Selection):</strong> DISMISSED. TNMM and Median 6.40% upheld in full.</p>
              <p>• <strong>Ground 2 (Management Fee):</strong> DISMISSED. Disallowance under Art. 13 upheld in full.</p>
              <p>• <strong>Ground 3 (Penalties):</strong> PARTIALLY SUSTAINED. Ancillary penalty relief of ETB 717,500 granted.</p>
            </div>
          </div>

          {/* Final Revised Tax Liability Schedule */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Liability Element</th>
                  <th className="p-3 text-right">Original Notice</th>
                  <th className="p-3 text-right text-emerald-600">Determination Revision</th>
                  <th className="p-3 text-right font-bold text-slate-900 dark:text-white">Final Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-medium">Principal Tax (CIT + Dividend WHT)</td>
                  <td className="p-3 text-right font-mono">22,090,000</td>
                  <td className="p-3 text-right font-mono text-slate-400">0</td>
                  <td className="p-3 text-right font-mono font-bold">22,090,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Statutory Penalties (Art. 105)</td>
                  <td className="p-3 text-right font-mono">10,077,500</td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-bold">-717,500</td>
                  <td className="p-3 text-right font-mono font-bold">9,360,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Statutory Late Interest (Art. 104)</td>
                  <td className="p-3 text-right font-mono">8,400,000</td>
                  <td className="p-3 text-right font-mono text-slate-400">0</td>
                  <td className="p-3 text-right font-mono font-bold">8,400,000</td>
                </tr>
                <tr className="bg-indigo-50/60 dark:bg-indigo-950/40 text-sm">
                  <td className="p-3 font-bold text-indigo-900 dark:text-indigo-200">FINAL TOTAL PAYABLE LIABILITY</td>
                  <td className="p-3 text-right font-mono text-slate-500">40,567,500</td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-bold">-717,500</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    ETB {revisedLiability.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between items-center">
            <span>Credited 25% Statutory Deposit (Remitted via CBE):</span>
            <strong className="font-mono text-emerald-600 font-bold">-ETB 10,141,875</strong>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs flex justify-between items-center">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 uppercase">Net Remaining Treasury Remittance Due:</span>
            <strong className="text-base font-mono font-bold text-indigo-700 dark:text-indigo-300">
              ETB {(revisedLiability - 10141875).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Milestone Governance Complete Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} /> Phase 7 Notice & Taxpayer Objection Substantively Concluded
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              Administrative determination issued and final liability of <strong>ETB {revisedLiability.toLocaleString()}</strong> determined. 
              The case is ready for Phase 8 Final Audit Closure & Clearance.
            </p>
          </div>
          {onProceedToPhase && (
            <Button
              size="sm"
              onClick={() => {
                onProceedToPhase('CLOSURE');
                if (onSelectSubStep) onSelectSubStep('8.1');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-sm"
            >
              Proceed to Phase 8: Audit Closure & Clearance <ArrowRight size={14} className="ml-1.5" />
            </Button>
          )}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('7.5')}
            className="text-xs"
          >
            ← Back to 7.5 Hearing Session
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/objection-determination', {
                  revisedLiability,
                  determinationDate,
                  subStep: '7.6',
                  status: 'COMPLETED'
                }, 'Final Administrative Determination Order registered.');
                onToggleComplete('7.6', !isDone, { revisedLiability });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 7.6 Completed ✓ (Click to Re-Save)' : 'Finalize & Mark Sub-Step 7.6 Complete'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
