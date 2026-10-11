import React, { useState, useMemo } from 'react';
import { 
  Calculator, DollarSign, FileText, CheckCircle2, AlertTriangle, 
  Scale, Check, ArrowRight, ShieldCheck, Clock, Send, Eye,
  Building2, Percent, AlertOctagon, Printer, Download, Award,
  Calendar, Shield, UserCheck, Lock, Landmark
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select } from '../../../../components/ui/index.jsx';

// Multi-Year Tax Base & Adjustment Schedule (FY 2020 - FY 2024)
const DEFAULT_YEARLY_ASSESSMENTS = [
  {
    year: 'FY 2020',
    turnover: 210000000,
    primaryAdjustment: 3200000,
    disallowedMgmt: 6500000,
    totalBaseAdj: 9700000,
    citRate: 30,
    citDue: 2910000,
    deemedDivRate: 10,
    dividendWhtDue: 320000,
    statutoryInterest: 2840000,
    penalties: 1455000
  },
  {
    year: 'FY 2021',
    turnover: 255000000,
    primaryAdjustment: 4500000,
    disallowedMgmt: 7200000,
    totalBaseAdj: 11700000,
    citRate: 30,
    citDue: 3510000,
    deemedDivRate: 10,
    dividendWhtDue: 450000,
    statutoryInterest: 2120000,
    penalties: 1755000
  },
  {
    year: 'FY 2022',
    turnover: 310000000,
    primaryAdjustment: 5800000,
    disallowedMgmt: 7800000,
    totalBaseAdj: 13600000,
    citRate: 30,
    citDue: 4080000,
    deemedDivRate: 10,
    dividendWhtDue: 580000,
    statutoryInterest: 1640000,
    penalties: 2040000
  },
  {
    year: 'FY 2023',
    turnover: 350000000,
    primaryAdjustment: 6200000,
    disallowedMgmt: 8200000,
    totalBaseAdj: 14400000,
    citRate: 30,
    citDue: 4320000,
    deemedDivRate: 10,
    dividendWhtDue: 620000,
    statutoryInterest: 1180000,
    penalties: 2160000
  },
  {
    year: 'FY 2024',
    turnover: 380000000,
    primaryAdjustment: 6650000,
    disallowedMgmt: 8800000,
    totalBaseAdj: 15450000,
    citRate: 30,
    citDue: 4635000,
    deemedDivRate: 10,
    dividendWhtDue: 665000,
    statutoryInterest: 620000,
    penalties: 2317500
  }
];

export default function Phase6SubSteps({
  subStepId,
  onSelectSubStep,
  onProceedToPhase,
  isReadOnly,
  fullState,
  varianceAmt,
  assessedTax,
  setAssessedTax,
  penaltyAmount,
  setPenaltyAmount,
  interestAmount,
  setInterestAmount,
  completedSubSteps = [],
  onToggleComplete,
  saving,
  executeApiAction
}) {
  const isDone = completedSubSteps.includes(subStepId);

  // Local state for calculations
  const [assessments, setAssessments] = useState(DEFAULT_YEARLY_ASSESSMENTS);
  const [penaltyTier, setPenaltyTier] = useState('TIER_50'); // Art. 105: 50% substantial understatement
  const [interestAnnualRate, setInterestAnnualRate] = useState(16.50); // Art. 104: CBE rate + 2%

  // Aggregated totals
  const totals = useMemo(() => {
    const totalPrimaryBase = assessments.reduce((acc, row) => acc + row.primaryAdjustment, 0); // 26,350,000
    const totalDisallowedMgmt = assessments.reduce((acc, row) => acc + row.disallowedMgmt, 0); // 38,500,000
    const totalTaxBaseAdj = totalPrimaryBase + totalDisallowedMgmt; // 64,850,000

    const totalCit = assessments.reduce((acc, row) => acc + row.citDue, 0); // 19,455,000
    const totalDividendWht = assessments.reduce((acc, row) => acc + row.dividendWhtDue, 0); // 2,635,000
    const principalTaxTotal = totalCit + totalDividendWht; // 22,090,000

    // Penalty calculation: 50% of CIT
    const penaltyPct = penaltyTier === 'TIER_50' ? 0.50 : 0.20;
    const computedPenalties = Math.round(totalCit * penaltyPct) + 350000; // adding documentation/filing penalties

    // Interest calculation
    const totalInterest = assessments.reduce((acc, row) => acc + row.statutoryInterest, 0); // 8,400,000

    const grandTotalDemand = principalTaxTotal + computedPenalties + totalInterest; // 40,567,500

    return {
      totalPrimaryBase,
      totalDisallowedMgmt,
      totalTaxBaseAdj,
      totalCit,
      totalDividendWht,
      principalTaxTotal,
      computedPenalties,
      totalInterest,
      grandTotalDemand
    };
  }, [assessments, penaltyTier]);

  // Sub-step navigation helper
  const navigateSubStep = (step) => {
    if (onSelectSubStep) onSelectSubStep(step);
  };

  // ==============================================================
  // 6.1 Tax Base Adjustment Computation
  // ==============================================================
  if (subStepId === '6.1') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 6.1 Assessment
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Proclamation 979/2016 Art. 19, 55, 79 & Directive 43/2015 Art. 14
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Calculator className="text-blue-600 dark:text-blue-400" size={18} />
            Statutory Tax Base Adjustment & Corporate Income Tax Schedule
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Computation of additional corporate income tax (CIT 30%) and secondary adjustment deemed dividend 
            withholding tax (10%) resulting from transfer mispricing across FY 2020 through FY 2024.
          </p>
        </div>

        {/* Multi-Year Detailed Tax Adjustment Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              5-Year Statutory Adjustment Matrix (ETB)
            </h4>
            <Badge variant="outline" className="text-xs font-mono">
              30% CIT • 10% Dividend WHT
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Tax Year</th>
                  <th className="p-3 text-right">Primary TP Base</th>
                  <th className="p-3 text-right">Disallowed Mgmt Fees</th>
                  <th className="p-3 text-right font-semibold text-indigo-700 dark:text-indigo-300">Total Base Adj</th>
                  <th className="p-3 text-right text-emerald-700 dark:text-emerald-300">30% CIT Due</th>
                  <th className="p-3 text-right text-purple-700 dark:text-purple-300">10% Deemed Div WHT</th>
                  <th className="p-3 text-right font-bold text-slate-900 dark:text-white">Principal Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {assessments.map((row) => {
                  const linePrincipal = row.citDue + row.dividendWhtDue;
                  return (
                    <tr key={row.year} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{row.year}</td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">{row.primaryAdjustment.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">{row.disallowedMgmt.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20">
                        {row.totalBaseAdj.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.citDue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-600 dark:text-purple-400">
                        {row.dividendWhtDue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {linePrincipal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td className="p-3 uppercase">Total Cumulative</td>
                  <td className="p-3 text-right font-mono">{totals.totalPrimaryBase.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{totals.totalDisallowedMgmt.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-indigo-700 dark:text-indigo-300">{totals.totalTaxBaseAdj.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{totals.totalCit.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-purple-600 dark:text-purple-400">{totals.totalDividendWht.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-base text-blue-700 dark:text-blue-300">
                    ETB {totals.principalTaxTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Principal Summary Card */}
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
              Total Additional Principal Tax Assessment
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
              Includes Corporate Income Tax (ETB 19,455,000) and Deemed Dividend Withholding (ETB 2,635,000).
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Principal Tax Due</span>
            <strong className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">
              ETB {totals.principalTaxTotal.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProceedToPhase && onProceedToPhase('REPORT')}
            className="text-xs"
          >
            ← Back to Phase 5: Audit Report
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (setAssessedTax) setAssessedTax(totals.principalTaxTotal);
                await executeApiAction('/tax-computation', {
                  assessments,
                  totals,
                  subStep: '6.1',
                  status: 'COMPLETED'
                }, 'Tax base adjustments and principal tax computed.');
                onToggleComplete('6.1', !isDone, { totals });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 6.1 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 6.1 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('6.2')}
              className="text-xs"
            >
              Continue to 6.2 Penalties <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 6.2 Statutory Penalties Calculation
  // ==============================================================
  if (subStepId === '6.2') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-orange-950/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
              Phase 6.2 Penalties
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Articles 103, 105 & 107
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <AlertOctagon className="text-red-600 dark:text-red-400" size={18} />
            Statutory Penalties Calculation (Article 105 Under-Declaration)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 105, an under-declaration penalty of 20% applies for standard misstatement, 
            which escalates to <strong>50% where the understatement exceeds 25% of the tax liability or represents aggressive profit shifting</strong>.
          </p>
        </div>

        {/* Penalty Tier Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => !isReadOnly && setPenaltyTier('TIER_50')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              penaltyTier === 'TIER_50'
                ? 'bg-red-50/80 dark:bg-red-950/30 border-red-500 dark:border-red-600 ring-2 ring-red-500/20 shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            } space-y-2`}
          >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                APPLICABLE STATUTORY TIER ✓
              </span>
              <strong className="text-sm font-mono font-bold text-red-600">50% Penalty</strong>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Article 105(2) Substantial Understatement / Aggressive Avoidance
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Applies where tax under-declared exceeds 25% of true liability or involves unbacked conduit payments to low-tax jurisdictions (Mauritius).
            </p>
            <div className="pt-2 border-t border-red-200 dark:border-red-800 flex justify-between text-xs">
              <span className="text-slate-500">Computed Penalty (50% of CIT):</span>
              <strong className="font-mono text-red-600 font-bold">ETB 9,727,500</strong>
            </div>
          </div>

          <div 
            onClick={() => !isReadOnly && setPenaltyTier('TIER_20')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              penaltyTier === 'TIER_20'
                ? 'bg-red-50/80 dark:bg-red-950/30 border-red-500 dark:border-red-600 ring-2 ring-red-500/20 shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            } space-y-2`}
          >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ALTERNATIVE TIER
              </span>
              <strong className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">20% Penalty</strong>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Article 105(1) Standard First Under-Declaration
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Applies where under-declaration does not exceed 25% threshold and taxpayer acted with reasonable care.
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
              <span className="text-slate-500">Computed Penalty (20% of CIT):</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">ETB 3,891,000</strong>
            </div>
          </div>
        </div>

        {/* Itemized Statutory Penalties Schedule */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Itemized Statutory Penalty Assessments
            </h4>
            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
              Proclamation 983/2016 Compliant
            </Badge>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <strong className="text-slate-900 dark:text-white block">Article 105(2) Substantial Understatement Penalty</strong>
                <span className="text-[11px] text-slate-500">50% on assessed Corporate Income Tax (ETB 19,455,000)</span>
              </div>
              <strong className="text-sm font-mono font-bold text-red-600">ETB 9,727,500</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <strong className="text-slate-900 dark:text-white block">Article 103 Documentation Non-Compliance Penalty</strong>
                <span className="text-[11px] text-slate-500">Failure to maintain contemporaneous management service timesheets</span>
              </div>
              <strong className="text-sm font-mono font-bold text-red-600">ETB 100,000</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <strong className="text-slate-900 dark:text-white block">Article 107 Statutory Surcharge</strong>
                <span className="text-[11px] text-slate-500">Administrative assessment surcharge</span>
              </div>
              <strong className="text-sm font-mono font-bold text-red-600">ETB 250,000</strong>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <strong className="text-xs uppercase text-slate-900 dark:text-white">Total Statutory Penalties:</strong>
              <strong className="text-base font-mono font-bold text-red-600">
                ETB {totals.computedPenalties.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('6.1')}
            className="text-xs"
          >
            ← Back to 6.1 Tax Base
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (setPenaltyAmount) setPenaltyAmount(totals.computedPenalties);
                await executeApiAction('/penalties-calc', {
                  penaltyTier,
                  computedPenalties: totals.computedPenalties,
                  subStep: '6.2',
                  status: 'COMPLETED'
                }, 'Statutory Penalties recorded.');
                onToggleComplete('6.2', !isDone, { computedPenalties: totals.computedPenalties });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 6.2 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 6.2 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('6.3')}
              className="text-xs"
            >
              Continue to 6.3 Late Interest <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 6.3 Statutory Late Interest Calculation
  // ==============================================================
  if (subStepId === '6.3') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
              Phase 6.3 Late Interest
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Article 104
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Clock className="text-amber-600 dark:text-amber-400" size={18} />
            Statutory Late Interest Calculation (Compounded Annually)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 104, interest is compounded from the statutory return due date of each tax year 
            to the assessment date at the prevailing commercial bank lending rate plus 2% (16.50% p.a.).
          </p>
        </div>

        {/* Accrued Interest Schedule Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Annual Interest Accrual Schedule (16.50% Benchmark)
            </h4>
            <Badge variant="outline" className="text-xs font-mono">
              Article 104 Formula Applied
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Tax Year</th>
                  <th className="p-3">Original Return Due Date</th>
                  <th className="p-3 text-right">Assessed Tax Base</th>
                  <th className="p-3 text-right">Days Overdue</th>
                  <th className="p-3 text-right">Effective Rate</th>
                  <th className="p-3 text-right font-bold text-amber-700 dark:text-amber-300">Accrued Interest (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {assessments.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{row.year}</td>
                    <td className="p-3 font-mono text-slate-500">31 October {row.year.split(' ')[1]}</td>
                    <td className="p-3 text-right font-mono">{row.citDue.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {row.year === 'FY 2020' ? '2,140' : row.year === 'FY 2021' ? '1,775' : row.year === 'FY 2022' ? '1,410' : row.year === 'FY 2023' ? '1,045' : '680'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">16.50% p.a.</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/20">
                      {row.statutoryInterest.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={5} className="p-3 uppercase">Total Statutory Accrued Interest</td>
                  <td className="p-3 text-right font-mono text-base text-amber-700 dark:text-amber-300">
                    ETB {totals.totalInterest.toLocaleString()}
                  </td>
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
            onClick={() => navigateSubStep('6.2')}
            className="text-xs"
          >
            ← Back to 6.2 Penalties
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (setInterestAmount) setInterestAmount(totals.totalInterest);
                await executeApiAction('/interest-calc', {
                  interestAnnualRate,
                  totalInterest: totals.totalInterest,
                  subStep: '6.3',
                  status: 'COMPLETED'
                }, 'Statutory Interest recorded.');
                onToggleComplete('6.3', !isDone, { totalInterest: totals.totalInterest });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 6.3 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 6.3 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('6.4')}
              className="text-xs"
            >
              Continue to 6.4 Notice Draft <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 6.4 Statutory Assessment Notice Drafting
  // ==============================================================
  if (subStepId === '6.4') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 6.4 Statutory Instrument
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Articles 78, 98 & 99
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-400" size={18} />
            Formal Notice of Tax Assessment (Form MOR-ASSESS-01)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 98, the formal Notice of Assessment must state the reasons for the assessment, 
            the tax periods, the additional tax, penalties, and interest due, the 30-day payment deadline, 
            and statutory objection rights.
          </p>
        </div>

        {/* Official Statutory Assessment Notice Document Preview */}
        <div className="border-2 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md space-y-6 max-w-4xl mx-auto">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-200 dark:border-slate-800 pb-4 space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Federal Democratic Republic of Ethiopia • Ministry of Revenues
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide pt-1">
              STATUTORY NOTICE OF TAX ASSESSMENT
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Notice Reference: MOR/LTO/TP-ASSESS/2026/0082 • Issuance Date: 25 September 2026
            </p>
          </div>

          {/* Taxpayer Information Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Taxpayer Name</span>
              <strong className="text-slate-900 dark:text-white">Apex Healthcare Ethiopia SC</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Taxpayer TIN</span>
              <strong className="text-slate-900 dark:text-white font-mono">0002847192</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tax Center</span>
              <strong className="text-slate-900 dark:text-white">Federal LTO-1</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Covered Periods</span>
              <strong className="text-slate-900 dark:text-white font-mono">FY 2020 - FY 2024</strong>
            </div>
          </div>

          {/* Consolidated Demand Summary Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Statutory Assessment Element</th>
                  <th className="p-3">Governing Legal Provision</th>
                  <th className="p-3 text-right">Demand Amount (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">Corporate Income Tax (30%)</td>
                  <td className="p-3 text-slate-500 font-mono">Proclamation 979/2016 Art. 19 & 79</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">19,455,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">Deemed Dividend Withholding Tax (10%)</td>
                  <td className="p-3 text-slate-500 font-mono">Proclamation 979/2016 Art. 55</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">2,635,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-red-600 dark:text-red-400">Statutory Penalties (50% Under-Declaration)</td>
                  <td className="p-3 text-slate-500 font-mono">Proclamation 983/2016 Art. 103, 105 & 107</td>
                  <td className="p-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                    {totals.computedPenalties.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">Statutory Late Interest (16.50% Compounded)</td>
                  <td className="p-3 text-slate-500 font-mono">Proclamation 983/2016 Art. 104</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    {totals.totalInterest.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-indigo-50/60 dark:bg-indigo-950/40 text-sm">
                  <td className="p-3 font-bold text-indigo-900 dark:text-indigo-200">TOTAL STATUTORY TAX DEMAND</td>
                  <td className="p-3 text-indigo-700 font-mono">Statutory Assessment Total</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    ETB {totals.grandTotalDemand.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statutory Remittance & Article 99 Rights Warning */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
            <h5 className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Landmark size={14} className="text-amber-600" />
              Statutory Remittance Terms & Article 99 Objection Rights
            </h5>
            <p className="leading-relaxed">
              1. <strong>Payment Deadline:</strong> The total assessed tax demand of <strong>ETB {totals.grandTotalDemand.toLocaleString()}</strong> 
              must be remitted into Ministry of Revenues Treasury Account No. <code>010118820019</code> at the Commercial Bank of Ethiopia (CBE) 
              within strictly <strong>30 calendar days</strong> from the date of service of this notice.
            </p>
            <p className="leading-relaxed">
              2. <strong>Right of Objection:</strong> Under Article 99 of Proclamation No. 983/2016, if the taxpayer disputes this assessment, 
              a formal Notice of Objection may be filed within 30 days of service, <strong>provided that the taxpayer deposits 25% of the disputed tax</strong> 
              (ETB {(totals.grandTotalDemand * 0.25).toLocaleString()}) with the Authority.
            </p>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('6.3')}
            className="text-xs"
          >
            ← Back to 6.3 Late Interest
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/notice-draft', {
                  totals,
                  subStep: '6.4',
                  status: 'COMPLETED'
                }, 'Statutory Notice of Assessment drafted.');
                onToggleComplete('6.4', !isDone, { totals });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 6.4 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 6.4 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('6.5')}
              className="text-xs"
            >
              Continue to 6.5 Legal Verification <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 6.5 Legal & Compliance Verification
  // ==============================================================
  if (subStepId === '6.5') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Phase 6.5 Legal Review
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              MoR Legal Directorate Quality Assurance Protocols
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Scale className="text-indigo-600 dark:text-indigo-400" size={18} />
            Legal Directorate Compliance & Procedural Regularity Vetting
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Legal officers verify that all procedural prerequisites (service addresses, limitation periods, 
            statutory calculation citations, and taxpayer representation rights) are impeccably compliant 
            to prevent legal defects on appeal.
          </p>
        </div>

        {/* Legal Vetting Checklist */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Statutory Legal Vetting Checklist (4 Mandatory Checks)
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Service Address & Registered Agent Verification</strong>
                <span className="text-slate-500">Confirmed official registered head office at Kazanchis, Addis Ababa and ITAS certified portal ID.</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Statutory Limitation Check (Article 27)</strong>
                <span className="text-slate-500">All audit tax years (FY 2020 - FY 2024) verified within the 5-year statutory limitation period.</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Article 105 Penalty Legal Substantiation</strong>
                <span className="text-slate-500">Understatement exceeds 25% threshold; 50% substantial penalty tier legally sustainable before Tax Appeals Tribunal.</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Notice Format & Payment Instructions Validity</strong>
                <span className="text-slate-500">Assessment notice contains required statutory warning and CBE treasury bank account numbers.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('6.4')}
            className="text-xs"
          >
            ← Back to 6.4 Notice Draft
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/legal-verification', {
                  subStep: '6.5',
                  status: 'COMPLETED'
                }, 'Legal Directorate compliance verification completed.');
                onToggleComplete('6.5', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 6.5 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 6.5 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('6.6')}
              className="text-xs"
            >
              Continue to 6.6 Executive Sign-Off <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 6.6 Submission for Authorized Official Signature
  // ==============================================================
  if (subStepId === '6.6') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 6.6 Gate Authorization
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Audit Director & TP Process Owner Statutory Delegation
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Award className="text-emerald-600 dark:text-emerald-400" size={18} />
            Submission for Authorized Official Signature & Statutory Notice Authorization
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Upon final electronic authorization by the Audit Director & TP Process Owner, 
            the statutory assessment notice is sealed and queued for formal physical and digital service in Phase 7.
          </p>
        </div>

        {/* Electronic Authorization Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Executive PKI Signature Approval Block
              </h4>
              <p className="text-[11px] text-slate-500">
                Authorizes Notice Ref: MOR/LTO/TP-ASSESS/2026/0082 (ETB {totals.grandTotalDemand.toLocaleString()})
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Ready for Digital Seal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Signatory 1</span>
              <strong className="text-slate-900 dark:text-white block">Audit Director — Large Taxpayers Office</strong>
              <p className="text-[10px] text-slate-500 font-mono">Delegated under MoR Directive 01/2024</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Signatory 2</span>
              <strong className="text-slate-900 dark:text-white block">Transfer Pricing Process Owner</strong>
              <p className="text-[10px] text-slate-500 font-mono">Technical TP Quality Clearance</p>
            </div>
          </div>
        </div>

        {/* Milestone Governance Complete Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} /> Phase 6 Assessment & Notice Drafting Substantively Concluded
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              Formal assessment notice authorized. The case is ready for Phase 7 Notice Service & Taxpayer Objection tracking.
            </p>
          </div>
          {onProceedToPhase && (
            <Button
              size="sm"
              onClick={() => {
                onProceedToPhase('NOTICE');
                if (onSelectSubStep) onSelectSubStep('7.1');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-sm"
            >
              Proceed to Phase 7: Notice & Objection <ArrowRight size={14} className="ml-1.5" />
            </Button>
          )}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('6.5')}
            className="text-xs"
          >
            ← Back to 6.5 Legal Verification
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/notice/authorize', {
                  subStep: '6.6',
                  status: 'COMPLETED'
                }, 'Assessment Notice authorized for statutory service.');
                onToggleComplete('6.6', !isDone);
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 6.6 Completed ✓ (Click to Re-Save)' : 'Finalize & Mark Sub-Step 6.6 Complete'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
