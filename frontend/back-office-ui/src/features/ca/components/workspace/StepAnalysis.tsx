import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  BarChart3,
  Scale,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { TaxAnalysis } from '../../types/audit';

interface StepAnalysisProps {
  analysis: TaxAnalysis;
  onUpdateAnalysis: (updates: Partial<TaxAnalysis>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepAnalysis: React.FC<StepAnalysisProps> = ({
  analysis,
  onUpdateAnalysis,
  onTriggerAutosave
}) => {
  const [synthesisText, setSynthesisText] = useState(analysis.auditorSynthesis || '');
  const [conclusionText, setConclusionText] = useState(analysis.conclusion || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratios' | 'history' | 'quarterly' | 'anomalies'>('ratios');

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateAnalysis({
        auditorSynthesis: synthesisText,
        conclusion: conclusionText
      });
      onTriggerAutosave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Taxpayer Financial, Ratio & Variance Analysis
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare annual turnover, verify input/output VAT balances, and benchmark profit margins against sector standards.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded text-xs">
          <button
            onClick={() => setActiveTab('ratios')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'ratios' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ratio Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'history' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Multi-Year P&L
          </button>
          <button
            onClick={() => setActiveTab('quarterly')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'quarterly' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quarterly VAT & Sales
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'anomalies' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            System Anomalies ({analysis.anomalies.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Ratio Benchmarks */}
      {activeTab === 'ratios' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.ratios.map((ratio) => {
              const isNegative = ratio.variancePct < 0;
              const isHighRisk = ratio.riskLevel === 'HIGH';

              return (
                <div
                  key={ratio.name}
                  className="bg-white border border-gray-200 rounded p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{ratio.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isHighRisk
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {ratio.riskLevel} RISK
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-2xl font-bold font-mono text-gray-900 tabular-nums">
                        {ratio.taxpayerValue}
                        {ratio.unit}
                      </span>
                      <span className="text-[11px] text-gray-400 block">Taxpayer</span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-semibold font-mono text-gray-600 tabular-nums">
                        {ratio.benchmarkValue}
                        {ratio.unit}
                      </span>
                      <span className="text-[11px] text-gray-400 block">Industry Benchmark</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Variance:</span>
                    <span
                      className={`font-mono font-bold flex items-center gap-1 ${
                        isHighRisk ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isNegative ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      {ratio.variancePct > 0 ? `+${ratio.variancePct}%` : `${ratio.variancePct}%`}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 leading-snug">
                    {ratio.interpretation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Year P&L Comparison */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
            Three-Year Comparative Financials & Tax Liability (USD)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Financial Metric</th>
                  {analysis.annualFinancials.map((f) => (
                    <th key={f.year} className="py-2.5 px-4 text-right font-mono">
                      FY {f.year}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right">3-Yr Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">Gross Turnover / Revenue</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-gray-900">
                      ${f.revenue.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold font-sans">
                    +35.9% ↑
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">Cost of Goods Sold (COGS)</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                      ${f.cogs.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-600 font-semibold font-sans">
                    +59.8% ↑↑
                  </td>
                </tr>
                <tr className="bg-gray-50/40 font-semibold">
                  <td className="py-2.5 px-4 font-sans text-gray-900">Gross Profit</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-indigo-700">
                      ${f.grossProfit.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-amber-600 font-sans">
                    +9.2%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">Operating Expenses</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                      ${f.operatingExpenses.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-600 font-semibold font-sans">
                    +46.6% ↑
                  </td>
                </tr>
                <tr className="bg-rose-50/40 font-bold">
                  <td className="py-2.5 px-4 font-sans text-rose-900">Taxable Net Income</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-rose-900">
                      ${f.taxableIncome.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-700 font-sans">
                    -58.6% ↓↓
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">Corporate Tax Declared</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-gray-900">
                      ${f.taxDeclared.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-600 font-semibold font-sans">
                    -58.6% ↓↓
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">VAT Input Claimed</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                      ${f.vatInput.toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-600 font-semibold font-sans">
                    +108.9% ↑↑
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Quarterly VAT & Sales */}
      {activeTab === 'quarterly' && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
            FY2024 Quarterly Trend & Input VAT Claims
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4 text-right">Revenue</th>
                  <th className="py-2.5 px-4 text-right">COGS</th>
                  <th className="py-2.5 px-4 text-right">Operating Exp.</th>
                  <th className="py-2.5 px-4 text-right">Input VAT Claimed</th>
                  <th className="py-2.5 px-4 text-right">Variance %</th>
                  <th className="py-2.5 px-4">Auditor Risk Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {analysis.quarterlyData.map((q) => (
                  <tr key={q.quarter} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-4 font-sans font-bold text-gray-900">{q.quarter}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">${q.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">${q.cogs.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">${q.expenses.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-indigo-700">
                      ${q.vatInputClaimed.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">
                      <span className={q.variance > 10 ? 'text-rose-600 font-bold' : 'text-gray-600'}>
                        +{q.variance}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-gray-600 text-[11px]">{q.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="space-y-3">
          {analysis.anomalies.map((anm) => (
            <div
              key={anm.id}
              className={`p-4 rounded border ${
                anm.severity === 'CRITICAL'
                  ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                  : 'bg-amber-50/50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      anm.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs">{anm.title}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-gray-300">
                        {anm.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1">{anm.description}</p>
                    <p className="text-[11px] text-gray-600 mt-1 font-mono">
                      Auditor Investigation: {anm.auditorNotes}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                  Flagged: {anm.identifiedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auditor Analytical Synthesis & Conclusions */}
      <div className="bg-white border border-gray-200 rounded p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Auditor Analytical Commentary & Synthesis (Desk Audit Requirement)
            </h4>
            <p className="text-[11px] text-gray-500">
              Summarize financial trends, margin erosion reasons, and audit procedure linkages.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Analysis'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1 uppercase text-[10px]">
              Analytical Observations & Root Cause Synthesis
            </label>
            <textarea
              rows={4}
              value={synthesisText}
              onChange={(e) => setSynthesisText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              placeholder="Record analytical commentary on margin variances, sales suppression, or unverified cost spikes..."
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 uppercase text-[10px]">
              Audit Conclusion on Preliminary Inquiries
            </label>
            <textarea
              rows={4}
              value={conclusionText}
              onChange={(e) => setConclusionText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              placeholder="State final analytical determination, recommended audit adjustments, or escalation flags..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
