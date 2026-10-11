import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  MessageSquare,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  FileCheck2,
  AlertOctagon,
  UserCheck
} from 'lucide-react';
import { QACaseReview, QAReviewStatus } from '../types/audit';

interface QAInformationProgressTrackerProps {
  review: QACaseReview;
  onRefresh?: () => void;
  className?: string;
}

export const QAInformationProgressTracker: React.FC<QAInformationProgressTrackerProps> = ({
  review,
  onRefresh,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Determine active stage (1 to 4)
  const getStageIndex = (status: QAReviewStatus): number => {
    switch (status) {
      case 'IN_REVIEW':
      case 'RETURNED_TO_OFFICER':
      case 'PENDING_ASSIGNMENT':
        return 1;
      case 'PENDING_TL_REVIEW':
        return 2;
      case 'DEFICIENCY_ISSUED':
      case 'AUDIT_RESPONSE_RECEIVED':
        return 3;
      case 'PENDING_DIRECTOR_SIGNOFF':
        return 3.5;
      case 'PASSED_COMPLIANT':
      case 'PASSED_WITH_CONDITIONS':
      case 'REJECTED_REAUDIT_MANDATED':
        return 4;
      default:
        return 1;
    }
  };

  const currentStage = getStageIndex(review.status);

  // Status configuration
  const getStatusBadge = () => {
    switch (review.status) {
      case 'IN_REVIEW':
        return {
          label: 'Stage 1: Field Inspection & Checkpoint Scoring',
          color: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-600',
          nextAction: `Assigned QA Officer (${review.assignedQAOfficer}) is evaluating ISO 19011 checkpoints and evidence sufficiency.`
        };
      case 'RETURNED_TO_OFFICER':
        return {
          label: 'Stage 1: Returned for Refinement & Correction',
          color: 'bg-rose-100 text-rose-900 border-rose-300',
          dot: 'bg-rose-600 animate-pulse',
          nextAction: `QA Team Leader returned file to ${review.assignedQAOfficer} with specific technical adjustment directives.`
        };
      case 'PENDING_TL_REVIEW':
        return {
          label: 'Stage 2: Awaiting Supervisory Endorsement',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-600 animate-pulse',
          nextAction: `QA Team Leader (${review.qaTeamLeader}) is reviewing officer's findings to issue deficiency notice or recommend sign-off.`
        };
      case 'DEFICIENCY_ISSUED':
        return {
          label: 'Stage 3: Quality Deficiency Notice Served',
          color: 'bg-rose-100 text-rose-900 border-rose-300',
          dot: 'bg-rose-600 animate-pulse',
          nextAction: `Action required by Audit Team (${review.leadAuditor} & ${review.auditTeamLeader}): Mandatory remediation response required.`
        };
      case 'AUDIT_RESPONSE_RECEIVED':
        return {
          label: 'Stage 3: Audit Team Remediation Submitted',
          color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          dot: 'bg-indigo-600 animate-pulse',
          nextAction: `Remediation submitted by ${review.leadAuditor}. QA Team Leader (${review.qaTeamLeader}) verification in progress.`
        };
      case 'PENDING_DIRECTOR_SIGNOFF':
        return {
          label: 'Stage 4: Escalated for Executive Certification',
          color: 'bg-purple-100 text-purple-900 border-purple-300',
          dot: 'bg-purple-600 animate-pulse',
          nextAction: `Director of Quality Assurance (Dr. Arthur Pendelton) executive statutory review & certification pending.`
        };
      case 'PASSED_COMPLIANT':
        return {
          label: 'Stage 4: Officially Certified Compliant',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-600',
          nextAction: `Statutory ISO 19011 Certificate granted. Audit file cleared for statutory assessment issuance.`
        };
      case 'PASSED_WITH_CONDITIONS':
        return {
          label: 'Stage 4: Certified with Supervisory Conditions',
          color: 'bg-teal-100 text-teal-900 border-teal-300',
          dot: 'bg-teal-600',
          nextAction: `Conditional certification granted with ongoing post-audit compliance monitoring directives.`
        };
      case 'REJECTED_REAUDIT_MANDATED':
        return {
          label: 'Stage 4: Mandatory Full Re-Audit Ordered',
          color: 'bg-red-100 text-red-900 border-red-300',
          dot: 'bg-red-600',
          nextAction: `Statutory Re-Audit mandated under Tax Administration Act S.52. New audit team to be constituted.`
        };
      default:
        return {
          label: review.status.replace(/_/g, ' '),
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-500',
          nextAction: 'Information exchange in progress.'
        };
    }
  };

  const badgeInfo = getStatusBadge();

  // Find latest exchange event from audit trail
  const latestEvent = review.auditTrail?.[0];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all ${className}`}>
      {/* Header Bar: Status & Toggle */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs border border-indigo-400/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
                Information Exchange & Governance Progress
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-indigo-900 text-indigo-200 border border-indigo-700/60">
                SOR FR-04.5 Protocol
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-0.5">
              {review.caseNumber} · {review.taxpayerName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${badgeInfo.color}`}>
            <span className={`w-2 h-2 rounded-full ${badgeInfo.dot}`} />
            <span>{badgeInfo.label}</span>
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isExpanded ? 'Collapse Progress' : 'Expand Progress'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Workflow Pipeline & Exchange Timeline */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* 4-Stage Stepper Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-sans">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                currentStage >= 1
                  ? currentStage === 1
                    ? 'bg-blue-50 border-blue-400 shadow-2xs ring-1 ring-blue-400'
                    : 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-2xs font-bold text-slate-500">STAGE 1</span>
                {currentStage > 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <strong className="block text-xs text-slate-900 leading-tight">QA Inspection</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                {review.assignedQAOfficer} (Officer)
              </span>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                currentStage >= 2
                  ? currentStage === 2
                    ? 'bg-amber-50 border-amber-400 shadow-2xs ring-1 ring-amber-400'
                    : 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-2xs font-bold text-slate-500">STAGE 2</span>
                {currentStage > 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : currentStage === 2 ? (
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                ) : null}
              </div>
              <strong className="block text-xs text-slate-900 leading-tight">Supervisory Review</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                {review.qaTeamLeader} (QA TL)
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                currentStage >= 3
                  ? currentStage === 3
                    ? 'bg-rose-50 border-rose-400 shadow-2xs ring-1 ring-rose-400'
                    : currentStage === 3.5
                    ? 'bg-indigo-50 border-indigo-400 shadow-2xs ring-1 ring-indigo-400'
                    : 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-2xs font-bold text-slate-500">STAGE 3</span>
                {currentStage > 3.5 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : currentStage >= 3 ? (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                ) : null}
              </div>
              <strong className="block text-xs text-slate-900 leading-tight">Deficiency Remediation</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                {review.leadAuditor} (Audit Team)
              </span>
            </div>

            {/* Step 4 */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                currentStage >= 4
                  ? review.status === 'PASSED_COMPLIANT'
                    ? 'bg-emerald-50 border-emerald-400 shadow-2xs ring-1 ring-emerald-400'
                    : 'bg-red-50 border-red-400'
                  : currentStage === 3.5
                  ? 'bg-purple-50 border-purple-400 shadow-2xs ring-1 ring-purple-400'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-2xs font-bold text-slate-500">STAGE 4</span>
                {currentStage >= 4 ? (
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                ) : currentStage === 3.5 ? (
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                ) : null}
              </div>
              <strong className="block text-xs text-slate-900 leading-tight">Executive Sign-Off</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                Dr. Arthur Pendelton (Director)
              </span>
            </div>
          </div>

          {/* Real-time Information Progress Callout */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  Current Action Status
                </span>
                <span className="text-slate-800 font-medium">
                  {badgeInfo.nextAction}
                </span>
              </div>

              {latestEvent && (
                <span className="text-2xs font-mono text-slate-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Last Updated: {new Date(latestEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Information Exchange Timeline Log */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Formal Inter-Role Directives & Exchange Protocol
              </span>
              <span>Showing Recent Handshakes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* QA Team Leader Notice Card */}
              {review.qaTeamLeaderComment ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950">
                  <div className="flex items-center justify-between text-2xs font-mono text-amber-800 mb-1">
                    <span className="font-bold">QA Team Leader Directive ({review.qaTeamLeader})</span>
                    <span>{review.qaTeamLeaderDecisionDate ? new Date(review.qaTeamLeaderDecisionDate).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <p className="italic text-2xs leading-relaxed text-amber-900">
                    "{review.qaTeamLeaderComment}"
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50/60 border border-slate-200 rounded-lg text-slate-400 text-2xs italic flex items-center justify-center">
                  Awaiting QA Team Leader supervisory directive.
                </div>
              )}

              {/* Audit Team Response Card */}
              {review.auditTeamResponseNotes ? (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-950">
                  <div className="flex items-center justify-between text-2xs font-mono text-indigo-800 mb-1">
                    <span className="font-bold">Audit Team Remediation Response ({review.leadAuditor})</span>
                    <span>{review.auditTeamResponseDate ? new Date(review.auditTeamResponseDate).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <p className="italic text-2xs leading-relaxed text-indigo-900">
                    "{review.auditTeamResponseNotes}"
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50/60 border border-slate-200 rounded-lg text-slate-400 text-2xs italic flex items-center justify-center">
                  Audit Team has not submitted remediation response yet.
                </div>
              )}
            </div>

            {/* Director Executive Directive */}
            {review.directorExecutiveComment && (
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg text-purple-950 text-xs">
                <div className="flex items-center justify-between text-2xs font-mono text-purple-800 mb-1">
                  <span className="font-bold">Director Executive Statutory Order (Dr. Arthur Pendelton)</span>
                  <span>{review.directorExecutiveDecisionDate ? new Date(review.directorExecutiveDecisionDate).toLocaleDateString() : 'Recent'}</span>
                </div>
                <p className="font-semibold text-2xs leading-relaxed text-purple-900">
                  "{review.directorExecutiveComment}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QAInformationProgressTracker;
