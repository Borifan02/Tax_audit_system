import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Save,
  Link2,
  Search,
  Filter,
  Layers,
  Scale,
  PlayCircle
} from 'lucide-react';
import { AuditProcedure, EvidenceItem, BalanceSheetItem } from '../../types/audit';

interface StepCompProceduresProps {
  procedures: AuditProcedure[];
  evidenceList: EvidenceItem[];
  balanceSheetItems?: BalanceSheetItem[];
  onUpdateProcedure: (procId: string, updates: Partial<AuditProcedure>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepCompProcedures: React.FC<StepCompProceduresProps> = ({
  procedures,
  evidenceList,
  balanceSheetItems = [],
  onUpdateProcedure,
  onTriggerAutosave
}) => {
  const [selectedProcId, setSelectedProcId] = useState<string>(procedures[0]?.id || '');
  const [viewMode, setViewMode] = useState<'procedures' | 'balanceSheet'>('procedures');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingProcId, setSavingProcId] = useState<string | null>(null);

  const activeProcedure = procedures.find((p) => p.id === selectedProcId) || procedures[0];

  // Local editing states
  const [editResult, setEditResult] = useState(activeProcedure?.result || '');
  const [editConclusion, setEditConclusion] = useState(activeProcedure?.conclusion || '');
  const [editObservations, setEditObservations] = useState(activeProcedure?.observations || '');
  const [editEvidenceIds, setEditEvidenceIds] = useState<string[]>(activeProcedure?.evidenceIds || []);

  React.useEffect(() => {
    if (activeProcedure) {
      setEditResult(activeProcedure.result || '');
      setEditConclusion(activeProcedure.conclusion || '');
      setEditObservations(activeProcedure.observations || '');
      setEditEvidenceIds(activeProcedure.evidenceIds || []);
    }
  }, [activeProcedure?.id]);

  const completedCount = procedures.filter((p) => p.status === 'COMPLETED').length;

  const handleSaveActive = async (newStatus?: AuditProcedure['status']) => {
    if (!activeProcedure) return;
    setSavingProcId(activeProcedure.id);
    try {
      const updates: Partial<AuditProcedure> = {
        result: editResult,
        conclusion: editConclusion,
        observations: editObservations,
        evidenceIds: editEvidenceIds
      };
      if (newStatus) updates.status = newStatus;
      await onUpdateProcedure(activeProcedure.id, updates);
      onTriggerAutosave();
    } finally {
      setSavingProcId(null);
    }
  };

  const handleToggleEvidence = (id: string) => {
    setEditEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredProcs = procedures.filter(
    (p) =>
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Audit Assertions, Procedures & Balance Sheet Verification (FR-04.4-03/08/11)
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {completedCount}/{procedures.length} Assertions Completed
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Test financial statement assertions (Existence, Completeness, Valuation, IFRS Compliance), sample GL entries, and audit balance sheet components.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded text-xs shrink-0">
          <button
            onClick={() => setViewMode('procedures')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              viewMode === 'procedures' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Audit Procedures ({procedures.length})
          </button>
          <button
            onClick={() => setViewMode('balanceSheet')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              viewMode === 'balanceSheet' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Balance Sheet Matrix ({balanceSheetItems.length})
          </button>
        </div>
      </div>

      {viewMode === 'procedures' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Procedures Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search comprehensive assertions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredProcs.map((proc) => {
                const isSelected = proc.id === selectedProcId;
                const isCompleted = proc.status === 'COMPLETED';

                return (
                  <div
                    key={proc.id}
                    onClick={() => setSelectedProcId(proc.id)}
                    className={`p-3.5 rounded border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400 shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-indigo-700">{proc.reference}</span>
                        {proc.assertionType && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {proc.assertionType}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {proc.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">{proc.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{proc.objective}</p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <span>Due: {proc.dueDate}</span>
                      <span className="font-mono">{proc.evidenceIds?.length || 0} Evidences</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Execution Workspace (7 cols) */}
          {activeProcedure && (
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-6 shadow-2xs space-y-5">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-indigo-700">{activeProcedure.reference}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                        Assertion: {activeProcedure.assertionType || 'Valuation & Allocation'}
                      </span>
                      {activeProcedure.caatTechnique && (
                        <span className="text-xs font-mono text-gray-500">CAAT: {activeProcedure.caatTechnique}</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{activeProcedure.title}</h3>
                  </div>

                  <select
                    value={activeProcedure.status}
                    onChange={(e) => handleSaveActive(e.target.value as any)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded border bg-gray-50"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="WAIVED">Waived</option>
                  </select>
                </div>

                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-1">
                  <div>
                    <span className="font-bold text-gray-500 uppercase text-[10px]">Audit Objective:</span>
                    <p className="text-gray-800">{activeProcedure.objective}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 uppercase text-[10px]">Testing Description:</span>
                    <p className="text-gray-700">{activeProcedure.description}</p>
                  </div>
                </div>
              </div>

              {/* Substantive Results */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-800 uppercase text-[11px] mb-1">
                    Substantive Testing Results & Reconciliations *
                  </label>
                  <textarea
                    rows={3}
                    value={editResult}
                    onChange={(e) => setEditResult(e.target.value)}
                    placeholder="Record numerical audit reconciliations, sampled ledger entries, physical inspection notes..."
                    className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 uppercase text-[11px] mb-1">
                    IFRS Method of Accounting Compliance & Control Observations (FR-04.4-11)
                  </label>
                  <textarea
                    rows={2}
                    value={editObservations}
                    onChange={(e) => setEditObservations(e.target.value)}
                    placeholder="Evaluate compliance with IFRS 15, IFRS 16, inventory valuation methods (FIFO vs Weighted Average)..."
                    className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 uppercase text-[11px] mb-1">
                    Auditor Conclusion & Finding Recommendation *
                  </label>
                  <textarea
                    rows={2}
                    value={editConclusion}
                    onChange={(e) => setEditConclusion(e.target.value)}
                    placeholder="Final determination and recommended statutory tax adjustment..."
                    className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Evidence Attachments */}
                <div>
                  <label className="block font-bold text-gray-800 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    Attach Supporting 3rd-Party & Taxpayer Evidence ({editEvidenceIds.length} Linked)
                  </label>
                  <div className="border border-gray-200 rounded p-2 max-h-32 overflow-y-auto space-y-1 bg-gray-50">
                    {evidenceList.map((ev) => (
                      <label key={ev.id} className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200 cursor-pointer text-xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editEvidenceIds.includes(ev.id)}
                            onChange={() => handleToggleEvidence(ev.id)}
                            className="rounded text-indigo-600"
                          />
                          <span className="font-mono font-bold text-gray-800">{ev.reference}</span>
                          <span className="truncate max-w-xs">{ev.description}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{ev.source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveActive()}
                  disabled={savingProcId === activeProcedure.id}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 shadow-2xs"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveActive('COMPLETED')}
                  disabled={savingProcId === activeProcedure.id || !editResult.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Assertion Completed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Balance Sheet Matrix (FR-04.4-03) */}
      {viewMode === 'balanceSheet' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700 flex justify-between items-center">
              <span>Financial Statements & Balance Sheet Assertions Matrix (FR-04.4-03)</span>
              <span className="text-gray-400 font-mono">IFRS Accounting Interrogation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Component</th>
                    <th className="py-2.5 px-4">Assertion</th>
                    <th className="py-2.5 px-4 text-right">Declared Balance</th>
                    <th className="py-2.5 px-4 text-right">Audited Balance</th>
                    <th className="py-2.5 px-4 text-right">Variance</th>
                    <th className="py-2.5 px-4">IFRS Check</th>
                    <th className="py-2.5 px-4">Auditor Testing Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {balanceSheetItems.map((bs) => (
                    <tr key={bs.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 font-sans font-bold text-gray-900">{bs.component}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-semibold">
                          {bs.assertionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-gray-900">
                        ${bs.auditeeBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-indigo-700">
                        ${bs.auditedBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className={bs.variance !== 0 ? 'text-rose-700 font-bold' : 'text-gray-500'}>
                          {bs.variance !== 0 ? `$${bs.variance.toLocaleString()}` : '$0'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            bs.ifrsCompliance === 'COMPLIANT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {bs.ifrsCompliance}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-gray-600 text-[11px] max-w-xs">{bs.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
