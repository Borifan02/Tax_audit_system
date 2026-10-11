import React, { useState } from 'react';
import { UserCheck, CheckCircle2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { AuditCase } from '../../types/audit';

interface TeamLeaderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: AuditCase;
  onExecuteAction: (
    action: 'APPROVE_AUDIT' | 'RETURN_FOR_CORRECTION',
    comment: string
  ) => Promise<void>;
}

export const TeamLeaderActionModal: React.FC<TeamLeaderActionModalProps> = ({
  isOpen,
  onClose,
  caseData,
  onExecuteAction
}) => {
  const [actionType, setActionType] = useState<'APPROVE' | 'RETURN'>('APPROVE');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        await onExecuteAction(
          'APPROVE_AUDIT',
          comment || 'Audit procedures verified, findings endorsed, and final statutory assessment authorized.'
        );
      } else {
        if (!comment.trim()) {
          alert('Please enter a specific instruction or reason for returning the case.');
          return;
        }
        await onExecuteAction('RETURN_FOR_CORRECTION', comment);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-700" />
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Team Leader Technical Review
            </h4>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Case Information</span>
            <div className="font-semibold text-gray-900">{caseData.taxpayerName}</div>
            <div className="text-gray-500 font-mono text-[11px]">
              TIN: {caseData.tin} · Case: {caseData.id} · Auditor: {caseData.assignedAuditor}
            </div>
            <div className="text-gray-500 font-mono text-[11px]">
              Current Status: <strong className="text-indigo-700">{caseData.status}</strong>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-2">
              Supervisory Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType('APPROVE')}
                className={`p-3 rounded border text-left cursor-pointer transition-all ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 font-semibold'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-0.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Audit</span>
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  Endorse findings & authorize final assessment order.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('RETURN')}
                className={`p-3 rounded border text-left cursor-pointer transition-all ${
                  actionType === 'RETURN'
                    ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-400 text-rose-950 font-semibold'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-0.5 text-rose-800">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return for Correction</span>
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  Send back to auditor with specific correction notes.
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              {actionType === 'APPROVE'
                ? 'Approval Endorsement Notes (Optional)'
                : 'Correction Instructions & Missing Items (Required) *'}
            </label>
            <textarea
              rows={3}
              required={actionType === 'RETURN'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                actionType === 'APPROVE'
                  ? 'Audit procedures and calculations verified; assessment notice endorsed.'
                  : 'E.g. Please attach certified bank statements for Q3 and obtain TIMS confirmation for Finding FND-02 before final sign-off.'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 text-white font-semibold rounded shadow-2xs ${
                actionType === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : actionType === 'APPROVE' ? 'Authorize Approval' : 'Return to Auditor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
