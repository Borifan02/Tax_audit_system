import React, { useState } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, ShieldCheck, 
  ChevronDown, ChevronUp, Check, X, RotateCcw
} from 'lucide-react';
import { Card, Button, Badge, Textarea } from '../../../components/ui/index.jsx';

export default function PhaseReviewBanner({
  gate,
  phaseConfig,
  onReview,
  saving,
  user
}) {
  const [showReviewControls, setShowReviewControls] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewComments, setReviewComments] = useState('');

  if (!gate) return null;

  const status = gate.status || 'DRAFT';

  // If Revision Requested: show prominent warning alert
  if (status === 'REVISION_REQUESTED') {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200 text-sm">
              Revisions Requested by {gate.reviewedBy || gate.reviewerRole || 'Reviewer'}
            </span>
            <Badge color="red">Action Required</Badge>
          </div>
          <p className="text-rose-800 dark:text-rose-300 mt-1 italic font-medium">
            "{gate.reviewComments || 'Please revise the highlighted sub-steps and re-submit the phase dossier.'}"
          </p>
          <div className="text-[11px] text-rose-500 mt-1">
            Reviewed on: {gate.reviewedAt ? new Date(gate.reviewedAt).toLocaleString() : 'Recent'}
          </div>
        </div>
      </div>
    );
  }

  // If Approved: show green success alert
  if (status === 'APPROVED') {
    return (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Phase Formally Approved & Endorsed
              </h4>
              <Badge color="green">Gate Unlocked</Badge>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
              Approved by <strong>{gate.reviewedBy || gate.reviewerRole || 'Authorized Official'}</strong>
              {gate.reviewedAt && ` on ${new Date(gate.reviewedAt).toLocaleDateString()}`}. Subsequent phase is unlocked for execution.
            </p>
            {gate.reviewComments && (
              <p className="text-[11px] text-emerald-600 mt-1 italic">
                "{gate.reviewComments}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If Endorsed to Committee: show purple deliberation alert
  if (status === 'SUBMITTED_FOR_COMMITTEE') {
    return (
      <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-300/80 dark:border-purple-700/60 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                  Endorsed by Team Leader & Awaiting Review Committee Approval
                </h4>
                <Badge color="purple">Committee Deliberation</Badge>
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                Dossier has been endorsed by Team Leader and submitted for formal statutory approval by the <strong>Review Committee / Process Owner</strong>.
              </p>
              {gate.reviewComments && (
                <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 italic">
                  TL Endorsement Notes: "{gate.reviewComments}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Submitted for Review: show under review banner (supervisor controls shown ONLY for authorized non-auditor roles)
  if (status === 'SUBMITTED_FOR_REVIEW') {
    const isAuditor = user?.role === 'auditor' || !user?.role || user?.role === 'AUDITOR';
    const canReview = !isAuditor && typeof onReview === 'function';

    return (
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Phase Dossier Submitted & Awaiting Formal Endorsement
                </h4>
                <Badge color="amber">Under Review</Badge>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Submitted to <strong>{gate.reviewerRole || phaseConfig?.authority || 'Reviewing Authority'}</strong> by {gate.submittedBy || 'Auditor'}
                {gate.submittedAt && ` on ${new Date(gate.submittedAt).toLocaleString()}`}.
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 italic">
                Editing is locked. Formal supervisory review must be completed by the assigned authority in their supervisory workspace.
              </p>
            </div>
          </div>

          {canReview && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReviewControls(!showReviewControls)}
              className="border-amber-400/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-xs font-semibold"
            >
              <ShieldCheck size={14} className="mr-1.5" />
              {showReviewControls ? 'Hide Review Console' : 'Approving Official Action'}
            </Button>
          )}
        </div>

        {canReview && showReviewControls && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/70 p-4 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Approving Authority Action ({phaseConfig?.authority})
            </span>
            <Textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              rows={2}
              placeholder="Enter formal review observations, supervisory notes, or instructions..."
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(phaseConfig.id, 'REVISION_REQUESTED', reviewComments || 'Please address evidentiary gaps and re-submit.')}
                disabled={saving}
                className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs"
              >
                <RotateCcw size={13} className="mr-1" />
                Request Revisions
              </Button>
              <Button
                size="sm"
                onClick={() => onReview(phaseConfig.id, 'APPROVED', reviewComments || 'Formally endorsed and approved.')}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Check size={14} className="mr-1" />
                Approve Phase & Unlock Next Gate
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
