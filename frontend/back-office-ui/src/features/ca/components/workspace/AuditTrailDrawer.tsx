import React from 'react';
import { History, X, Clock, User, ArrowRight } from 'lucide-react';
import { AuditTrailEntry } from '../../types/audit';

interface AuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AuditTrailEntry[];
  caseId: string;
}

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  entries,
  caseId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-700" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Official Audit Trail & Log
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-2 bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 font-mono">
          Case: {caseId} · {entries.length} Recorded Actions
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No audit log entries recorded yet.</div>
          ) : (
            <div className="relative border-l-2 border-indigo-100 ml-3 pl-4 space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="relative group">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-gray-900 text-xs">{entry.action}</span>
                    <span className="text-[11px] font-mono text-gray-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-gray-700 mt-1 leading-relaxed">{entry.details}</p>

                  {entry.oldValue && entry.newValue && (
                    <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-200">
                      <span className="text-gray-600">{entry.oldValue}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-indigo-700 font-semibold">{entry.newValue}</span>
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      {entry.user}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
