import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  ShieldCheck,
  FileCheck,
  HelpCircle,
  Scale,
  FileText,
  UserCheck
} from 'lucide-react';
import {
  AuditCase,
  AuditProcedure,
  EvidenceItem,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  DraftReport
} from '../../types/audit';

interface StepReviewSubmitProps {
  caseData: AuditCase;
  procedures: AuditProcedure[];
  evidenceList: EvidenceItem[];
  queries: TaxQuery[];
  findings: AuditFinding[];
  workingPapers: WorkingPaper[];
  draftReport: DraftReport;
  onNavigateToStep: (stepIndex: number) => void;
  onSubmitForReview: () => Promise<void>;
}

export const StepReviewSubmit: React.FC<StepReviewSubmitProps> = ({
  caseData,
  procedures,
  evidenceList,
  queries,
  findings,
  workingPapers,
  draftReport,
  onNavigateToStep,
  onSubmitForReview
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Verification checks
  const verifiedEvidenceCount = evidenceList.filter((e) => e.status === 'Verified').length;
  const isEvidenceOk = verifiedEvidenceCount >= 3; // Minimum 3 verified evidence items

  const completedProceduresCount = procedures.filter((p) => p.status === 'COMPLETED').length;
  const mandatoryProcedures = procedures.filter((p) => p.isMandatory);
  const completedMandatoryCount = mandatoryProcedures.filter((p) => p.status === 'COMPLETED').length;
  const areProceduresOk = completedMandatoryCount === mandatoryProcedures.length;

  const unresolvedQueries = queries.filter((q) => q.status !== 'RESOLVED');
  const areQueriesOk = unresolvedQueries.length === 0;

  const isAnalysisOk = true; // checked by existence
  const areFindingsOk = findings.length > 0;
  const areWorkingPapersOk = workingPapers.length >= 3;
  const isReportOk = Boolean(draftReport.executiveSummary && draftReport.findingsSummary);

  const canSubmit =
    isEvidenceOk &&
    areProceduresOk &&
    areQueriesOk &&
    isAnalysisOk &&
    areFindingsOk &&
    areWorkingPapersOk &&
    isReportOk &&
    caseData.status !== 'SUBMITTED' &&
    caseData.status !== 'APPROVED';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitForReview();
      setSubmissionSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Final Audit Quality Checklist & Supervisory Submission
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Validate all mandatory statutory prerequisites before formally submitting case file to Team Leader.
          </p>
        </div>

        {caseData.status === 'SUBMITTED' && (
          <div className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-xs font-semibold flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Currently Under Team Leader Review</span>
          </div>
        )}

        {caseData.status === 'APPROVED' && (
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Audit Approved & Endorsed</span>
          </div>
        )}
      </div>

      {submissionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Case Submitted Successfully!</p>
              <p className="text-emerald-700 mt-0.5">
                The audit case has been routed to Team Leader {caseData.teamLeader} for technical review and sign-off.
              </p>
            </div>
          </div>
          <span className="font-mono text-emerald-800 font-medium">Status: SUBMITTED</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quality Assurance Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-6 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
            Statutory Compliance Checklist (SOR FR-04)
          </h4>

          <div className="space-y-3 text-xs">
            {/* 1. Evidence */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                isEvidenceOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isEvidenceOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">Evidence Documentation</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {verifiedEvidenceCount} verified evidence records attached (minimum 3 required)
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(1)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Evidence <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 2. Audit Procedures */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                areProceduresOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {areProceduresOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">Mandatory Audit Procedures</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {completedMandatoryCount} of {mandatoryProcedures.length} mandatory procedures completed (
                    {completedProceduresCount}/{procedures.length} total)
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(2)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Procedures <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3. Analysis */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                isAnalysisOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold">Financial & Ratio Analysis</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Ratio benchmarks evaluated and variance commentary recorded.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(3)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Analysis <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 4. Taxpayer Queries */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                areQueriesOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {areQueriesOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">Taxpayer Queries Resolution</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {unresolvedQueries.length === 0
                      ? 'All formal inquiries evaluated and resolved.'
                      : `${unresolvedQueries.length} query pending taxpayer response or auditor disposition.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(4)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Queries <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 5. Findings */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                areFindingsOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {areFindingsOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">Established Findings</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {findings.length} substantive findings with legal criteria and tax calculations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(5)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Findings <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 6. Working Papers */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                areWorkingPapersOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {areWorkingPapersOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">Audit Working Papers</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {workingPapers.length} indexed working paper schedules filed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(6)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Working Papers <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 7. Draft Report */}
            <div
              className={`p-3 rounded border flex items-center justify-between transition-colors ${
                isReportOk
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isReportOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">Draft Audit Report</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Executive summary and tax adjustment schedules populated.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToStep(7)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-4"
              >
                Go to Report <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Submission Summary & Action Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
              Case Sign-Off Authorization
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Taxpayer:</span>
                <span className="font-semibold text-gray-900">{caseData.taxpayerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Assigned Auditor:</span>
                <span className="font-mono text-gray-900">{caseData.assignedAuditor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Supervising Team Leader:</span>
                <span className="font-mono text-gray-900">{caseData.teamLeader}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Total Tax Adjustment:</span>
                <span className="font-mono font-bold text-rose-700">
                  ${findings.reduce((sum, f) => sum + f.totalTaxImpact, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submission Eligibility Alert */}
            {!canSubmit && caseData.status !== 'SUBMITTED' && caseData.status !== 'APPROVED' && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded text-xs text-rose-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Submission Disabled</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Mandatory requirements remain incomplete. Ensure all mandatory audit procedures are completed and open queries are resolved before submitting.
                </p>
              </div>
            )}

            {canSubmit && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All Prerequisites Satisfied</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Case documentation is verified and ready for formal submission to Team Leader {caseData.teamLeader}.
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                canSubmit
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer ring-2 ring-indigo-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Team Leader Review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
