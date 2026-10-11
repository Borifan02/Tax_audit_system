import React, { useEffect, useState } from 'react';
import { FolderSync, X, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { itasApi } from '../services/api';

interface QACaseSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
}

export const QACaseSwitcherModal: React.FC<QACaseSwitcherModalProps> = ({
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
        .getQACases({ all: true })
        .then((data) => setCasesList(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-indigo-700" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Select ITAS Audit Quality Assurance File
            </h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
          {loading ? (
            <div className="text-center py-8 text-slate-500 font-mono">Loading QA cases...</div>
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
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-700">
                        {c.caseNumber || c.id}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">{c.auditCaseNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        {c.selectionReason?.replace(/_/g, ' ') || 'QA SELECTION'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          c.status === 'PASSED_COMPLIANT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.status === 'DEFICIENCY_ISSUED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : c.status === 'PENDING_TL_REVIEW'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>

                      {isSelected && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                          Current Active
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{c.taxpayerName}</h3>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
                    <div>TIN: {c.tin}</div>
                    <div>Period: {c.taxPeriod}</div>
                    <div>Exposure: ${c.totalTaxAssessment?.toLocaleString()}</div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-mono">
                      Quality Score: <strong className="text-indigo-700">{c.overallScore}%</strong> ({c.rating}) · Deficiencies: {c.openDeficienciesCount || 0}
                    </span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      Open Inspection <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
