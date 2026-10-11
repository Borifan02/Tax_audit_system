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
  Scale
} from 'lucide-react';
import { AuditCase, AuditStats } from '../../types/audit';

interface StepOverviewProps {
  caseData: AuditCase;
  stats: AuditStats;
  onNavigateToStep: (stepIndex: number) => void;
}

export const StepOverview: React.FC<StepOverviewProps> = ({
  caseData,
  stats,
  onNavigateToStep
}) => {
  return (
    <div className="space-y-8">
      {/* Top Stat Grid: Real Audit Progress Counts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Real-Time Audit Progress Metrics
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Calculated from database records
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
              Procedures Done
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
              Queries Resolved
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900">
                {stats.findings}
              </span>
              <span className="text-xs font-semibold text-rose-600">Tax Issue</span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Findings Identified
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
              <span className="text-xs font-semibold text-indigo-700">Weighted</span>
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 block">
              Audit Completion
            </span>
          </div>
        </div>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Briefing details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Statutory Audit Briefing</span>
              <span className="text-xs font-mono font-normal text-gray-500">
                Case ID: {caseData.id}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Taxpayer Entity</span>
                <p className="font-semibold text-gray-900 mt-0.5">{caseData.taxpayerName}</p>
                <p className="text-xs text-gray-500">{caseData.tradeName}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Tax Identification Number</span>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">{caseData.tin}</p>
                <p className="text-xs text-gray-500">Registered Tax Regime: CIT, VAT, WHT</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Tax Audit Period</span>
                <p className="font-semibold text-gray-900 mt-0.5">{caseData.taxPeriod} (FY{caseData.taxYear})</p>
                <p className="text-xs text-gray-500">Annual Return & Q1-Q4 Assessments</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Audit Mandate</span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {caseData.auditType === 'COMPREHENSIVE_AUDIT' ? 'Comprehensive On-Site Audit' : 'Desk Audit'}
                </p>
                <p className="text-xs text-gray-500">Statutory Authority: Tax Admin Act Sec. 38</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Assigned Auditor</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {caseData.assignedAuditor}
                </p>
                <p className="text-xs text-gray-500">{caseData.auditorEmail}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Supervising Team Leader</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {caseData.teamLeader}
                </p>
                <p className="text-xs text-gray-500">{caseData.teamLeaderEmail}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Initiation Date</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {caseData.startDate}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Statutory Due Date</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {caseData.dueDate}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase">Approved Audit Scope</span>
              <p className="text-sm text-gray-800 mt-1 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                {caseData.auditScope}
              </p>
            </div>
          </div>

          {/* Risk Information card */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Automated Risk Profile & Intelligence</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Risk Score:</span>
                <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {caseData.riskScore}/100 ({caseData.riskCategory})
                </span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded text-sm text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">{caseData.riskInformation}</p>
                <p className="text-xs text-amber-800">
                  Recommendation: Prioritize revenue cross-checks against bank statements and electronic invoicing logs (TIMS).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Action Checklist & Exposure (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tax Exposure Summary Box */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Identified Tax Exposure
              </span>
              <span className="text-xs text-gray-400">Total Potential Adjustment</span>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-bold font-mono tabular-nums text-gray-900 tracking-tight">
                ${stats.totalTaxImpact.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Includes principal tax under-declaration, statutory 20% penalty, and cumulative interest across {stats.findings} recorded findings.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Escalation Threshold:</span>
              <span className="font-mono font-medium text-gray-700">$50,000 Material Discrepancy</span>
            </div>
            {stats.totalTaxImpact >= 50000 && (
              <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                Threshold met: Case is eligible for Comprehensive Audit Escalation if intentional non-compliance is verified.
              </div>
            )}
          </div>

          {/* Action Checklist */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Audit Action Plan & Status
            </h4>

            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stats.evidenceCollected >= stats.evidenceRequired ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-gray-800">
                    Collect & verify required evidence ({stats.evidenceCollected}/{stats.evidenceRequired})
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToStep(1)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Evidence <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stats.proceduresPending === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-gray-800">
                    Complete outstanding procedures ({stats.proceduresCompleted}/{stats.proceduresTotal})
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToStep(2)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Procedures <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-800">Perform variance & financial ratio analysis</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(3)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Analysis <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stats.queriesResolved === stats.queriesTotal ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-gray-800">
                    Resolve active taxpayer queries ({stats.queriesResolved}/{stats.queriesTotal})
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToStep(4)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Queries <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stats.findings > 0 ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                  <span className="text-gray-800">
                    Formulate and record audit findings ({stats.findings} recorded)
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToStep(5)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Findings <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stats.workingPapers >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-gray-800">
                    Maintain audit working paper files ({stats.workingPapers} filed)
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToStep(6)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Working Papers <ArrowRight className="w-3 h-3" />
                </button>
              </li>

              <li className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-800">Compile statutory Draft Audit Report</span>
                </div>
                <button
                  onClick={() => onNavigateToStep(7)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-xs"
                >
                  Draft Report <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
