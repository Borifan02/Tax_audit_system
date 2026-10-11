import React from 'react';
import {
  ChevronRight,
  Calendar,
  User,
  Briefcase,
  Hash,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  ShieldAlert,
  ArrowUpRight,
  FolderSync
} from 'lucide-react';
import { AuditCase, SaveStatus } from '../../types/audit';

interface AuditHeaderProps {
  caseData: AuditCase;
  saveStatus: SaveStatus;
  lastSaved: string;
  progressPct: number;
  onOpenAuditTrail: () => void;
  onOpenEscalation: () => void;
  onOpenTeamLeaderReview: () => void;
  onSwitchCase: () => void;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({
  caseData,
  saveStatus,
  lastSaved,
  progressPct,
  onOpenAuditTrail,
  onOpenEscalation,
  onOpenTeamLeaderReview,
  onSwitchCase
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'SUBMITTED':
        return {
          label: 'Submitted for Review',
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'RETURNED_FOR_CORRECTION':
        return {
          label: 'Returned for Correction',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500'
        };
      case 'APPROVED':
        return {
          label: 'Audit Approved',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'ESCALATED_COMPREHENSIVE':
        return {
          label: 'Escalated to Comprehensive',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500'
        };
      default:
        return {
          label: status.replace('_', ' '),
          color: 'bg-gray-50 text-gray-800 border-gray-200',
          dot: 'bg-gray-400'
        };
    }
  };

  const statusInfo = getStatusBadge(caseData.status);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
      {/* Returned for correction banner */}
      {caseData.status === 'RETURNED_FOR_CORRECTION' && caseData.teamLeaderComment && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5">
          <div className="max-w-[1400px] mx-auto flex items-start justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong className="font-semibold">Team Leader Return Notice:</strong> {caseData.teamLeaderComment}
              </span>
            </div>
            <span className="text-rose-700 font-medium shrink-0 ml-4">Please revise and resubmit</span>
          </div>
        </div>
      )}

      {/* Escalated banner */}
      {caseData.status === 'ESCALATED_COMPREHENSIVE' && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-2.5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong className="font-semibold">Escalated to Comprehensive Audit:</strong> All desk audit working papers, evidence, and preliminary findings have been transferred to on-site audit team.
              </span>
            </div>
            <span className="font-mono text-purple-700">Estimated Exposure: ${(caseData.escalationDetails?.estimatedTaxExposure || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Case identification */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span className="font-semibold tracking-wider text-indigo-700 uppercase">
                {caseData.auditType === 'COMPREHENSIVE_AUDIT' ? 'Comprehensive Audit' : 'Desk Audit'}
              </span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                onClick={onSwitchCase}
                className="font-mono font-medium hover:text-indigo-600 flex items-center gap-1 transition-colors text-gray-700 underline decoration-dotted"
                title="Click to switch assigned case"
              >
                Case: {caseData.id}
                <FolderSync className="w-3 h-3 text-gray-400" />
              </button>
              <span className="text-gray-300">|</span>
              <span className="font-mono text-gray-500">{caseData.caseNumber}</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                {caseData.taxpayerName}
              </h1>
              {caseData.tradeName && (
                <span className="hidden sm:inline text-xs text-gray-500 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded">
                  {caseData.tradeName}
                </span>
              )}
            </div>

            {/* Metadata row with clean unboxed typography */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-600">
              <span className="flex items-center font-mono text-gray-800">
                <Hash className="w-3.5 h-3.5 mr-1 text-gray-400" /> TIN: {caseData.tin}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" /> Period: {caseData.taxPeriod}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-gray-400" /> Auditor: {caseData.assignedAuditor}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center text-gray-500">
                TL: {caseData.teamLeader}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center text-gray-700">
                <Briefcase className="w-3.5 h-3.5 mr-1 text-gray-400" /> Due: {caseData.dueDate}
              </span>
            </div>
          </div>

          {/* Status & Real-time Progress Widget */}
          <div className="flex items-center lg:items-end justify-between lg:justify-end gap-6 shrink-0">
            {/* Action buttons (Audit Trail, Team Leader Review, Escalate) */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuditTrail}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 flex items-center gap-1 transition-colors"
                title="View complete audit log trail"
              >
                <History className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden sm:inline">Audit Trail</span>
              </button>

              {/* Removed TL Review and Escalate buttons as per user request */}
            </div>

            {/* Progress & Save Status */}
            <div className="flex flex-col items-end min-w-[180px]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded border ${statusInfo.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                  {statusInfo.label}
                </span>
                <span className="text-xs font-medium text-gray-600 font-mono tabular-nums">
                  Progress: <strong className="text-indigo-700 font-bold">{progressPct}%</strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Real-time Save Status */}
              <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 font-medium">
                {saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Saved at <span className="font-mono tabular-nums">{lastSaved}</span></span>
                  </>
                ) : saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                    <span className="text-indigo-700">Saving to ITAS...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-700">Unsaved changes</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
