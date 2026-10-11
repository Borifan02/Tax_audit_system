import React, { useState } from 'react';
import {
  Plus,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Send,
  Calendar,
  X,
  RotateCcw,
  Check
} from 'lucide-react';
import { TaxQuery, EvidenceItem } from '../../types/audit';

interface StepQueriesProps {
  queries: TaxQuery[];
  evidenceList: EvidenceItem[];
  onCreateQuery: (query: Partial<TaxQuery>) => Promise<void>;
  onUpdateQuery: (queryId: string, updates: Partial<TaxQuery>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepQueries: React.FC<StepQueriesProps> = ({
  queries,
  evidenceList,
  onCreateQuery,
  onUpdateQuery,
  onTriggerAutosave
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<string>(queries[0]?.id || '');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Query Form State
  const [newSubject, setNewSubject] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newBasis, setNewBasis] = useState('Tax Administration Act Section 42(1) - Notice of Request for Information');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [newAttachedEvidenceIds, setNewAttachedEvidenceIds] = useState<string[]>([]);

  const activeQuery = queries.find((q) => q.id === selectedQueryId) || queries[0];

  // Sync resolution notes when active query changes
  React.useEffect(() => {
    if (activeQuery) {
      setResolutionNotes(activeQuery.resolutionNotes || '');
    }
  }, [activeQuery?.id]);

  // Counts
  const totalCount = queries.length;
  const openCount = queries.filter((q) => q.status === 'OPEN').length;
  const pendingCount = queries.filter((q) => q.status === 'PENDING_RESPONSE').length;
  const resolvedCount = queries.filter((q) => q.status === 'RESOLVED').length;
  const overdueCount = queries.filter((q) => q.status === 'OVERDUE').length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateQuery({
        reference: `QRY-2026-${String(queries.length + 1).padStart(2, '0')}`,
        subject: newSubject,
        question: newQuestion,
        statutoryBasis: newBasis,
        dueDate: newDueDate,
        attachedEvidenceIds: newAttachedEvidenceIds
      });
      setIsCreateModalOpen(false);
      setNewSubject('');
      setNewQuestion('');
      onTriggerAutosave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveQuery = async () => {
    if (!activeQuery) return;
    setIsSubmitting(true);
    try {
      await onUpdateQuery(activeQuery.id, {
        status: 'RESOLVED',
        resolutionNotes,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Jane Doe'
      });
      onTriggerAutosave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenQuery = async () => {
    if (!activeQuery) return;
    setIsSubmitting(true);
    try {
      await onUpdateQuery(activeQuery.id, {
        status: 'PENDING_RESPONSE'
      });
      onTriggerAutosave();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Taxpayer Query & Clarification Management
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Issue formal notices for information, track taxpayer replies, and record statutory audit dispositions.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue Formal Query</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-2xs">
          <span className="text-xl font-bold font-mono text-gray-900 tabular-nums">{totalCount}</span>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mt-0.5">
            Total Queries
          </span>
        </div>
        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-2xs">
          <span className="text-xl font-bold font-mono text-blue-700 tabular-nums">{openCount}</span>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mt-0.5">
            Open / Drafted
          </span>
        </div>
        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-2xs">
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">{pendingCount}</span>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mt-0.5">
            Pending Reply
          </span>
        </div>
        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-2xs">
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">{resolvedCount}</span>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mt-0.5">
            Resolved & Closed
          </span>
        </div>
        <div className="bg-white p-3.5 rounded border border-gray-200 shadow-2xs">
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">{overdueCount}</span>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mt-0.5">
            Overdue
          </span>
        </div>
      </div>

      {/* Two Column Layout: Query List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {queries.map((q) => {
            const isSelected = q.id === selectedQueryId;
            const isResolved = q.status === 'RESOLVED';
            const isPending = q.status === 'PENDING_RESPONSE';

            return (
              <div
                key={q.id}
                onClick={() => setSelectedQueryId(q.id)}
                className={`p-3.5 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-indigo-700">{q.reference}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {q.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">{q.subject}</h4>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{q.question}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <span>Due: {q.dueDate}</span>
                  {q.taxpayerResponse ? (
                    <span className="text-emerald-700 font-medium">✓ Response Received</span>
                  ) : (
                    <span className="text-amber-700">Awaiting Taxpayer</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Query Details, Taxpayer Response & Resolution (7 cols) */}
        {activeQuery && (
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-6 shadow-2xs space-y-5">
            {/* Header */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-sm text-indigo-700">
                  {activeQuery.reference}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    activeQuery.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {activeQuery.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900">{activeQuery.subject}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono">
                <span>Statutory Deadline: {activeQuery.dueDate}</span>
              </div>
            </div>

            {/* Official Question Body */}
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-1.5">
                <span className="font-semibold text-gray-500 uppercase text-[10px] block">
                  Official Information Request / Question
                </span>
                <p className="text-gray-900 leading-relaxed font-medium">{activeQuery.question}</p>
                <span className="text-[10px] text-gray-400 block pt-1 border-t border-gray-200">
                  Statutory Legal Basis: {activeQuery.statutoryBasis}
                </span>
              </div>

              {/* Taxpayer Response Section */}
              <div className="mt-3 pt-2">
                <span className="font-bold text-gray-800 uppercase text-[11px] block mb-1">
                  Taxpayer Submitted Response
                </span>
                {activeQuery.taxpayerResponse ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-emerald-900 font-mono border-b border-emerald-200 pb-1.5">
                      <span>Submitted by: {activeQuery.taxpayerResponse.responderName}</span>
                      <span>
                        {new Date(activeQuery.taxpayerResponse.respondedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium leading-relaxed">
                      "{activeQuery.taxpayerResponse.responseText}"
                    </p>
                    {activeQuery.taxpayerResponse.attachedDocuments && (
                      <div className="pt-2 border-t border-emerald-100 flex items-center gap-1.5 text-[11px] text-emerald-800 font-mono">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Attached: {activeQuery.taxpayerResponse.attachedDocuments.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center text-gray-500 text-xs">
                    <Clock className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                    <span>No formal response submitted by taxpayer yet.</span>
                  </div>
                )}
              </div>

              {/* Auditor Review & Resolution Notes */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <label className="block font-bold text-gray-800 uppercase text-[11px] mb-1">
                  Auditor Evaluation & Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record assessment of taxpayer reply, whether explanations were accepted or rejected, and statutory basis for finding..."
                  className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <div>
                  {activeQuery.status === 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={handleReopenQuery}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen Query
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpdateQuery(activeQuery.id, { resolutionNotes });
                      onTriggerAutosave();
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 shadow-2xs"
                  >
                    Save Notes
                  </button>

                  {activeQuery.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={isSubmitting || !resolutionNotes.trim()}
                      onClick={handleResolveQuery}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Query Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Query Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Issue Formal Taxpayer Query (Sec. 42)
              </h4>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Query Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Request for Substantiation of Subcontracting Invoices..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Detailed Information Request / Question <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Clearly state specific records, invoices, bank transfers, or explanations demanded from the taxpayer..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Statutory Legal Basis
                  </label>
                  <input
                    type="text"
                    value={newBasis}
                    onChange={(e) => setNewBasis(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Statutory Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded shadow-2xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Notice to Taxpayer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
