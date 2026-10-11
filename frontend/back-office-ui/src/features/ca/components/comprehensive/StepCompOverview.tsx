import React from 'react';
import {
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Calendar,
  User,
  Building2,
  DollarSign,
  Scale,
  Cpu,
  Layers,
  MapPin
} from 'lucide-react';
import { AuditCase, AuditStats, MultiZoneAllocation } from '../../types/audit';

interface StepCompOverviewProps {
  caseData: AuditCase;
  stats: AuditStats;
  multiZoneAllocations?: MultiZoneAllocation[];
  onNavigateToStep: (stepIndex: number) => void;
  onUpdateCase: (updates: Partial<AuditCase>) => void;
}

export const StepCompOverview: React.FC<StepCompOverviewProps> = ({
  caseData,
  stats,
  multiZoneAllocations = [],
  onNavigateToStep,
  onUpdateCase
}) => {
  return (
    <div className="space-y-8">
      {/* Top Stat Grid: Real Audit Progress Counts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Comprehensive Audit Execution Metrics (SOR FR-04.4)
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Segment: {caseData.taxpayerSegment || 'LTO'} · Live Database State
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.evidenceCollected}/{stats.evidenceRequired}
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                {Math.round((stats.evidenceCollected / stats.evidenceRequired) * 100)}%
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Evidence Verified
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.proceduresCompleted}/{stats.proceduresTotal}
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                {Math.round((stats.proceduresCompleted / stats.proceduresTotal) * 100)}%
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Assertions Tested
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.queriesResolved}/{stats.queriesTotal}
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                {stats.queriesTotal > 0
                  ? Math.round((stats.queriesResolved / stats.queriesTotal) * 100)
                  : 100}
                %
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Query Sheets Closed
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.findings}
              </span>
              <span className="text-xs font-semibold text-rose-600">Established</span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Audit Findings
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.workingPapers}
              </span>
              <span className="text-xs font-semibold text-emerald-600">Indexed</span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Working Papers
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.progress}%
              </span>
              <span className="text-xs font-semibold text-indigo-700">Audit Completion</span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Overall Progress
            </span>
          </div>
        </div>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dossier Details & Planning (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Comprehensive Audit Case Dossier (SOR FR-04.2)</span>
              <span className="text-xs font-mono font-normal text-gray-500">
                Case ID: {caseData.id}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Taxpayer Entity & Segment</span>
                <p className="font-semibold text-gray-900 mt-0.5">{caseData.taxpayerName}</p>
                <p className="text-xs text-indigo-700 font-semibold">{caseData.taxpayerSegment || 'LTO'} (Large Taxpayer Office)</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Tax Identification Number</span>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">{caseData.tin}</p>
                <p className="text-xs text-gray-500">Registered Regimes: CIT, VAT, WHT, PAYE, Customs</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Multi-Year Audit Period</span>
                <p className="font-semibold text-gray-900 mt-0.5">{caseData.taxPeriod}</p>
                <p className="text-xs text-gray-500">Scope: Comprehensive Financial Statements & Tax Types</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Audit Mandate</span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  Comprehensive Multi-Disciplinary On-Site Audit
                </p>
                <p className="text-xs text-gray-500">Authority: Tax Administration Act Section 38 & SOR FR-04.4</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Audit Team & Lead</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {caseData.assignedAuditor} (Lead Auditor)
                </p>
                <p className="text-xs text-gray-500">{caseData.auditorEmail}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Audit Team Leader</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {caseData.teamLeader} (Supervisor)
                </p>
                <p className="text-xs text-gray-500">{caseData.teamLeaderEmail}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Audit Timeline</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Start: {caseData.startDate} · Due: {caseData.dueDate}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Materiality & Sampling (FR-04.2-04/06)</span>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">
                  Threshold: ${caseData.materialityThreshold?.toLocaleString() || '125,000'}
                </p>
                <p className="text-xs text-gray-500">Method: {caseData.samplingMethod || 'Stratified Sampling'}</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase">Approved Comprehensive Audit Scope</span>
              <p className="text-sm text-gray-800 mt-1 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                {caseData.auditScope}
              </p>
            </div>
          </div>

          {/* Risk Engine Criteria Card (FR-04.2-03) */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Risk Engine Selection Criteria (SOR FR-04.1 / FR-04.2-03)</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Risk Score:</span>
                <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {caseData.riskScore}/100 ({caseData.riskCategory})
                </span>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 p-3.5 rounded text-sm text-rose-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">{caseData.riskInformation}</p>
                <p className="text-xs text-rose-800">
                  Risk Engine Drivers: Turnovers in VAT returns deviate from CIT gross turnover by $1.82M; automated CAAT algorithms detected unusual inventory shrinkage (+41%) and unexplained payments to offshore tax havens.
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Zone Regional Operations Card (FR-04.4-31 to 33) */}
          {multiZoneAllocations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Multi-Zone Regional Refining Operations (FR-04.4-31)</span>
                </h4>
                <span className="text-xs text-gray-500 font-mono">Consolidated at Region Level</span>
              </div>

              <div className="space-y-2">
                {multiZoneAllocations.map((zone) => (
                  <div key={zone.branchCode} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{zone.zoneName}</span>
                      <span className="text-gray-500 font-mono">{zone.branchCode} · Declared Tax: ${zone.taxDeclared.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-700 font-bold font-mono text-sm block">+${zone.auditAdjustment.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Audit Adjustment</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tax Exposure & Action Plan (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tax Exposure Summary Box */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Total Identified Tax Exposure
              </span>
              <span className="text-xs text-gray-400">Section 45 Assessment</span>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-bold font-mono tabular-nums text-gray-900 tracking-tight">
                ${stats.totalTaxImpact.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Comprising principal tax shortfalls across CIT, VAT, and PAYE, statutory 20% penalty, and cumulative interest across {stats.findings} confirmed findings.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Materiality Filter:</span>
              <span className="font-mono font-medium text-gray-700">${caseData.materialityThreshold?.toLocaleString() || '125,000'}</span>
            </div>
          </div>

          {/* Comprehensive Audit Steps Navigator */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Comprehensive Audit Program Workflow
            </h4>

            <ul className="space-y-2 text-xs font-medium">
              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-gray-800">1. Entry Conference & Internal Controls (FR-04.2.1)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(1)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-gray-800">2. CAAT Automated Audit & Evidence (FR-04.4-01)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(2)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-gray-800">3. Procedures & Assertions Verification (FR-04.4-03)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(3)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-gray-800">4. Reconciliations: VAT, PAYE & Customs (FR-04.7-20)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(4)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-800">5. Formal Query Sheets Disposition (FR-04.4-05)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(5)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-gray-800">6. Substantive Findings & Fraud Screen (FR-04.4-28)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(6)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-gray-800">7. Indexed Working Papers (FR-04.7-01)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(7)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-gray-800">8. Exit Conference & Report (FR-04.7-02)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(8)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-800">9. Assessment Notice & Objection (FR-04.7-21)</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(9)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
