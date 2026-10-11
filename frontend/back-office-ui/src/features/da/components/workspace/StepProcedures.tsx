import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Save,
  ChevronDown,
  ChevronUp,
  Link2,
  Filter,
  Search,
  Check,
  PlayCircle
} from 'lucide-react';
import { AuditProcedure, EvidenceItem } from '../../types/audit';

interface StepProceduresProps {
  procedures: AuditProcedure[];
  evidenceList: EvidenceItem[];
  onUpdateProcedure: (procId: string, updates: Partial<AuditProcedure>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepProcedures: React.FC<StepProceduresProps> = ({
  procedures,
  evidenceList,
  onUpdateProcedure,
  onTriggerAutosave
}) => {
  const [selectedProcId, setSelectedProcId] = useState<string>(procedures[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingProcId, setSavingProcId] = useState<string | null>(null);

  // Active procedure state
  const activeProcedure = procedures.find((p) => p.id === selectedProcId) || procedures[0];

  // Local editing states for active procedure
  const [editResult, setEditResult] = useState(activeProcedure?.result || '');
  const [editConclusion, setEditConclusion] = useState(activeProcedure?.conclusion || '');
  const [editObservations, setEditObservations] = useState(activeProcedure?.observations || '');
  const [editEvidenceIds, setEditEvidenceIds] = useState<string[]>(activeProcedure?.evidenceIds || []);

  // When active procedure changes, sync local editing states
  React.useEffect(() => {
    if (activeProcedure) {
      setEditResult(activeProcedure.result || '');
      setEditConclusion(activeProcedure.conclusion || '');
      setEditObservations(activeProcedure.observations || '');
      setEditEvidenceIds(activeProcedure.evidenceIds || []);
    }
  }, [activeProcedure?.id]);

  const completedCount = procedures.filter((p) => p.status === 'COMPLETED').length;
  const inProgressCount = procedures.filter((p) => p.status === 'IN_PROGRESS').length;
  const notStartedCount = procedures.filter((p) => p.status === 'NOT_STARTED').length;

  const filteredProcedures = procedures.filter((p) => {
    const matchesFilter = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch =
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.objective.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSaveActiveProcedure = async (newStatus?: AuditProcedure['status']) => {
    if (!activeProcedure) return;
    setSavingProcId(activeProcedure.id);
    try {
      const updates: Partial<AuditProcedure> = {
        result: editResult,
        conclusion: editConclusion,
        observations: editObservations,
        evidenceIds: editEvidenceIds
      };
      if (newStatus) {
        updates.status = newStatus;
      }
      await onUpdateProcedure(activeProcedure.id, updates);
      onTriggerAutosave();
    } finally {
      setSavingProcId(null);
    }
  };

  const handleToggleEvidenceLink = (evidenceId: string) => {
    setEditEvidenceIds((prev) =>
      prev.includes(evidenceId) ? prev.filter((id) => id !== evidenceId) : [...prev, evidenceId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Counts & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Desk Audit Procedures Execution
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {completedCount}/{procedures.length} Completed
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Execute mandated verification procedures, document substantive findings, link supporting evidence, and record conclusions.
          </p>
        </div>

        {/* Status mini summary pills (interactive filters) */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterStatus === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({procedures.length})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterStatus === 'COMPLETED' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterStatus === 'IN_PROGRESS' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('NOT_STARTED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterStatus === 'NOT_STARTED' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Pending ({notStartedCount})
          </button>
        </div>
      </div>

      {/* Main Split Interface: Procedures List on Left, Active Procedure Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Procedures Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search procedures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredProcedures.map((proc) => {
              const isSelected = proc.id === selectedProcId;
              const isCompleted = proc.status === 'COMPLETED';
              const isInProgress = proc.status === 'IN_PROGRESS';

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
                    <span className="font-mono font-bold text-xs text-indigo-700">
                      {proc.reference}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {proc.isMandatory && (
                        <span className="text-[10px] text-rose-600 font-semibold uppercase">
                          Mandatory
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {proc.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                    {proc.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    {proc.objective}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                    <span>Due: {proc.dueDate}</span>
                    <span className="font-mono">
                      {proc.evidenceIds?.length || 0} Evidence Attached
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Procedure Detail & Execution Workspace (7 cols) */}
        {activeProcedure && (
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-6 shadow-2xs space-y-5">
            {/* Header of Active Procedure */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-indigo-700">
                      {activeProcedure.reference}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500 font-mono">Due: {activeProcedure.dueDate}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">Auditor: {activeProcedure.assignedAuditor}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    {activeProcedure.title}
                  </h3>
                </div>

                {/* Status Switcher */}
                <div className="shrink-0 flex items-center gap-2">
                  <select
                    value={activeProcedure.status}
                    onChange={(e) => handleSaveActiveProcedure(e.target.value as any)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded border focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                      activeProcedure.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : activeProcedure.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="WAIVED">Waived</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] block">
                    Audit Objective
                  </span>
                  <p className="text-gray-800 mt-0.5">{activeProcedure.objective}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] block">
                    Audit Procedure Description
                  </span>
                  <p className="text-gray-800 mt-0.5">{activeProcedure.description}</p>
                </div>
              </div>
            </div>

            {/* Execution inputs */}
            <div className="space-y-4 text-xs">
              {/* Audit Results / Substantive Testing */}
              <div>
                <label className="block font-semibold text-gray-800 uppercase text-[11px] mb-1">
                  Procedure Substantive Results & Reconciliations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Record numerical reconciliation, sampled invoices, sample size, discrepancies found..."
                  value={editResult}
                  onChange={(e) => setEditResult(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded font-sans text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block font-semibold text-gray-800 uppercase text-[11px] mb-1">
                  Specific Observations & Non-Compliance Indicators
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown of transaction vouchers, missing tax invoices, or supplier non-filing..."
                  value={editObservations}
                  onChange={(e) => setEditObservations(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded font-sans text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Conclusion */}
              <div>
                <label className="block font-semibold text-gray-800 uppercase text-[11px] mb-1">
                  Auditor Conclusion & Adjustment Recommendation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Final determination, proposed tax adjustment, or recommendation for Finding generation..."
                  value={editConclusion}
                  onChange={(e) => setEditConclusion(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded font-sans text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Attach / Link Evidence section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-gray-800 uppercase text-[11px] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    Attach Supporting Evidence ({editEvidenceIds.length} Linked)
                  </label>
                  <span className="text-[11px] text-gray-400">Select verified documents to attach</span>
                </div>

                <div className="border border-gray-200 rounded p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-gray-50/50">
                  {evidenceList.map((ev) => {
                    const isChecked = editEvidenceIds.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer border text-xs transition-colors ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleEvidenceLink(ev.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-bold text-xs shrink-0">{ev.reference}</span>
                          <span className="truncate">{ev.description}</span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 shrink-0 ml-2">
                          {ev.source}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Bar for this Procedure */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                {activeProcedure.status === 'NOT_STARTED' && (
                  <button
                    type="button"
                    onClick={() => handleSaveActiveProcedure('IN_PROGRESS')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Start Procedure
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingProcId === activeProcedure.id}
                  onClick={() => handleSaveActiveProcedure()}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5 text-gray-500" />
                  Save Draft
                </button>

                {activeProcedure.status !== 'COMPLETED' ? (
                  <button
                    type="button"
                    disabled={savingProcId === activeProcedure.id || !editResult.trim()}
                    onClick={() => handleSaveActiveProcedure('COMPLETED')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete Procedure
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={savingProcId === activeProcedure.id}
                    onClick={() => handleSaveActiveProcedure('IN_PROGRESS')}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                  >
                    Reopen Procedure
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
