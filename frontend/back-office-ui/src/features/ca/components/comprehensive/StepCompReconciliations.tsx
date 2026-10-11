import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Scale,
  DollarSign,
  BarChart2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ComprehensiveReconciliation, TaxAnalysis } from '../../types/audit';

interface StepCompReconciliationsProps {
  reconciliations: ComprehensiveReconciliation;
  analysis: TaxAnalysis;
  onUpdateReconciliations: (updates: Partial<ComprehensiveReconciliation>) => Promise<void>;
  onUpdateAnalysis: (updates: Partial<TaxAnalysis>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepCompReconciliations: React.FC<StepCompReconciliationsProps> = ({
  reconciliations,
  analysis,
  onUpdateReconciliations,
  onUpdateAnalysis,
  onTriggerAutosave
}) => {
  const [activeTab, setActiveTab] = useState<'statutoryRecons' | 'ratios' | 'financials' | 'anomalies'>('statutoryRecons');
  const [synthesisText, setSynthesisText] = useState(analysis.auditorSynthesis || '');
  const [conclusionText, setConclusionText] = useState(analysis.conclusion || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSynthesis = async () => {
    setIsSaving(true);
    try {
      await onUpdateAnalysis({
        auditorSynthesis: synthesisText,
        conclusion: conclusionText
      });
      onTriggerAutosave();
      alert('Comprehensive analytical synthesis saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Statutory Tax Reconciliations & Forensic Analytics (SOR FR-04.7-20 & FR-04.4-16)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              3 Discrepancies Flagged
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated reconciliation between 12-month VAT returns and Profit Tax turnover, 12-month PAYE vs P&L wage expenses, and ASYCUDA customs imports vs purchases.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded text-xs shrink-0">
          <button
            onClick={() => setActiveTab('statutoryRecons')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'statutoryRecons' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Statutory Cross-Reconciliations
          </button>
          <button
            onClick={() => setActiveTab('ratios')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'ratios' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Industry Ratio Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'financials' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Multi-Year P&L Trend
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

      {/* Tab 1: Statutory Cross-Reconciliations (FR-04.7-20) */}
      {activeTab === 'statutoryRecons' && (
        <div className="space-y-4">
          {/* Card 1: 12-Month VAT Gross Sales vs Profit Tax Gross Sales */}
          <div className="bg-white border border-rose-200 rounded p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  RECON-01 (FR-04.7-20)
                </span>
                <h4 className="text-xs font-bold text-gray-900">
                  12-Month Gross Sales per VAT Returns vs Profit Tax Gross Turnover
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                DISCREPANCY FLAGGED: $1,820,000 GAP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs text-center py-2 bg-gray-50 rounded border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">Annual CIT Turnover</span>
                <span className="font-bold text-gray-900">${reconciliations.vatVsSales.annualCitGrossTurnover.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">12-Month VAT-03 Declared</span>
                <span className="font-bold text-indigo-700">${reconciliations.vatVsSales.annualVatSalesDeclared.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">TIMS E-Invoices Registered</span>
                <span className="font-bold text-gray-700">${reconciliations.vatVsSales.timsElectronicInvoices.toLocaleString()}</span>
              </div>
              <div className="bg-rose-50 rounded p-1">
                <span className="text-[10px] text-rose-700 font-sans block uppercase font-bold">Unreconciled Variance</span>
                <span className="font-bold text-rose-800 text-sm">${reconciliations.vatVsSales.variance.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-rose-50/40 p-3 rounded border border-rose-100">
              <strong>Auditor Discrepancy Evaluation:</strong> {reconciliations.vatVsSales.notes}
            </p>
          </div>

          {/* Card 2: 12-Month Payroll PAYE vs P&L Salaries Expense */}
          <div className="bg-white border border-amber-200 rounded p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  RECON-02 (FR-04.7-20)
                </span>
                <h4 className="text-xs font-bold text-gray-900">
                  12-Month Aggregate PAYE Remittances vs P&L Salaries & Wages Expense
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                DISCREPANCY FLAGGED: $440,000 GAP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center py-2 bg-gray-50 rounded border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">P&L Staff Costs Deducted</span>
                <span className="font-bold text-gray-900">${reconciliations.payrollPayeVsPnL.pnlSalariesExpense.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">12-Month PAYE Remitted Base</span>
                <span className="font-bold text-indigo-700">${reconciliations.payrollPayeVsPnL.payrollPayeRemitted.toLocaleString()}</span>
              </div>
              <div className="bg-amber-50 rounded p-1">
                <span className="text-[10px] text-amber-700 font-sans block uppercase font-bold">Untaxed Payroll Spread</span>
                <span className="font-bold text-amber-800 text-sm">${reconciliations.payrollPayeVsPnL.variance.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-amber-50/40 p-3 rounded border border-amber-100">
              <strong>Auditor Discrepancy Evaluation:</strong> {reconciliations.payrollPayeVsPnL.notes}
            </p>
          </div>

          {/* Card 3: Customs ASYCUDA Imports vs Purchase Ledger (FR-04.4-16) */}
          <div className="bg-white border border-indigo-200 rounded p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  RECON-03 (FR-04.4-16)
                </span>
                <h4 className="text-xs font-bold text-gray-900">
                  Customs ASYCUDA CIF Import Declarations vs General Ledger Raw Material Purchases
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                DISCREPANCY FLAGGED: $2,250,000 UPLIFT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center py-2 bg-gray-50 rounded border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">ASYCUDA Customs CIF Value</span>
                <span className="font-bold text-gray-900">${reconciliations.customsImportsVsPurchases.asycudaCifImports.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-sans block uppercase">General Ledger Raw Materials</span>
                <span className="font-bold text-indigo-700">${reconciliations.customsImportsVsPurchases.generalLedgerImportCosts.toLocaleString()}</span>
              </div>
              <div className="bg-indigo-50 rounded p-1">
                <span className="text-[10px] text-indigo-700 font-sans block uppercase font-bold">Transfer Pricing Uplift</span>
                <span className="font-bold text-indigo-800 text-sm">${reconciliations.customsImportsVsPurchases.variance.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-indigo-50/40 p-3 rounded border border-indigo-100">
              <strong>Auditor Discrepancy Evaluation:</strong> {reconciliations.customsImportsVsPurchases.notes}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Ratios Benchmarks (FR-04.4-06 & 14) */}
      {activeTab === 'ratios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.ratios.map((ratio) => {
            const isNegative = ratio.variancePct < 0;
            const isHighRisk = ratio.riskLevel === 'HIGH';

            return (
              <div key={ratio.name} className="bg-white border border-gray-200 rounded p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{ratio.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-rose-50 text-rose-800 border-rose-200">
                    {ratio.riskLevel} RISK
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-2xl font-bold font-mono text-gray-900 tabular-nums">
                      {ratio.taxpayerValue}{ratio.unit}
                    </span>
                    <span className="text-[11px] text-gray-400 block">Taxpayer</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-semibold font-mono text-gray-600 tabular-nums">
                      {ratio.benchmarkValue}{ratio.unit}
                    </span>
                    <span className="text-[11px] text-gray-400 block">Sector Benchmark</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Variance:</span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${isHighRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
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
      )}

      {/* Tab 3: Multi-Year Financials */}
      {activeTab === 'financials' && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
            Three-Year Comparative Financials (FY2022 - FY2024)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-600 text-[11px] font-semibold uppercase">
                  <th className="py-2.5 px-4">Metric</th>
                  {analysis.annualFinancials.map((f) => (
                    <th key={f.year} className="py-2.5 px-4 text-right font-mono">FY {f.year}</th>
                  ))}
                  <th className="py-2.5 px-4 text-right">3-Yr Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">Gross Turnover</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums">${f.revenue.toLocaleString()}</td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-emerald-600 font-sans font-bold">+29.5% ↑</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-gray-900">Cost of Goods Sold (COGS)</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums">${f.cogs.toLocaleString()}</td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-600 font-sans font-bold">+43.4% ↑↑</td>
                </tr>
                <tr className="bg-rose-50/40 font-bold">
                  <td className="py-2.5 px-4 font-sans text-rose-900">Taxable Net Income</td>
                  {analysis.annualFinancials.map((f) => (
                    <td key={f.year} className="py-2.5 px-4 text-right tabular-nums text-rose-900">${f.taxableIncome.toLocaleString()}</td>
                  ))}
                  <td className="py-2.5 px-4 text-right text-rose-700 font-sans">-63.7% ↓↓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="space-y-3">
          {analysis.anomalies.map((anm) => (
            <div key={anm.id} className="p-4 rounded border bg-rose-50/50 border-rose-200 text-rose-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
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
            </div>
          ))}
        </div>
      )}

      {/* Synthesis Editor */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
            Comprehensive Analytical Commentary & Statutory Synthesis
          </h4>
          <button
            type="button"
            onClick={handleSaveSynthesis}
            disabled={isSaving}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Reconciliations Synthesis'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
              Root Cause & Revenue Reconciliation Analysis
            </label>
            <textarea
              rows={4}
              value={synthesisText}
              onChange={(e) => setSynthesisText(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-xs leading-relaxed"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
              Audit Conclusion on Reconciliations & Disallowances
            </label>
            <textarea
              rows={4}
              value={conclusionText}
              onChange={(e) => setConclusionText(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-xs leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
