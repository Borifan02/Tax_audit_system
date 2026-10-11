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
  FolderSync,
  Save,
  ShieldCheck,
  Building2,
  Scale
} from 'lucide-react';
import { AuditCase, SaveStatus } from '../../types/audit';

export interface AuditHeaderProps {
  caseData: AuditCase;
  saveStatus: SaveStatus;
  lastSaved: string;
  progressPct: number;
  onSwitchCase?: () => void;
  onManualSave?: () => void;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({
  caseData,
  saveStatus,
  lastSaved,
  progressPct,
  onSwitchCase,
  onManualSave
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          label: 'In Field Audit',
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
      case 'PENDING_DIRECTOR_APPROVAL':
        return {
          label: 'Pending Director Approval',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500'
        };
      case 'APPROVED':
        return {
          label: 'Statutory Endorsement Approved',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'REFERRED_TO_FRAUD_INVESTIGATION':
        return {
          label: 'Criminal Fraud Referral',
          color: 'bg-red-50 text-red-800 border-red-200',
          dot: 'bg-red-500'
        };
      default:
        return {
          label: status.replace(/_/g, ' '),
          color: 'bg-gray-50 text-gray-800 border-gray-200',
          dot: 'bg-gray-400'
        };
    }
  };

  const statusInfo = getStatusBadge(caseData.status);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
      {/* Returned for correction supervisory banner */}
      {caseData.status === 'RETURNED_FOR_CORRECTION' && caseData.teamLeaderComment && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2">
          <div className="max-w-[1400px] mx-auto flex items-start justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong className="font-semibold">Team Leader Feedback Notice:</strong> {caseData.teamLeaderComment}
              </span>
            </div>
            <span className="text-rose-700 font-semibold shrink-0 ml-4">Revise findings & resubmit for sign-off</span>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Case identification & metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span className="inline-flex items-center gap-1 font-bold tracking-wider text-indigo-700 uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Comprehensive Tax Audit (On-Site)
              </span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              {onSwitchCase ? (
                <button
                  onClick={onSwitchCase}
                  className="font-mono font-semibold hover:text-indigo-600 flex items-center gap-1.5 transition-colors text-gray-800 bg-gray-100 hover:bg-indigo-50 px-2 py-0.5 rounded border border-gray-200"
                  title="Switch active comprehensive audit case"
                >
                  <span>Case: {caseData.id}</span>
                  <FolderSync className="w-3 h-3 text-indigo-600" />
                </button>
              ) : (
                <span className="font-mono font-semibold text-gray-800">
                  Case: {caseData.id}
                </span>
              )}
              <span className="text-gray-300">|</span>
              <span className="font-mono text-gray-500">{caseData.caseNumber}</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                Large Taxpayers Office
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                {caseData.taxpayerName}
              </h1>
              {caseData.tradeName && (
                <span className="hidden md:inline text-xs text-gray-600 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded font-medium">
                  {caseData.tradeName}
                </span>
              )}
            </div>

            {/* Statutory Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
              <span className="flex items-center font-mono text-gray-800">
                <Hash className="w-3.5 h-3.5 mr-1 text-gray-400" /> TIN: {caseData.tin}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" /> Tax Period: {caseData.taxPeriod}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-indigo-500" /> Lead Auditor: <strong className="ml-1 text-gray-800">{caseData.assignedAuditor}</strong>
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center text-gray-600">
                Team Leader: <span className="ml-1 text-gray-800 font-medium">{caseData.teamLeader}</span>
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center text-gray-700">
                <Briefcase className="w-3.5 h-3.5 mr-1 text-gray-400" /> Due: <span className="ml-1 font-mono text-gray-800">{caseData.dueDate}</span>
              </span>
            </div>
          </div>

          {/* Status, Save Indicator & Progress Widget */}
          <div className="flex items-center lg:items-end justify-between lg:justify-end gap-5 shrink-0">
            {/* Quick Switch Case or Manual Save button */}
            <div className="flex items-center gap-2">
              {onSwitchCase && (
                <button
                  onClick={onSwitchCase}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-indigo-600 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Switch to another assigned Comprehensive Audit case"
                >
                  <FolderSync className="w-3.5 h-3.5 text-gray-500" />
                  <span>Cases</span>
                </button>
              )}

              {onManualSave && (
                <button
                  onClick={onManualSave}
                  disabled={saveStatus === 'saving'}
                  className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                  title="Force immediate save of audit working state"
                >
                  {saveStatus === 'saving' ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>Save</span>
                </button>
              )}
            </div>

            {/* Progress & Save Status */}
            <div className="flex flex-col items-end min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold rounded border ${statusInfo.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                  {statusInfo.label}
                </span>
                <span className="text-xs font-semibold text-gray-700 font-mono tabular-nums">
                  Execution: <strong className="text-indigo-700 font-bold">{progressPct}%</strong>
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
                    <span>Database Synced at <span className="font-mono tabular-nums">{lastSaved}</span></span>
                  </>
                ) : saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                    <span className="text-indigo-700">Persisting changes to database...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-700">Unsaved changes in workspace</span>
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
