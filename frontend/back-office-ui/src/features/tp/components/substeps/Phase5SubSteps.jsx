import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, AlertTriangle, Users, Calendar,
  Building2, Check, ArrowRight, ShieldCheck, Clock, Send,
  Eye, FileCheck, Info, MapPin, Printer, Download, Award,
  Edit3, Save, AlertOctagon, Scale, BookOpen, UserCheck, MessageSquare
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select } from '../../../../components/ui/index.jsx';

// Default Exit Conference Delegation
const DEFAULT_ATTENDEES = [
  { name: 'Audit Officer (Lead)', role: 'Lead TP Auditor', entity: 'Ministry of Revenues (LTO-1)', present: true, signed: true },
  { name: 'Senior Economic Analyst', role: 'Transfer Pricing Economist', entity: 'Ministry of Revenues', present: true, signed: true },
  { name: 'TP Team Leader', role: 'Supervisory Team Leader', entity: 'Ministry of Revenues', present: true, signed: true },
  { name: 'Ato Dawit Tadesse', role: 'Country Managing Director', entity: 'Apex Healthcare Ethiopia SC', present: true, signed: true },
  { name: 'W/ro Bethlehem Girma', role: 'Chief Financial Officer', entity: 'Apex Healthcare Ethiopia SC', present: true, signed: true },
  { name: 'External Tax Partner', role: 'Tax Advisory Representative', entity: 'PwC Ethiopia (Advisors)', present: true, signed: true }
];

// Default Quality Assurance Checklist items
const DEFAULT_QA_CHECKLIST = [
  { id: 'qa-1', item: 'Statutory 5-Year Limitation Period Verification (Art. 27)', checked: true, note: 'FY 2020 through FY 2024 verified open and within statutory limitation periods.' },
  { id: 'qa-2', item: 'Evidentiary Corroboration for FAR Characterization', checked: true, note: 'Toll-manufacturer and routine distributor characterization supported by IDRs #01-05 and walkthroughs.' },
  { id: 'qa-3', item: 'Statutory MAM Selection & Rejection Rigor (Directive 43/2015 Art. 5)', checked: true, note: 'Formal dismissal of CUP, RPM, CPM, and PSM documented in technical workpaper.' },
  { id: 'qa-4', item: 'Independence & Financial Completeness of Comparables', checked: true, note: 'All 7 peer comparables satisfy >50% independence threshold with 3 consecutive audited years.' },
  { id: 'qa-5', item: 'Mathematical Precision & Segmental Reconciliation', checked: true, note: 'Turnover, COGS, and SG&A reconcile 100% to audited financial statements and tax declarations.' },
  { id: 'qa-6', item: 'Documentary Exhibit Assembly & Legal Review', checked: true, note: 'All 48 workpapers cataloged with digital cross-references.' }
];

// Default Taxpayer Rebuttal Points & Auditor Counter-Analysis
const DEFAULT_REBUTTAL_POINTS = [
  {
    id: 'reb-1',
    category: 'COMPARABILITY',
    taxpayerArgument: 'Taxpayer contends that peer comparables from South Africa and Egypt enjoy superior national infrastructure and logistics, skewing the arm’s length operating margin higher. Requests exclusion of non-East African peers.',
    auditorCounter: 'REJECTED. Broad geographic pooling in emerging African pharmaceutical distribution is required to achieve statistical sample adequacy (>5 peers). Working capital adjustments were specifically applied to eliminate inventory and receivable carrying cost disparities pursuant to OECD Guidelines Chapter III.',
    determination: 'REJECTED — Core Benchmark Maintained'
  },
  {
    id: 'reb-2',
    category: 'INTRA-GROUP SERVICES',
    taxpayerArgument: 'Taxpayer asserts that the ETB 38.5M management fee paid to Mauritius reflects intangible group synergies, corporate governance, and brand goodwill that cannot be captured through hourly timesheets.',
    auditorCounter: 'REJECTED. Under Article 13 of Directive No. 43/2015, the taxpayer bears the statutory burden of satisfying the Benefit Test. Taxpayer failed to provide any timesheets, activity logs, or cost-allocation keys showing actual services rendered to the Ethiopian entity. Merely asserting general group synergies does not meet statutory requirements.',
    determination: 'REJECTED — Deduction Disallowed in Full'
  },
  {
    id: 'reb-3',
    category: 'WORKING CAPITAL',
    taxpayerArgument: 'Taxpayer argues that the 14.50% prime interest rate utilized in the working capital adjustment understated the true Ethiopian commercial borrowing costs (typically 16-18% in commercial banks).',
    auditorCounter: 'PARTIALLY CONCEDED. In the interest of administrative equity, the working capital benchmark interest rate is revised to 15.20% (reflecting the weighted average commercial bank commercial rate). This slightly moderates the inventory carrying adjustment, yielding ETB 450,000 relief on the primary adjustment.',
    determination: 'PARTIALLY CONCEDED — ETB 450,000 Relief Granted'
  }
];

export default function Phase5SubSteps({
  subStepId,
  onSelectSubStep,
  onProceedToPhase,
  isReadOnly,
  fullState,
  executiveSummary,
  setExecutiveSummary,
  legalGrounds,
  setLegalGrounds,
  exitConfVenue,
  setExitConfVenue,
  exitConfNotes,
  setExitConfNotes,
  completedSubSteps = [],
  onToggleComplete,
  saving,
  executeApiAction
}) {
  const isDone = completedSubSteps.includes(subStepId);

  // Local state
  const [attendees, setAttendees] = useState(DEFAULT_ATTENDEES);
  const [qaChecklist, setQaChecklist] = useState(DEFAULT_QA_CHECKLIST);
  const [rebuttalPoints, setRebuttalPoints] = useState(DEFAULT_REBUTTAL_POINTS);
  const [confVenue, setConfVenue] = useState(exitConfVenue || 'Ministry of Revenues LTO Conference Hall 3B (Hybrid Video Link)');
  const [confDate, setConfDate] = useState('2026-09-18');

  // Sub-step navigation helper
  const navigateSubStep = (step) => {
    if (onSelectSubStep) onSelectSubStep(step);
  };

  // ==============================================================
  // 5.1 Comprehensive TP Audit Report Drafting
  // ==============================================================
  if (subStepId === '5.1') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 5.1 Audit Report
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 80 & Directive 43/2015
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-400" size={18} />
            Comprehensive Transfer Pricing Audit Report (6 Statutory Sections)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            The formal Transfer Pricing Audit Report establishes the evidentiary, economic, and legal foundation 
            for all proposed adjustments. It consolidates the findings of Phases 1 through 4 into a statutory dossier.
          </p>
        </div>

        {/* 6-Section Formal Report Document View */}
        <div className="border-2 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md space-y-6 max-w-4xl mx-auto">
          {/* Document Header */}
          <div className="text-center border-b-2 border-slate-200 dark:border-slate-800 pb-4 space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Federal Democratic Republic of Ethiopia • Ministry of Revenues
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide pt-1">
              TRANSFER PRICING AUDIT INVESTIGATION REPORT
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Report Ref: MOR/LTO/TP-REP/2026/0014 • Taxpayer: Apex Healthcare Ethiopia SC (TIN: 0002847192)
            </p>
          </div>

          {/* Section 1: Executive Summary & Audit Mandate */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-900 pb-1">
              <BookOpen size={14} className="text-indigo-600" />
              Section 1: Executive Summary & Audit Background
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
              <p>
                Pursuant to statutory audit authorization issued under Article 23 of the Federal Tax Administration 
                Proclamation No. 983/2016, the Transfer Pricing Directorate conducted an in-depth audit of 
                <strong> Apex Healthcare Ethiopia SC</strong> for the tax years <strong>FY 2020 through FY 2024</strong>.
              </p>
              <p>
                The audit identified systematic profit shifting through two primary mechanisms: (1) artificial suppression of 
                operating margins on imported pharmaceutical formulations (earning 1.50% locally versus 7.86% on domestic lines), 
                and (2) remittance of ETB 38.5M in management fees to a low-tax affiliate in Mauritius without meeting the statutory Benefit Test.
              </p>
            </div>
          </div>

          {/* Section 2: Statutory Authority & Legal Basis */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-900 pb-1">
              <Scale size={14} className="text-indigo-600" />
              Section 2: Legal Authority & Statutory Provisions
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5">
              <p>• <strong>Federal Income Tax Proclamation No. 979/2016, Article 79:</strong> Arm’s length principle mandate empowering the Authority to distribute, apportion, or allocate income between related persons.</p>
              <p>• <strong>Transfer Pricing Directive No. 43/2015, Articles 5, 6, 7 & 13:</strong> Selection of Most Appropriate Method (TNMM), tested party rules, interquartile range median adjustments, and intra-group services benefit test requirements.</p>
              <p>• <strong>Tax Administration Proclamation No. 983/2016, Articles 46, 78, 80 & 105:</strong> Evidentiary obligations, exit conference rights, statutory assessment notices, and under-declaration penalties.</p>
            </div>
          </div>

          {/* Section 3: FAR Findings & Tested Party Characterization */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-900 pb-1">
              <Building2 size={14} className="text-indigo-600" />
              Section 3: Factual Findings & Functional Analysis (FAR)
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5">
              <p>
                The tested party is characterized as a <strong>routine contract toll-manufacturer and limited-risk distributor</strong>. 
                The foreign parent company controls all R&D, chemical formulations, and global pricing decisions. 
                However, in practice, the local affiliate improperly absorbed ETB 28.6M in currency devaluation losses and wrote off ETB 12.4M in expired inventory without contractual compensation from the parent principal.
              </p>
            </div>
          </div>

          {/* Section 4: Economic Analysis & IQR Benchmarking */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-900 pb-1">
              <Award size={14} className="text-indigo-600" />
              Section 4: Economic Methodology & Arm’s Length Range
            </h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">MAM Method</span>
                  <strong className="text-blue-600 font-bold">TNMM</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">Selected PLI</span>
                  <strong className="text-indigo-600 font-bold">Operating Margin</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">IQR (Q1 - Q3)</span>
                  <strong className="text-emerald-600 font-mono font-bold">4.95% - 8.00%</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">Statutory Median</span>
                  <strong className="text-blue-700 font-mono font-bold">6.40%</strong>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center pt-1">
                Taxpayer result: <strong>1.50%</strong> • Shortfall to Median: <strong>+4.90%</strong>
              </p>
            </div>
          </div>

          {/* Section 5: Proposed Tax Adjustments Schedule */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-900 pb-1">
              <ShieldCheck size={14} className="text-indigo-600" />
              Section 5: Summary of Proposed Tax Base Adjustments
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="p-2.5">Adjustment Category</th>
                    <th className="p-2.5">Statutory Legal Basis</th>
                    <th className="p-2.5 text-right">Adjustment Amount (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="p-2.5 font-medium">Primary Transfer Pricing Adjustment (Sales Underpricing)</td>
                    <td className="p-2.5 text-slate-500 font-mono">Directive 43/2015 Art. 7(2)</td>
                    <td className="p-2.5 text-right font-mono font-bold">26,800,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Disallowance of Mauritius Management Service Fees</td>
                    <td className="p-2.5 text-slate-500 font-mono">Directive 43/2015 Art. 13</td>
                    <td className="p-2.5 text-right font-mono font-bold">38,500,000</td>
                  </tr>
                  <tr className="bg-indigo-50/50 dark:bg-indigo-950/30">
                    <td className="p-2.5 font-bold text-indigo-900 dark:text-indigo-200">Total Recommended Tax Base Adjustment</td>
                    <td className="p-2.5 text-indigo-700 font-mono">Cumulative FY 2020 - FY 2024</td>
                    <td className="p-2.5 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                      65,300,000
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Audit Team Endorsement Signatures */}
          <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Transfer Pricing Auditor</span>
              <strong className="text-slate-900 dark:text-white block">Audit Officer — TP Directorate</strong>
              <p className="text-[10px] text-slate-500 font-mono">Digital Signature Verified (2026-09-14)</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">TP Supervisory Team Leader</span>
              <strong className="text-slate-900 dark:text-white block">Team Leader — LTO-1</strong>
              <p className="text-[10px] text-slate-500 font-mono">Approved for Exit Conference Presentation</p>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProceedToPhase && onProceedToPhase('ANALYSIS')}
            className="text-xs"
          >
            ← Back to Phase 4: Economic Analysis
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/report-draft', {
                  subStep: '5.1',
                  status: 'COMPLETED'
                }, 'Comprehensive TP Audit Report drafted and registered.');
                onToggleComplete('5.1', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 5.1 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 5.1 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('5.2')}
              className="text-xs"
            >
              Continue to 5.2 Supervisory Review <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 5.2 Draft Report Supervisory Review
  // ==============================================================
  if (subStepId === '5.2') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Phase 5.2 Quality Assurance
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              MoR Transfer Pricing Directorate Quality Control Guidelines
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={18} />
            Draft Report Supervisory Review & Technical Quality Assurance
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Prior to presenting findings to the taxpayer in an Exit Conference, the TP Team Leader conducts 
            a rigorous technical review to ensure that evidentiary gaps, mathematical inaccuracies, and statutory weaknesses are resolved.
          </p>
        </div>

        {/* Quality Assurance Verification Checklist */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Supervisory Technical Verification Checklist (6 Controls)
            </h4>
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
              100% Quality Vetted
            </Badge>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {qaChecklist.map((item) => (
              <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.item}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Leader Quality Clearance Memo */}
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
            <Award size={15} className="text-emerald-600" />
            Supervisory Team Leader Formal Clearance Endorsement
          </h4>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            I have reviewed the Draft Transfer Pricing Audit Report for Apex Healthcare Ethiopia SC. 
            The factual characterization is firmly supported by on-site factory inspections, the economic 
            comparability search adheres to international best practices, and the primary adjustment computation 
            is statistically sound. The audit team is formally cleared to convene the statutory Exit Conference.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
            <span>Signed: <strong>Ato Tamirat Mengesha (TP Team Leader)</strong></span>
            <span>• Date: <strong>2026-09-15</strong></span>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('5.1')}
            className="text-xs"
          >
            ← Back to 5.1 Audit Report
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/supervisory-review', {
                  qaChecklist,
                  subStep: '5.2',
                  status: 'COMPLETED'
                }, 'Supervisory QA review saved and cleared.');
                onToggleComplete('5.2', !isDone, { qaChecklist });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 5.2 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 5.2 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('5.3')}
              className="text-xs"
            >
              Continue to 5.3 Exit Conference <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 5.3 Formal Exit Conference Convening
  // ==============================================================
  if (subStepId === '5.3') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/20 border border-sky-200 dark:border-sky-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white uppercase tracking-wider">
              Phase 5.3 Taxpayer Engagement
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 80
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Users className="text-sky-600 dark:text-sky-400" size={18} />
            Formal Exit Conference Convening & Statutory Scheduling Protocol
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 80, the taxpayer is entitled to a formal Exit Meeting where preliminary audit findings 
            are presented and explained prior to the issuance of any statutory assessment notice.
          </p>
        </div>

        {/* Exit Conference Logistical Details */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Exit Conference Meeting Logistics & Protocol
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Designated Conference Venue
              </label>
              <Input
                value={confVenue}
                onChange={(e) => setConfVenue(e.target.value)}
                disabled={isReadOnly}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Convening Date & Time
              </label>
              <Input
                type="date"
                value={confDate}
                onChange={(e) => setConfDate(e.target.value)}
                disabled={isReadOnly}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Formal Meeting Agenda:
            </span>
            <div className="space-y-1 text-slate-700 dark:text-slate-300">
              <p>1. Formal Opening & Introductions by Supervisory Team Leader (Ato Tamirat Mengesha)</p>
              <p>2. Detailed Presentation of Functional Analysis (FAR) & Evidentiary Findings by Lead TP Auditor</p>
              <p>3. Presentation of Economic Benchmarking, MAM Selection, and Interquartile Range by TP Economist</p>
              <p>4. Explanation of Proposed Tax Base Adjustments (ETB 65.3M Total Base Adjustment)</p>
              <p>5. Taxpayer Initial Verbal Responses & Formal Handover of Draft Findings Summary</p>
              <p>6. Commencement of Statutory 10-Day Written Rebuttal Notice Period</p>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('5.2')}
            className="text-xs"
          >
            ← Back to 5.2 Supervisory Review
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (setExitConfVenue) setExitConfVenue(confVenue);
                await executeApiAction('/exit-conference', {
                  confVenue,
                  confDate,
                  subStep: '5.3',
                  status: 'COMPLETED'
                }, 'Exit Conference formally scheduled.');
                onToggleComplete('5.3', !isDone, { confVenue, confDate });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 5.3 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 5.3 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('5.4')}
              className="text-xs"
            >
              Continue to 5.4 Exit Minutes <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 5.4 Exit Conference Minutes & Attendance
  // ==============================================================
  if (subStepId === '5.4') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-cyan-950/20 border border-teal-200 dark:border-teal-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white uppercase tracking-wider">
              Phase 5.4 Formal Record
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 80(3)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <MessageSquare className="text-teal-600 dark:text-teal-400" size={18} />
            Exit Conference Minutes & Signed Attendance Register
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Official statutory minutes documenting all verbal statements, taxpayer counter-arguments, 
            and signed acknowledgment of the draft audit findings summary.
          </p>
        </div>

        {/* Signed Attendance Roster Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Official Signed Attendance Register ({attendees.length} Attendees)
            </h4>
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
              Joint Signatures On File
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Attendee Name</th>
                  <th className="p-3">Designation / Role</th>
                  <th className="p-3">Represented Institution</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Signature Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attendees.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{att.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{att.role}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{att.entity}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Present
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Signed & Acknowledged ✓
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verbatim Exit Conference Deliberation Excerpt */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-teal-600" />
            Executive Summary of Minutes of the Meeting
          </h4>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif space-y-2">
            <p>
              "The Exit Conference convened at 10:00 AM on 18 September 2026. The Lead TP Auditor delivered a 
              detailed PowerPoint presentation outlining the transfer pricing findings, explaining the rejection of 
              traditional methods and the statistical calculation of the interquartile range median."
            </p>
            <p>
              "Taxpayer Managing Director (Ato Dawit Tadesse) formally stated that while the company respects the Ministry’s 
              mandate, it strongly disagrees with the complete disallowance of management service expenses paid to Crest Global Services. 
              The taxpayer’s external tax advisor (PwC) requested a 10-day window to submit formal economic counter-arguments 
              and alternative local benchmark candidates."
            </p>
            <p>
              "The Supervisory Team Leader formally granted the taxpayer 10 working days (until 2 October 2026) 
              to submit its formal written rebuttal dossier, in accordance with Ministry directives."
            </p>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('5.3')}
            className="text-xs"
          >
            ← Back to 5.3 Exit Conference
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/exit-minutes', {
                  attendees,
                  subStep: '5.4',
                  status: 'COMPLETED'
                }, 'Exit Conference Minutes and Attendance signed.');
                onToggleComplete('5.4', !isDone, { attendees });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 5.4 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 5.4 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('5.5')}
              className="text-xs"
            >
              Continue to 5.5 Rebuttal Evaluation <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 5.5 Taxpayer Written Rebuttal Evaluation
  // ==============================================================
  if (subStepId === '5.5') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
              Phase 5.5 Rebuttal Review
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Directive No. 43/2015 & Tax Administration Proclamation No. 983/2016
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Scale className="text-amber-600 dark:text-amber-400" size={18} />
            Taxpayer 10-Day Written Rebuttal Evaluation & Auditor Technical Rejoinder
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            The taxpayer submitted a 24-page rebuttal dossier through PwC Ethiopia. The audit team has systematically 
            dissected every contention against statutory provisions and verified economic data.
          </p>
        </div>

        {/* 3 Rebuttal Points Dissection Grid */}
        <div className="space-y-4">
          {rebuttalPoints.map((reb) => (
            <div key={reb.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {reb.category} CONTENTION
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  reb.determination.includes('PARTIALLY')
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  {reb.determination}
                </span>
              </div>

              {/* Taxpayer Contention Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Taxpayer Written Submission Excerpt:
                </span>
                <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  "{reb.taxpayerArgument}"
                </p>
              </div>

              {/* Auditor Technical Rejoinder Box */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-800 text-xs">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                  Auditor Statutory Counter-Analysis & Rebuttal:
                </span>
                <p className="text-blue-950 dark:text-blue-200 leading-relaxed">
                  {reb.auditorCounter}
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
            onClick={() => navigateSubStep('5.4')}
            className="text-xs"
          >
            ← Back to 5.4 Exit Minutes
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/rebuttal-evaluation', {
                  rebuttalPoints,
                  subStep: '5.5',
                  status: 'COMPLETED'
                }, 'Taxpayer rebuttal evaluated and technical rejoinder recorded.');
                onToggleComplete('5.5', !isDone, { rebuttalPoints });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 5.5 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 5.5 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('5.6')}
              className="text-xs"
            >
              Continue to 5.6 Endorsement Dossier <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 5.6 Final Audit Findings Endorsement Dossier
  // ==============================================================
  if (subStepId === '5.6') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 5.6 Gate Authorization
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Transfer Pricing Directorate Committee Endorsement Protocol
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Award className="text-emerald-600 dark:text-emerald-400" size={18} />
            Final Audit Findings Dossier Package for TP Committee Endorsement
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            The Transfer Pricing Committee reviews the post-rebuttal audit dossier to formally endorse the 
            proposed tax base adjustment before routing to Phase 6 Assessment & Notice Draft.
          </p>
        </div>

        {/* Consolidated Endorsement Package Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Consolidated Case Dossier Contents Ready for Executive Sign-off
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <FileCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Exhibit A: Audit Report</strong>
                <span className="text-slate-500">6 Sections with full FAR & Economic Benchmarking</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <FileCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Exhibit B: Exit Conference Record</strong>
                <span className="text-slate-500">Minutes & Signed Roster dated 18 Sept 2026</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <FileCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Exhibit C: Rebuttal Dissection</strong>
                <span className="text-slate-500">Technical Rejoinder with ETB 450K working capital adjustment</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <FileCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Exhibit D: Revised Adjustment Total</strong>
                <span className="text-slate-500 font-mono font-bold text-emerald-600">ETB 64,850,000 Total Base Adjustment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Governance Complete Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} /> Phase 5 Report & Exit Conference Substantively Concluded
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              Exit conference conducted, taxpayer rebuttal resolved, and final findings endorsed. 
              The case is ready for Phase 6 Assessment & Notice Drafting.
            </p>
          </div>
          {onProceedToPhase && (
            <Button
              size="sm"
              onClick={() => {
                onProceedToPhase('ASSESSMENT');
                if (onSelectSubStep) onSelectSubStep('6.1');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-sm"
            >
              Proceed to Phase 6: Assessment & Computation <ArrowRight size={14} className="ml-1.5" />
            </Button>
          )}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('5.5')}
            className="text-xs"
          >
            ← Back to 5.5 Rebuttal Evaluation
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/endorsement-dossier', {
                  subStep: '5.6',
                  status: 'COMPLETED'
                }, 'Final Endorsement Dossier compiled and locked.');
                onToggleComplete('5.6', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 5.6 Completed ✓ (Click to Re-Save)' : 'Finalize & Mark Sub-Step 5.6 Complete'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
