import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ArrowUpRight, X } from 'lucide-react';
import { AuditCase } from '../../types/audit';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: AuditCase;
  totalTaxImpact: number;
  onConfirmEscalation: (escalationDetails: {
    reason: string;
    extendedScope: string;
    estimatedTaxExposure: number;
  }) => Promise<void>;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose,
  caseData,
  totalTaxImpact,
  onConfirmEscalation
}) => {
  const [reason, setReason] = useState(
    'Identified significant and systematic tax non-compliance in Cost of Goods Sold and offshore payments exceeding statutory desk audit thresholds.'
  );
  const [extendedScope, setExtendedScope] = useState(
    'Comprehensive on-site examination of general ledger, inventory warehouses, foreign vendor transactions, and transfer pricing documentation.'
  );
  const [exposure, setExposure] = useState(Math.max(totalTaxImpact, 150000));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !extendedScope.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirmEscalation({
        reason,
        extendedScope,
        estimatedTaxExposure: Number(exposure)
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center gap-2 text-purple-900">
            <ShieldAlert className="w-5 h-5 text-purple-700" />
            <h4 className="text-sm font-bold uppercase tracking-wide">
              Desk → Comprehensive Audit Escalation (SOR FR-04.5)
            </h4>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Mandatory Preservation of Case Records</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Escalation transfers this audit file into a Comprehensive On-Site Audit. All existing evidence, procedures, working papers, findings, and logs will be preserved intact and transferred to the field audit team.
            </p>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Justification / Reason for Escalation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Proposed Extended Audit Scope & Field Focus Areas <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={extendedScope}
              onChange={(e) => setExtendedScope(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Estimated Total Tax Exposure (USD)
            </label>
            <input
              type="number"
              min="0"
              value={exposure}
              onChange={(e) => setExposure(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono font-bold text-gray-900 text-xs"
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
              className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded shadow-2xs flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Escalating...' : 'Authorize Escalation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
