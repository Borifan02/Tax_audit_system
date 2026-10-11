import React, { useState, useMemo } from 'react';
import { 
  BarChart2, Scale, CheckCircle2, AlertTriangle, 
  Layers, Check, ArrowRight, TrendingUp, Sliders,
  HelpCircle, Database, Calculator, Filter, Percent,
  ChevronDown, ChevronUp, FileSpreadsheet, Eye, Save,
  AlertOctagon, Info, Building2, Globe, Shield, RefreshCw
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select } from '../../../../components/ui/index.jsx';

// 5 Statutory Transfer Pricing Methods under Directive 43/2015 Art. 5
const STATUTORY_METHODS = [
  {
    code: 'CUP',
    name: 'Comparable Uncontrolled Price (CUP)',
    tier: 'Transactional Traditional Method',
    status: 'EVALUATED_REJECTED',
    suitabilityScore: 32,
    statutoryBasis: 'Directive No. 43/2015 Art. 5(1)(a)',
    rationale: 'Rejected. No direct uncontrolled sales of identical active pharmaceutical ingredients (APIs) in the Ethiopian domestic market. High sensitivity of chemical formulations and strict patent restrictions make external CUP unreliable without material adjustments that cannot be reliably quantified.'
  },
  {
    code: 'RPM',
    name: 'Resale Price Method (RPM)',
    tier: 'Transactional Traditional Method',
    status: 'EVALUATED_REJECTED',
    suitabilityScore: 45,
    statutoryBasis: 'Directive No. 43/2015 Art. 5(1)(b)',
    rationale: 'Rejected. Taxpayer does not act as a pure reseller. The local Akaki plant performs significant contract toll-manufacturing, formulation blending, packaging, and local branding, altering the goods substantially before domestic sale.'
  },
  {
    code: 'CPM',
    name: 'Cost Plus Method (CPM)',
    tier: 'Transactional Traditional Method',
    status: 'EVALUATED_REJECTED',
    suitabilityScore: 54,
    statutoryBasis: 'Directive No. 43/2015 Art. 5(1)(c)',
    rationale: 'Rejected. Material differences in accounting classifications of manufacturing cost of goods sold (COGS) versus operating overheads (SG&A) between Ethiopian GAAP/IFRS and foreign benchmark candidates undermine gross margin comparability.'
  },
  {
    code: 'TNMM',
    name: 'Transactional Net Margin Method (TNMM)',
    tier: 'Transactional Profit Method (Selected MAM)',
    status: 'SELECTED_MAM',
    suitabilityScore: 96,
    statutoryBasis: 'Directive No. 43/2015 Art. 5(1)(d)',
    rationale: 'SELECTED AS MOST APPROPRIATE METHOD (MAM). TNMM examines net profit relative to an appropriate base (sales). Net margins are less affected by transactional and functional differences than price or gross markups. High availability of reliable audited net margin data for pharmaceutical distributors in emerging markets makes TNMM the most robust statutory method.'
  },
  {
    code: 'PSM',
    name: 'Profit Split Method (PSM)',
    tier: 'Transactional Profit Method',
    status: 'EVALUATED_REJECTED',
    suitabilityScore: 28,
    statutoryBasis: 'Directive No. 43/2015 Art. 5(1)(e)',
    rationale: 'Rejected. The local entity does not make unique, highly valuable, non-routine contributions to the controlled transaction. Its functions are routine distribution and toll manufacturing; a two-sided profit split is unnecessary and inappropriate.'
  }
];

// Multi-Year Segmented Financials (FY 2020 - FY 2024)
const DEFAULT_SEGMENTAL_DATA = [
  {
    year: 'FY 2020',
    controlledTurnover: 210000000,
    uncontrolledTurnover: 50000000,
    totalTurnover: 260000000,
    controlledCogs: 151200000,
    controlledSga: 54600000,
    controlledEbit: 4200000,
    controlledMargin: 2.00,
    uncontrolledMargin: 9.60,
    totalMargin: 3.46
  },
  {
    year: 'FY 2021',
    controlledTurnover: 255000000,
    uncontrolledTurnover: 55000000,
    totalTurnover: 310000000,
    controlledCogs: 188700000,
    controlledSga: 61200000,
    controlledEbit: 5100000,
    controlledMargin: 2.00,
    uncontrolledMargin: 8.91,
    totalMargin: 3.23
  },
  {
    year: 'FY 2022',
    controlledTurnover: 310000000,
    uncontrolledTurnover: 65000000,
    totalTurnover: 375000000,
    controlledCogs: 232500000,
    controlledSga: 72850000,
    controlledEbit: 4650000,
    controlledMargin: 1.50,
    uncontrolledMargin: 8.23,
    totalMargin: 2.67
  },
  {
    year: 'FY 2023',
    controlledTurnover: 350000000,
    uncontrolledTurnover: 65000000,
    totalTurnover: 415000000,
    controlledCogs: 271250000,
    controlledSga: 75250000,
    controlledEbit: 3500000,
    controlledMargin: 1.00,
    uncontrolledMargin: 7.69,
    totalMargin: 2.05
  },
  {
    year: 'FY 2024',
    controlledTurnover: 380000000,
    uncontrolledTurnover: 70000000,
    totalTurnover: 450000000,
    controlledCogs: 296400000,
    controlledSga: 77900000,
    controlledEbit: 5700000,
    controlledMargin: 1.50,
    uncontrolledMargin: 7.86,
    totalMargin: 2.49
  }
];

// 7 Accepted Peer Comparables (Pan-African & Emerging Market Benchmarking)
const ACCEPTED_COMPARABLES = [
  {
    id: 'COMP-01',
    companyName: 'East Africa Healthcare Distribution Ltd',
    country: 'Kenya',
    bvdId: 'KE-1029482',
    nace: '46.46 - Wholesale of pharmaceutical goods',
    independence: 'A (Independent > 50%)',
    turnoverUsd: 28400000,
    marginYr1: 4.0,
    marginYr2: 4.3,
    marginYr3: 4.3,
    weightedAvgMargin: 4.20,
    workingCapitalAdjMargin: 4.10,
    description: 'Wholesale distribution of ethical pharmaceuticals, vaccines, and diagnostic supplies.'
  },
  {
    id: 'COMP-02',
    companyName: 'MedPharm Logistics SA',
    country: 'South Africa',
    bvdId: 'ZA-8849201',
    nace: '46.46 - Wholesale of pharmaceutical goods',
    independence: 'A (Independent > 50%)',
    turnoverUsd: 42100000,
    marginYr1: 4.9,
    marginYr2: 5.2,
    marginYr3: 5.2,
    weightedAvgMargin: 5.10,
    workingCapitalAdjMargin: 4.95,
    description: 'Specialized healthcare logistics, third-party contract storage, and hospital delivery.'
  },
  {
    id: 'COMP-03',
    companyName: 'Nile Valley Pharmaceutical Supplies Corp',
    country: 'Egypt',
    bvdId: 'EG-3391024',
    nace: '21.20 / 46.46 - Pharmaceutical trade & packaging',
    independence: 'B (Independent > 50%)',
    turnoverUsd: 36500000,
    marginYr1: 5.8,
    marginYr2: 6.2,
    marginYr3: 6.3,
    weightedAvgMargin: 6.10,
    workingCapitalAdjMargin: 5.95,
    description: 'Contract tableting, secondary packaging, and nationwide ethical drug distribution.'
  },
  {
    id: 'COMP-04',
    companyName: 'AfroMed Supplies & Logistics Co',
    country: 'Ghana',
    bvdId: 'GH-9018472',
    nace: '46.46 - Wholesale of pharmaceutical goods',
    independence: 'A (Independent > 50%)',
    turnoverUsd: 19800000,
    marginYr1: 6.5,
    marginYr2: 6.8,
    marginYr3: 6.8,
    weightedAvgMargin: 6.70,
    workingCapitalAdjMargin: 6.40,
    description: 'Regional distributor of generic hospital pharmaceuticals and cold-chain biologics.'
  },
  {
    id: 'COMP-05',
    companyName: 'Rift Valley Medical Distributors Ltd',
    country: 'Tanzania',
    bvdId: 'TZ-7718290',
    nace: '46.46 - Wholesale of pharmaceutical goods',
    independence: 'A (Independent > 50%)',
    turnoverUsd: 22400000,
    marginYr1: 7.1,
    marginYr2: 7.5,
    marginYr3: 7.6,
    weightedAvgMargin: 7.40,
    workingCapitalAdjMargin: 7.20,
    description: 'Procurement and distribution of medical disposables and prescription pharmaceuticals.'
  },
  {
    id: 'COMP-06',
    companyName: 'Atlas Pharma Trade Sarl',
    country: 'Morocco',
    bvdId: 'MA-5510293',
    nace: '46.46 - Wholesale of pharmaceutical goods',
    independence: 'B (Independent > 50%)',
    turnoverUsd: 31200000,
    marginYr1: 7.9,
    marginYr2: 8.3,
    marginYr3: 8.4,
    weightedAvgMargin: 8.20,
    workingCapitalAdjMargin: 8.00,
    description: 'Pharmaceutical wholesaler serving private clinics, pharmacies, and regional hospital depots.'
  },
  {
    id: 'COMP-07',
    companyName: 'Zenith Healthcare Solutions Ltd',
    country: 'Mauritius (Third-Party Domestic Operator)',
    bvdId: 'MU-4401928',
    nace: '46.46 - Wholesale of pharmaceutical goods',
    independence: 'A (Independent > 50%)',
    turnoverUsd: 18500000,
    marginYr1: 8.6,
    marginYr2: 9.0,
    marginYr3: 9.1,
    weightedAvgMargin: 8.90,
    workingCapitalAdjMargin: 8.70,
    description: 'Domestic pharmaceutical distribution in Indian Ocean rim with cold-chain warehousing.'
  }
];

export default function Phase4SubSteps({
  subStepId,
  onSelectSubStep,
  onProceedToPhase,
  isReadOnly,
  fullState,
  selectedMethod,
  setSelectedMethod,
  methodJustification,
  setMethodJustification,
  iqrMin,
  setIqrMin,
  iqrMedian,
  setIqrMedian,
  iqrMax,
  setIqrMax,
  taxpayerResult,
  setTaxpayerResult,
  varianceAmt,
  setVarianceAmt,
  completedSubSteps = [],
  onToggleComplete,
  saving,
  executeApiAction
}) {
  const isDone = completedSubSteps.includes(subStepId);

  // Local state for interactive editing and enrichment
  const [methods, setMethods] = useState(STATUTORY_METHODS);
  const [activeMAM, setActiveMAM] = useState(selectedMethod || 'TNMM');
  const [segmentalData, setSegmentalData] = useState(DEFAULT_SEGMENTAL_DATA);
  const [comparables, setComparables] = useState(ACCEPTED_COMPARABLES);
  const [selectedPli, setSelectedPli] = useState('OPERATING_MARGIN');

  // Working Capital Adjustment parameters
  const [wcInterestRate, setWcInterestRate] = useState(14.50); // NBE commercial rate %
  const [wcApplied, setWcApplied] = useState(true);

  // Dynamic IQR calculations from comparable margins
  const iqrStats = useMemo(() => {
    const margins = comparables
      .map(c => wcApplied ? c.workingCapitalAdjMargin : c.weightedAvgMargin)
      .sort((a, b) => a - b);

    const min = margins[0]; // 4.10 or 4.20
    const max = margins[margins.length - 1]; // 8.70 or 8.90
    const q1 = margins[1]; // 25th percentile ~4.95 or 5.10
    const median = margins[3]; // Median ~6.40 or 6.70
    const q3 = margins[5]; // 75th percentile ~8.00 or 8.20

    return { min, q1, median, q3, max, margins };
  }, [comparables, wcApplied]);

  // Sync to parent workspace state
  const currentActualResult = taxpayerResult || 1.50; // Tested party operating margin
  const isOutsideIqr = currentActualResult < iqrStats.q1 || currentActualResult > iqrStats.q3;
  const targetArmLengthPoint = iqrStats.median; // Statutory adjustment to MEDIAN under Art. 79

  // Calculate statutory multi-year adjustments
  const adjustmentCalc = useMemo(() => {
    // FY 2024 calculation
    const fy24ControlledTurnover = 380000000;
    const marginShortfallPct = Math.max(0, targetArmLengthPoint - currentActualResult); // 6.40 - 1.50 = 4.90%
    const fy24PrimaryAdjustment = (fy24ControlledTurnover * marginShortfallPct) / 100; // 18,620,000

    // Cumulative 5-year primary adjustment across FY 2020 - FY 2024
    const cumulativeAdjustment = 26800000; // ETB 26.8M

    return {
      marginShortfallPct,
      fy24PrimaryAdjustment,
      cumulativeAdjustment
    };
  }, [targetArmLengthPoint, currentActualResult]);

  // Sub-step navigation helper
  const navigateSubStep = (step) => {
    if (onSelectSubStep) onSelectSubStep(step);
  };

  // ==============================================================
  // 4.1 Most Appropriate Method (MAM) Selection
  // ==============================================================
  if (subStepId === '4.1') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 4.1 Economic Analysis
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Transfer Pricing Directive No. 43/2015 Art. 5 & Proclamation 979/2016 Art. 79
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Scale className="text-blue-600 dark:text-blue-400" size={18} />
            Most Appropriate Method (MAM) Selection & Statutory Rejection Matrix
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 5 of Directive No. 43/2015, the auditor must evaluate all 5 approved transfer pricing methods 
            and select the one that provides the highest degree of comparability. 
            The rejection of higher-tier transactional methods must be formally justified.
          </p>
        </div>

        {/* 5 Methods Detailed Evaluation Matrix */}
        <div className="grid grid-cols-1 gap-3">
          {methods.map((m) => {
            const isSelected = m.code === activeMAM;
            return (
              <div 
                key={m.code}
                onClick={() => {
                  if (!isReadOnly) {
                    setActiveMAM(m.code);
                    if (setSelectedMethod) setSelectedMethod(m.code);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {m.code}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {m.name}
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Selected MAM ✓
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {m.statutoryBasis} • {m.tier}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px]">
                      <span className="text-slate-400 uppercase text-[9px] block font-bold">Suitability Index</span>
                      <strong className={`font-mono ${isSelected ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                        {m.suitabilityScore} / 100
                      </strong>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isSelected ? 'SELECTED' : 'REJECTED'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Statutory Evaluation & Rationale:
                  </span>
                  {m.rationale}
                </div>
              </div>
            );
          })}
        </div>

        {/* Auditor Method Selection Memo */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-blue-600" />
            Formal MAM Justification Memorandum for Technical Committee
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Pursuant to Article 5 of Transfer Pricing Directive No. 43/2015, the <strong>Transactional Net Margin Method (TNMM)</strong> is 
            formally designated as the Most Appropriate Method for testing the taxpayer’s controlled transactions. 
            Because the local entity functions as a limited-risk distributor and toll-manufacturer, 
            testing its net operating margin against independent distributors in emerging markets yields 
            the most reliable, objective, and statistically defensible arm’s length benchmark.
          </p>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProceedToPhase && onProceedToPhase('FIELD_WORK')}
            className="text-xs"
          >
            ← Back to Phase 3: Field Work
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/method-selection', {
                  selectedMethod: activeMAM,
                  methods,
                  subStep: '4.1',
                  status: 'COMPLETED'
                }, 'MAM Selection and Rejection Matrix recorded.');
                onToggleComplete('4.1', !isDone, { selectedMethod: activeMAM });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 4.1 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 4.1 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('4.2')}
              className="text-xs"
            >
              Continue to 4.2 Tested Party <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 4.2 Tested Party Identification & Segmental P&L
  // ==============================================================
  if (subStepId === '4.2') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-sky-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Phase 4.2 Economic Analysis
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              UN TP Practical Manual Ch. 6 & Directive 43/2015 Art. 6
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Building2 className="text-indigo-600 dark:text-indigo-400" size={18} />
            Tested Party Designation & 5-Year Segmental P&L Verification
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under international standard principles, the tested party is the participant with the least complex functional profile, 
            which does not own unique, valuable intangible assets. The Ethiopian affiliate is designated as the tested party.
          </p>

          <div className="mt-3 p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900 flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Designated Tested Party</span>
              <strong className="text-indigo-700 dark:text-indigo-300 text-sm">Apex Healthcare Ethiopia SC (Local Affiliate)</strong>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Primary Selection Criteria</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">Routine functions, zero patented intangibles, full audited IFRS accounts</span>
            </div>
          </div>
        </div>

        {/* 5-Year Segmental Profitability Breakdown Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-indigo-600" />
              Segmented Operating Margins: Controlled vs. Uncontrolled Business
            </h4>
            <Badge variant="outline" className="text-xs font-mono">
              FY 2020 - FY 2024 Audit Scope
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Fiscal Year</th>
                  <th className="p-3 text-right">Controlled Revenue (ETB)</th>
                  <th className="p-3 text-right">Uncontrolled Revenue (ETB)</th>
                  <th className="p-3 text-right">Total Revenue (ETB)</th>
                  <th className="p-3 text-right font-semibold text-indigo-700 dark:text-indigo-300">Controlled EBIT (ETB)</th>
                  <th className="p-3 text-right font-bold text-red-600 dark:text-red-400">Controlled Margin %</th>
                  <th className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Uncontrolled Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {segmentalData.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{row.year}</td>
                    <td className="p-3 text-right font-mono">{row.controlledTurnover.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-500">{row.uncontrolledTurnover.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold">{row.totalTurnover.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                      {row.controlledEbit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20">
                      {row.controlledMargin.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                      {row.uncontrolledMargin.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Striking Profit Disparity Card */}
        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-600" />
              Evidentiary Internal Profit Disparity Analysis
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-2xl">
              In FY 2024, the taxpayer earned a mere <strong>1.50% operating margin</strong> on related-party controlled transactions 
              versus <strong>7.86% operating margin</strong> on domestic third-party transactions. 
              This internal discrepancy provides compelling evidentiary prima facie proof of systematic artificial profit suppression.
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-700 text-center shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Margin Variance</span>
            <strong className="text-lg font-bold text-red-600 font-mono">-6.36%</strong>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('4.1')}
            className="text-xs"
          >
            ← Back to 4.1 MAM Selection
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/tested-party', {
                  testedParty: 'Apex Healthcare Ethiopia SC',
                  segmentalData,
                  subStep: '4.2',
                  status: 'COMPLETED'
                }, 'Tested Party and Segmental Financials saved.');
                onToggleComplete('4.2', !isDone, { segmentalData });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 4.2 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 4.2 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('4.3')}
              className="text-xs"
            >
              Continue to 4.3 PLI Selection <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 4.3 Profit Level Indicator (PLI) Selection
  // ==============================================================
  if (subStepId === '4.3') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
              Phase 4.3 Economic Analysis
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Directive No. 43/2015 Art. 6 & OECD Transfer Pricing Guidelines Ch. 2
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Percent className="text-purple-600 dark:text-purple-400" size={18} />
            Profit Level Indicator (PLI) Selection & Mathematical Formula
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            The Profit Level Indicator (PLI) measures the relationship between profit and resources employed. 
            For a distributor and contract assembler, the ratio of Operating Profit to Sales (Operating Margin) 
            is the internationally recognized standard.
          </p>
        </div>

        {/* 4 PLI Options Comparative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PLI 1: Operating Margin (Selected) */}
          <div 
            onClick={() => setSelectedPli('OPERATING_MARGIN')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedPli === 'OPERATING_MARGIN'
                ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            } shadow-sm space-y-2`}
          >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                SELECTED STATUTORY PLI ✓
              </span>
              <strong className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                OM = EBIT / Net Sales
              </strong>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Operating Margin (OM / ROS)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard PLI for distribution, marketing, and contract manufacturing entities. Reflects return on sales volume.
            </p>
            <div className="pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between text-xs">
              <span className="text-slate-500">Tested Party FY 2024 Value:</span>
              <strong className="font-mono text-red-600 font-bold">1.50%</strong>
            </div>
          </div>

          {/* PLI 2: Full Cost Mark-up (FCMU / Berry) */}
          <div 
            onClick={() => setSelectedPli('FCMU')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedPli === 'FCMU'
                ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            } shadow-sm space-y-2`}
          >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ALTERNATIVE PLI
              </span>
              <strong className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                NCP = EBIT / Total Costs
              </strong>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Full Cost Mark-up (Net Cost Plus)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard PLI for pure service providers and toll manufacturers where sales price is determined by the principal.
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
              <span className="text-slate-500">Tested Party FY 2024 Value:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">1.52%</strong>
            </div>
          </div>

          {/* PLI 3: Berry Ratio */}
          <div 
            onClick={() => setSelectedPli('BERRY_RATIO')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedPli === 'BERRY_RATIO'
                ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            } shadow-sm space-y-2`}
          >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                SECONDARY CHECK
              </span>
              <strong className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                BR = Gross Profit / SG&A
              </strong>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Berry Ratio
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Appropriate for pure intermediary distributors that do not employ significant depreciable physical assets.
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
              <span className="text-slate-500">Tested Party FY 2024 Value:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">1.07</strong>
            </div>
          </div>

          {/* PLI 4: Return on Capital Employed (ROCE) */}
          <div 
            onClick={() => setSelectedPli('ROCE')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedPli === 'ROCE'
                ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            } shadow-sm space-y-2`}
          >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                CAPITAL INTENSIVE
              </span>
              <strong className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                ROCE = EBIT / Operating Assets
              </strong>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Return on Capital Employed (ROCE)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Measures asset utilization efficiency. Useful for heavy manufacturing; sensitive to asset valuation differences.
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
              <span className="text-slate-500">Tested Party FY 2024 Value:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">2.25%</strong>
            </div>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('4.2')}
            className="text-xs"
          >
            ← Back to 4.2 Tested Party
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/pli-selection', {
                  selectedPli,
                  testedPartyValue: currentActualResult,
                  subStep: '4.3',
                  status: 'COMPLETED'
                }, 'Profit Level Indicator recorded as Operating Margin.');
                onToggleComplete('4.3', !isDone, { selectedPli });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 4.3 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 4.3 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('4.4')}
              className="text-xs"
            >
              Continue to 4.4 Comparables Search <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 4.4 Comparable Search & Screening Strategy
  // ==============================================================
  if (subStepId === '4.4') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-cyan-950/20 border border-teal-200 dark:border-teal-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white uppercase tracking-wider">
              Phase 4.4 Economic Analysis
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Directive No. 43/2015 Art. 7 & BvD Orbis Database Search
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Database className="text-teal-600 dark:text-teal-400" size={18} />
            6-Step Quantitative Screening Funnel & Accepted Peer Comparables Matrix
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            A systematic search was performed across Pan-African and emerging market pharmaceutical distributors. 
            All screening filters (independence, financial completeness, functional comparability) are fully replicable.
          </p>
        </div>

        {/* 6-Step Funnel Visual Flow */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Quantitative Screening Funnel (842 Initial Candidates → 7 Accepted Peers)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Industry NACE</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">842</strong>
              <span className="text-[10px] text-slate-500 block">Pharma Trade</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Geography</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">186</strong>
              <span className="text-[10px] text-slate-500 block">Sub-Saharan / MENA</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Independence</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">64</strong>
              <span className="text-[10px] text-slate-500 block">&gt;50% Independent</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">4. Data Availability</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">32</strong>
              <span className="text-[10px] text-slate-500 block">3 Cons. Years Audited</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">5. Functional Review</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">14</strong>
              <span className="text-[10px] text-slate-500 block">No R&D / Brand Own.</span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">6. Final Matrix</span>
              <strong className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">7</strong>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Accepted Peers</span>
            </div>
          </div>
        </div>

        {/* 7 Accepted Peer Comparables Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Accepted Peer Group Dataset ({comparables.length} Entities)
            </h4>
            <Badge variant="outline" className="text-xs font-mono">
              3-Year Weighted Average Margins
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Independence</th>
                  <th className="p-3 text-right">Turnover (USD)</th>
                  <th className="p-3 text-right">Yr 1 %</th>
                  <th className="p-3 text-right">Yr 2 %</th>
                  <th className="p-3 text-right">Yr 3 %</th>
                  <th className="p-3 text-right font-bold text-blue-700 dark:text-blue-300">Weighted Avg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {comparables.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <strong className="text-slate-900 dark:text-white block font-semibold">{c.companyName}</strong>
                      <span className="text-[10px] text-slate-400 truncate block max-w-xs">{c.description}</span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{c.country}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{c.independence}</td>
                    <td className="p-3 text-right font-mono">${(c.turnoverUsd / 1000000).toFixed(1)}M</td>
                    <td className="p-3 text-right font-mono text-slate-500">{c.marginYr1.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono text-slate-500">{c.marginYr2.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono text-slate-500">{c.marginYr3.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20">
                      {c.weightedAvgMargin.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('4.3')}
            className="text-xs"
          >
            ← Back to 4.3 PLI Selection
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/comparables', {
                  comparables,
                  subStep: '4.4',
                  status: 'COMPLETED'
                }, 'Accepted Peer Comparables matrix saved.');
                onToggleComplete('4.4', !isDone, { comparables });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 4.4 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 4.4 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('4.5')}
              className="text-xs"
            >
              Continue to 4.5 Working Capital <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 4.5 Economic & Working Capital Adjustments
  // ==============================================================
  if (subStepId === '4.5') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-indigo-950/20 border border-cyan-200 dark:border-cyan-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white uppercase tracking-wider">
              Phase 4.5 Economic Analysis
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              OECD Transfer Pricing Guidelines Annex to Chapter III
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Sliders className="text-cyan-600 dark:text-cyan-400" size={18} />
            Economic & Working Capital Adjustments (DSO, DIO, DPO)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Working capital adjustments eliminate differences in financial carrying costs associated with trade receivables, 
            inventory holdings, and trade payables between the tested party and peer comparables.
          </p>
        </div>

        {/* Working Capital Parameters & Calculator */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Working Capital Financing Rates & Term Days
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Benchmark interest rate benchmarked against National Bank of Ethiopia (NBE) prime rate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Apply Adjustment to IQR:</span>
              <Button
                size="sm"
                variant={wcApplied ? 'default' : 'outline'}
                onClick={() => setWcApplied(!wcApplied)}
                className="text-xs"
              >
                {wcApplied ? 'Working Capital Applied ✓' : 'Unadjusted Margins'}
              </Button>
            </div>
          </div>

          {/* Working Capital Metrics Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Receivables (DSO)</span>
              <div className="flex justify-between items-baseline">
                <span>Tested Party: <strong className="font-mono text-slate-900 dark:text-white">94 Days</strong></span>
                <span className="text-slate-500">Peer Avg: <strong className="font-mono">62 Days</strong></span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Taxpayer grants longer credit terms; carries higher financing cost.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Inventory Holding (DIO)</span>
              <div className="flex justify-between items-baseline">
                <span>Tested Party: <strong className="font-mono text-slate-900 dark:text-white">118 Days</strong></span>
                <span className="text-slate-500">Peer Avg: <strong className="font-mono">78 Days</strong></span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Taxpayer maintains substantial buffer stock due to Ethiopian import logistics.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Trade Payables (DPO)</span>
              <div className="flex justify-between items-baseline">
                <span>Tested Party: <strong className="font-mono text-slate-900 dark:text-white">45 Days</strong></span>
                <span className="text-slate-500">Peer Avg: <strong className="font-mono">60 Days</strong></span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Parent requires early settlement, increasing working capital burden.
              </p>
            </div>
          </div>

          {/* Adjusted Margins Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-2.5">Comparable Entity</th>
                  <th className="p-2.5 text-right">Unadjusted OM %</th>
                  <th className="p-2.5 text-right font-mono">Receivables Adj %</th>
                  <th className="p-2.5 text-right font-mono">Inventory Adj %</th>
                  <th className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-300">Adjusted OM %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {comparables.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2.5 font-medium">{c.companyName}</td>
                    <td className="p-2.5 text-right font-mono text-slate-500">{c.weightedAvgMargin.toFixed(2)}%</td>
                    <td className="p-2.5 text-right font-mono text-slate-400">-0.08%</td>
                    <td className="p-2.5 text-right font-mono text-slate-400">-0.12%</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                      {c.workingCapitalAdjMargin.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('4.4')}
            className="text-xs"
          >
            ← Back to 4.4 Comparables Search
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/working-capital', {
                  wcInterestRate,
                  wcApplied,
                  subStep: '4.5',
                  status: 'COMPLETED'
                }, 'Working Capital Adjustments calculated and saved.');
                onToggleComplete('4.5', !isDone, { wcInterestRate, wcApplied });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 4.5 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 4.5 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('4.6')}
              className="text-xs"
            >
              Continue to 4.6 IQR & Adjustments <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 4.6 Interquartile Range (IQR) & Adjustment Calculation
  // ==============================================================
  if (subStepId === '4.6') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Phase 4.6 Milestone Closure
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Directive No. 43/2015 Art. 7(2) & Proclamation 979/2016 Art. 79
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <BarChart2 className="text-blue-600 dark:text-blue-400" size={18} />
            Interquartile Range (IQR) Benchmarking & Statutory Median Adjustment
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 7(2) of Directive No. 43/2015, if the taxpayer’s profit level indicator falls outside the 
            arm’s length interquartile range (between the 25th and 75th percentiles), 
            the tax administration must adjust the tax base to the <strong>MEDIAN (50th percentile)</strong>.
          </p>
        </div>

        {/* Visual Statistical IQR Distribution Bar */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Statistical Arm’s Length Interquartile Distribution (7 Peers)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated on {wcApplied ? 'Working Capital Adjusted' : 'Unadjusted'} 3-Year Operating Margins
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
              Tested Party (1.50%) OUTSIDE IQR!
            </span>
          </div>

          {/* Graphical IQR Box & Pointer */}
          <div className="relative pt-6 pb-4 px-2">
            {/* Range Bar */}
            <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden flex">
              {/* Outer Lower Tail (Min to Q1) */}
              <div style={{ width: '25%' }} className="bg-amber-100 dark:bg-amber-950/40 border-r border-slate-300 dark:border-slate-700" />
              {/* Interquartile Range Core (Q1 to Q3) */}
              <div style={{ width: '50%' }} className="bg-emerald-100 dark:bg-emerald-950/60 relative">
                {/* Median Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-emerald-600 shadow-md" />
              </div>
              {/* Outer Upper Tail (Q3 to Max) */}
              <div style={{ width: '25%' }} className="bg-amber-100 dark:bg-amber-950/40 border-l border-slate-300 dark:border-slate-700" />
            </div>

            {/* Tested Party Flag Marker */}
            <div className="mt-3 flex justify-between text-xs">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Minimum</span>
                <strong className="font-mono text-slate-700 dark:text-slate-300">{iqrStats.min.toFixed(2)}%</strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">25th Pct (Q1)</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{iqrStats.q1.toFixed(2)}%</strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-blue-600 uppercase font-bold block">Median (Target)</span>
                <strong className="font-mono text-blue-700 dark:text-blue-300 text-sm font-bold">{iqrStats.median.toFixed(2)}%</strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">75th Pct (Q3)</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{iqrStats.q3.toFixed(2)}%</strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Maximum</span>
                <strong className="font-mono text-slate-700 dark:text-slate-300">{iqrStats.max.toFixed(2)}%</strong>
              </div>
            </div>
          </div>

          {/* Tested Party Deficiency Highlight Banner */}
          <div className="p-4 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                <AlertOctagon size={13} /> Statutory Non-Compliance Detected
              </span>
              <p className="text-xs text-red-900 dark:text-red-200 leading-relaxed">
                Tested party reported an operating margin of <strong>1.50%</strong>, which is below the lower quartile boundary of <strong>{iqrStats.q1.toFixed(2)}%</strong>. 
                Pursuant to Directive No. 43/2015 Art. 7(2), the tax base must be adjusted to the statutory <strong>Median of {iqrStats.median.toFixed(2)}%</strong>.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Margin Shortfall</span>
              <strong className="text-lg font-bold text-red-600 font-mono">+{adjustmentCalc.marginShortfallPct.toFixed(2)}%</strong>
            </div>
          </div>
        </div>

        {/* Mathematical Primary Adjustment Schedule */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-indigo-800/60 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator size={15} className="text-indigo-400" />
                Statutory Transfer Pricing Primary Adjustment Computation
              </h4>
              <span className="text-[11px] text-slate-300 font-mono">
                Formula: Audited Controlled Turnover × (Arm's Length Median OM% - Taxpayer Actual OM%)
              </span>
            </div>
            <Badge className="bg-indigo-500 text-white text-xs">
              Primary Tax Base Adjustment
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <span className="text-[10px] text-indigo-300 uppercase font-bold block">FY 2024 Controlled Sales</span>
              <strong className="text-base font-bold font-mono block mt-1">ETB 380,000,000</strong>
              <span className="text-[10px] text-slate-400">Audited related party revenue</span>
            </div>

            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <span className="text-[10px] text-indigo-300 uppercase font-bold block">FY 2024 Primary Adjustment</span>
              <strong className="text-base font-bold font-mono text-emerald-400 block mt-1">
                ETB {adjustmentCalc.fy24PrimaryAdjustment.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-400">380M × 4.90% margin uplift</span>
            </div>

            <div className="p-3 bg-emerald-500/20 rounded-xl backdrop-blur-sm border border-emerald-400/30">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Cumulative 5-Year Adjustment</span>
              <strong className="text-xl font-bold font-mono text-emerald-300 block mt-1">
                ETB {adjustmentCalc.cumulativeAdjustment.toLocaleString()}
              </strong>
              <span className="text-[10px] text-emerald-200">Total additional taxable income (FY20-FY24)</span>
            </div>
          </div>
        </div>

        {/* Milestone Governance Complete Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Phase 4 Economic Analysis Substantively Concluded
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              The primary transfer pricing adjustment of <strong>ETB 26,800,000</strong> is statistically computed and documented. 
              The case is ready for Phase 5 TP Audit Report & Formal Exit Conference.
            </p>
          </div>
          {onProceedToPhase && (
            <Button
              size="sm"
              onClick={() => {
                onProceedToPhase('REPORT');
                if (onSelectSubStep) onSelectSubStep('5.1');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-sm"
            >
              Proceed to Phase 5: Audit Report & Exit Conf. <ArrowRight size={14} className="ml-1.5" />
            </Button>
          )}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('4.5')}
            className="text-xs"
          >
            ← Back to 4.5 Working Capital
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const calculatedVariance = adjustmentCalc.cumulativeAdjustment;
                if (setVarianceAmt) setVarianceAmt(calculatedVariance);
                if (setIqrMin) setIqrMin(iqrStats.q1);
                if (setIqrMedian) setIqrMedian(iqrStats.median);
                if (setIqrMax) setIqrMax(iqrStats.q3);

                await executeApiAction('/economic-analysis', {
                  iqrStats,
                  adjustmentCalc,
                  subStep: '4.6',
                  status: 'COMPLETED'
                }, 'Economic Analysis & IQR Median Adjustment locked into case repository.');
                onToggleComplete('4.6', !isDone, { iqrStats, adjustmentCalc });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 4.6 Completed ✓ (Click to Re-Save)' : 'Finalize & Mark Sub-Step 4.6 Complete'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
