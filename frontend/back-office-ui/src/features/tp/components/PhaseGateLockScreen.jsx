import React from 'react';
import { Lock, ArrowLeft, ShieldAlert, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, Button, Badge } from '../../../components/ui/index.jsx';
import { getPhaseConfig, getPreviousPhaseId } from '../data/tpSubStepConfigs.js';

export default function PhaseGateLockScreen({ phaseId, getGate, onNavigatePhase }) {
  const currentConfig = getPhaseConfig(phaseId);
  const prevId = getPreviousPhaseId(phaseId);
  const prevConfig = prevId ? getPhaseConfig(prevId) : null;
  const prevGate = prevId ? getGate(prevId) : null;

  const prevStatus = prevGate?.status || 'DRAFT';
  const completedSubSteps = Array.isArray(prevGate?.subStepsCompleted) ? prevGate.subStepsCompleted : [];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Card className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500 shadow-inner">
          <Lock size={32} />
        </div>

        <Badge color="amber" size="md" className="mb-3">
          Strict Phase Gate Enforced
        </Badge>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {currentConfig?.label || 'Phase'} is Strictly Locked
        </h2>

        <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
          Under statutory tax audit procedures and governance rules, you cannot proceed to this phase until the previous prerequisite phase is completed, submitted, and formally approved.
        </p>

        {prevConfig && (
          <div className="mt-8 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prerequisite Phase:</span>
            <div className="flex items-center justify-between mt-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {prevConfig.label}
              </h4>
              <Badge color={prevStatus === 'SUBMITTED_FOR_REVIEW' ? 'amber' : prevStatus === 'SUBMITTED_FOR_COMMITTEE' ? 'purple' : prevStatus === 'REVISION_REQUESTED' ? 'red' : 'slate'}>
                {prevStatus === 'SUBMITTED_FOR_REVIEW' ? 'Under Review' : prevStatus === 'SUBMITTED_FOR_COMMITTEE' ? 'With Committee' : prevStatus === 'REVISION_REQUESTED' ? 'Revision Needed' : 'In Progress'}
              </Badge>
            </div>

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div>Required Approving Authority: <strong className="text-slate-800 dark:text-slate-200">{prevConfig.authority}</strong></div>
              <div>Sub-Step Progress: <strong>{completedSubSteps.length}/6 Completed</strong></div>
              {prevStatus === 'SUBMITTED_FOR_REVIEW' && (
                <div className="text-amber-600 font-medium pt-1">
                  ⏳ Phase has been submitted and is currently pending formal review by {prevConfig.authority}.
                </div>
              )}
              {prevStatus === 'SUBMITTED_FOR_COMMITTEE' && (
                <div className="text-purple-600 font-medium pt-1">
                  ⏳ Phase has been endorsed by Team Leader and is currently pending Review Committee statutory approval.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3">
          {prevId && (
            <Button
              onClick={() => onNavigatePhase(prevId)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Return to {prevConfig?.label || 'Previous Phase'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
