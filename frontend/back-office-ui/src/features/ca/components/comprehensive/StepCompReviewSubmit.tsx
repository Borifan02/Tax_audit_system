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
  UserCheck,
  Cpu,
  Layers,
  Users
} from 'lucide-react';
import {
  AuditCase,
  AuditProcedure,
  EvidenceItem,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  EntryConference,
  CAATAuditData,
  ComprehensiveReconciliation,
  ExitConference,
  AssessmentNotice
} from '../../types/audit';

interface StepCompReviewSubmitProps {
  caseData: AuditCase;
  procedures: AuditProcedure[];
  evidenceList: EvidenceItem[];
  queries: TaxQuery[];
  findings: AuditFinding[];
  workingPapers: WorkingPaper[];
  entryConference?: EntryConference;
  caatAudit?: CAATAuditData;
  reconciliations?: ComprehensiveReconciliation;
  exitConference?: ExitConference;
  assessmentNotice?: AssessmentNotice;
  onNavigateToStep: (stepIndex: number) => void;
  onSubmitForReview: () => void;
}

export const StepCompReviewSubmit: React.FC<StepCompReviewSubmitProps> = ({
  caseData,
  procedures,
  evidenceList,
  queries,
  findings,
  workingPapers,
  entryConference,
  caatAudit,
  reconciliations,
  exitConference,
  assessmentNotice,
  onNavigateToStep,
  onSubmitForReview
}) => {
  const [confirmedChecklist, setConfirmedChecklist] = useState<Record<string, boolean>>({});

  // Real compliance checks
  const isEntryConfDone = Boolean(entryConference && (entryConference.status === 'CONDUCTED' || entryConference.status === 'CONFIRMED'));
  const isCAATExecuted = Boolean(caatAudit && caatAudit.rules && caatAudit.rules.length > 0);
  const totalProcedures = procedures.length;
  const completedProcedures = procedures.filter((p) => p.status === 'COMPLETED').length;
  const mandatoryCompleted = procedures.filter((p) => p.isMandatory && p.status === 'COMPLETED').length;
  const totalMandatory = procedures.filter((p) => p.isMandatory).length;
  const openQueries = queries.filter((q) => q.status === 'OPEN' || q.status === 'OVERDUE').length;
  const verifiedEvidence = evidenceList.filter((e) => e.status === 'Verified').length;
  const totalFindings = findings.length;
  const isExitConfDone = Boolean(exitConference && (exitConference.status === 'COMPLETED' || exitConference.status === 'SIGNED'));
  const isNoticeReady = Boolean(assessmentNotice && assessmentNotice.totalAssessmentDue > 0);

  const checklistItems = [
    {
      id: 'chk_entry_conf',
      title: 'Statutory Entry Conference Conducted & Minutes Signed',
      standard: 'SOR FR-04.4-04',
      isPassed: isEntryConfDone,
      statusText: isEntryConfDone ? 'Entry Conference Conducted & Confirmed' : 'Entry Conference pending',
      stepIndex: 1
    },
    {
      id: 'chk_caat_evidence',
      title: 'CAAT Forensic Analytics Executed & Evidence Verified',
      standard: 'SOR FR-04.4-01 & 02',
      isPassed: isCAATExecuted && verifiedEvidence >= 3,
      statusText: `${verifiedEvidence} evidence items verified · CAAT rules executed`,
      stepIndex: 2
    },
    {
      id: 'chk_procedures',
      title: 'Mandatory Substantive Audit Procedures Completed',
      standard: 'SOR FR-04.4-12',
      isPassed: mandatoryCompleted === totalMandatory && completedProcedures > 0,
      statusText: `${mandatoryCompleted} of ${totalMandatory} mandatory procedures finalized (${completedProcedures}/${totalProcedures} total)`,
      stepIndex: 3
    },
    {
      id: 'chk_reconciliations',
      title: '3-Way Statutory Reconciliations (VAT vs CIT, PAYE, ASYCUDA Customs)',
      standard: 'SOR FR-04.7-20',
      isPassed: Boolean(reconciliations),
      statusText: reconciliations ? 'VAT, PAYE and Customs reconciliations completed' : 'Reconciliations pending',
      stepIndex: 4
    },
    {
      id: 'chk_queries',
      title: 'Statutory Tax Queries Answered & Resolved',
      standard: 'Tax Administration Act',
      isPassed: openQueries === 0,
      statusText: openQueries === 0 ? 'All queries resolved or closed' : `${openQueries} open/overdue query pending resolution`,
      stepIndex: 5
    },
    {
      id: 'chk_findings',
      title: 'Substantive Non-Compliance Findings & Penalty Schedules Documented',
      standard: 'SOR FR-04.4-15',
      isPassed: totalFindings > 0,
      statusText: `${totalFindings} finding(s) documented with statutory tax impact`,
      stepIndex: 6
    },
    {
      id: 'chk_working_papers',
      title: 'Comprehensive Audit Working Papers File Completed',
      standard: 'SOR FR-04.4-19',
      isPassed: workingPapers.length >= 2,
      statusText: `${workingPapers.length} working papers documented`,
      stepIndex: 7
    },
    {
      id: 'chk_exit_conf',
      title: 'Exit Conference Deliberations Recorded & Protocol Signed',
      standard: 'SOR FR-04.7-24',
      isPassed: isExitConfDone,
      statusText: isExitConfDone ? 'Exit minutes signed with taxpayer concessions' : 'Exit conference pending',
      stepIndex: 8
    },
    {
      id: 'chk_assessment_notice',
      title: 'Statutory Notice of Assessment Generated (30-Day Period)',
      standard: 'SOR FR-04.7-26',
      isPassed: isNoticeReady,
      statusText: isNoticeReady ? `Assessment notice generated: $${assessmentNotice?.totalAssessmentDue.toLocaleString()}` : 'Notice pending calculation',
      stepIndex: 8
    }
  ];

  const totalChecks = checklistItems.length;
  const passedChecks = checklistItems.filter((i) => i.isPassed).length;
  const isReadyToSubmit = passedChecks >= 7;

  const totalTaxExposure = findings.reduce((sum, f) => sum + f.totalTaxImpact, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Comprehensive Tax Audit Final Quality Checklist & Sign-Off (SOR FR-04.4 & FR-04.7)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Verify completion of all mandatory statutory procedures, cross-tax head reconciliations, exit conference protocols, and assessment determinations prior to Team Leader endorsement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-mono font-bold rounded border ${
                caseData.status === 'SUBMITTED'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : caseData.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : caseData.status === 'REFERRED_TO_FRAUD_INVESTIGATION'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              Current Status: {caseData.status}
            </span>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-gray-50 p-3.5 rounded border border-gray-200">
            <span className="text-2xs font-bold text-gray-500 uppercase block">Compliance Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-gray-900">{passedChecks}/{totalChecks}</span>
              <span className="text-xs font-bold text-indigo-700">
                {Math.round((passedChecks / totalChecks) * 100)}% Criteria Met
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded border border-gray-200">
            <span className="text-2xs font-bold text-gray-500 uppercase block">Total Additional Tax Assessment</span>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
              ${totalTaxExposure.toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded border border-gray-200">
            <span className="text-2xs font-bold text-gray-500 uppercase block">Auditor & Supervisor</span>
            <div className="text-xs font-bold text-gray-900 mt-1">
              {caseData.assignedAuditor} (Auditor)
            </div>
            <div className="text-2xs text-gray-500">
              Supervisor: {caseData.teamLeader}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-white rounded border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Mandatory Statutory Verification Checklist
          </h4>
          <span className="text-2xs text-gray-500 font-mono">
            ITAS Audit Quality Framework (ISO 19011 Aligned)
          </span>
        </div>

        <div className="divide-y divide-gray-200">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.isPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{item.title}</span>
                    <span className="text-2xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                      {item.standard}
                    </span>
                  </div>
                  <div className="text-2xs text-gray-500 mt-0.5">{item.statusText}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateToStep(item.stepIndex)}
                  className="px-3 py-1.5 text-2xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors flex items-center gap-1"
                >
                  <span>Go to Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Card */}
      <div className="bg-white rounded border border-gray-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Submit Comprehensive Audit File for Team Leader Sign-Off
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Once submitted, case status will change to <span className="font-mono font-bold text-amber-700">SUBMITTED</span>. The Team Leader will review cross-tax head adjustments, exit conference protocols, and endorse issuance of the formal Assessment Notice.
            </p>
          </div>

          <button
            onClick={onSubmitForReview}
            disabled={caseData.status === 'SUBMITTED' || caseData.status === 'APPROVED'}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>
              {caseData.status === 'SUBMITTED'
                ? 'Case Already Submitted'
                : caseData.status === 'APPROVED'
                ? 'Audit Approved'
                : 'Submit for Team Leader Review'}
            </span>
          </button>
        </div>

        {caseData.teamLeaderComment && (
          <div className="p-3.5 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900">
            <span className="font-bold">Latest Team Leader Technical Endorsement:</span>
            <p className="mt-1 font-mono text-2xs text-blue-800">{caseData.teamLeaderComment}</p>
          </div>
        )}
      </div>
    </div>
  );
};
