import React, { useEffect, useState } from 'react';
import { FolderSync, X, ArrowRight, Building2, Calendar, Hash, ShieldAlert } from 'lucide-react';
import { itasApi } from '../../services/api';

interface CaseSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
}

export const CaseSwitcherModal: React.FC<CaseSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeCaseId,
  onSelectCase
}) => {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      itasApi
        .getAssignedCases()
        .then((data) => setCasesList(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-indigo-700" />
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Select Assigned ITAS Audit Case
            </h4>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading assigned cases...</div>
          ) : (
            casesList.map((c) => {
              const isSelected = c.id === activeCaseId;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCase(c.id);
                    onClose();
                  }}
                  className={`p-4 rounded border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400 shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-700">
                        {c.id}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="font-mono text-gray-500">{c.caseNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        COMPREHENSIVE AUDIT
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          c.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.status === 'SUBMITTED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : c.status === 'RETURNED_FOR_CORRECTION'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                          Current Active
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900">{c.taxpayerName}</h3>

                  <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                    <div className="font-mono">TIN: {c.tin}</div>
                    <div>Period: {c.taxPeriod}</div>
                    <div>Due: {c.dueDate}</div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                    <span className="font-mono">
                      Procedures: {c.stats?.proceduresCompleted || 0}/{c.stats?.proceduresTotal || 0} · Evidence: {c.stats?.evidenceCollected || 0} · Findings: {c.stats?.findings || 0}
                    </span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      Open Case <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
