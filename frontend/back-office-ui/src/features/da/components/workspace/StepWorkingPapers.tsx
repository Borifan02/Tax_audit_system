import React, { useState } from 'react';
import {
  Plus,
  FileCheck,
  FolderOpen,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  Link2,
  X,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { WorkingPaper, AuditProcedure, AuditFinding, EvidenceItem } from '../../types/audit';

interface StepWorkingPapersProps {
  workingPapers: WorkingPaper[];
  procedures: AuditProcedure[];
  findings: AuditFinding[];
  evidenceList: EvidenceItem[];
  onCreateWorkingPaper: (wp: Partial<WorkingPaper>) => Promise<void>;
  onUpdateWorkingPaper: (wpId: string, updates: Partial<WorkingPaper>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepWorkingPapers: React.FC<StepWorkingPapersProps> = ({
  workingPapers,
  procedures,
  findings,
  evidenceList,
  onCreateWorkingPaper,
  onUpdateWorkingPaper,
  onTriggerAutosave
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWP, setEditingWP] = useState<WorkingPaper | null>(null);
  const [previewWP, setPreviewWP] = useState<WorkingPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [ref, setRef] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Revenue Reconciliation');
  const [workPerformed, setWorkPerformed] = useState('');
  const [conclusions, setConclusions] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'COMPLETED' | 'REVIEWED'>('COMPLETED');
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [relatedProcedureId, setRelatedProcedureId] = useState('');
  const [relatedFindingId, setRelatedFindingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingWP(null);
    setRef(`WP-${String(workingPapers.length + 1).padStart(2, '0')}`);
    setTitle('');
    setCategory('Revenue Reconciliation');
    setWorkPerformed('');
    setConclusions('');
    setStatus('COMPLETED');
    setEvidenceIds([]);
    setRelatedProcedureId(procedures[0]?.id || '');
    setRelatedFindingId('');
    setIsModalOpen(true);
  };

  const openEditModal = (wp: WorkingPaper) => {
    setEditingWP(wp);
    setRef(wp.reference);
    setTitle(wp.title);
    setCategory(wp.category);
    setWorkPerformed(wp.workPerformed);
    setConclusions(wp.conclusions);
    setStatus(wp.status);
    setEvidenceIds(wp.evidenceIds || []);
    setRelatedProcedureId(wp.relatedProcedureId || '');
    setRelatedFindingId(wp.relatedFindingId || '');
    setIsModalOpen(true);
  };

  const handleToggleEvidence = (id: string) => {
    setEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workPerformed.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<WorkingPaper> = {
        reference: ref,
        title,
        category,
        workPerformed,
        conclusions,
        status,
        evidenceIds,
        relatedProcedureId: relatedProcedureId || undefined,
        relatedFindingId: relatedFindingId || undefined,
        preparedBy: 'Jane Doe',
        date: new Date().toISOString().split('T')[0]
      };

      if (editingWP) {
        await onUpdateWorkingPaper(editingWP.id, payload);
      } else {
        await onCreateWorkingPaper(payload);
      }
      setIsModalOpen(false);
      onTriggerAutosave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWPs = workingPapers.filter((wp) => {
    return (
      wp.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wp.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Audit Working Papers Register (SOR Compliant)
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {workingPapers.length} Working Papers
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Maintain formal audit working paper files indexing testing methodologies, reconciliations, and cross-references.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Working Paper</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter working papers by reference, title, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Working Paper Cards / Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWPs.map((wp) => {
          const relatedProc = procedures.find((p) => p.id === wp.relatedProcedureId);
          const relatedFind = findings.find((f) => f.id === wp.relatedFindingId);

          return (
            <div
              key={wp.id}
              className="bg-white border border-gray-200 rounded p-4 shadow-2xs flex flex-col justify-between hover:border-gray-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono font-bold text-xs text-indigo-700">
                    {wp.reference}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      wp.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {wp.status}
                  </span>
                </div>

                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  {wp.category}
                </span>
                <h4 className="text-xs font-bold text-gray-900 mt-0.5 line-clamp-1">{wp.title}</h4>

                <p className="text-[11px] text-gray-600 mt-2 line-clamp-3 bg-gray-50 p-2 rounded border border-gray-100">
                  {wp.workPerformed}
                </p>

                {/* Cross References */}
                <div className="mt-3 pt-2 border-t border-gray-100 space-y-1 text-[11px]">
                  {relatedProc && (
                    <div className="text-gray-500 flex items-center gap-1 font-mono">
                      <span>Proc:</span>
                      <span className="text-gray-800 font-semibold">{relatedProc.reference}</span>
                    </div>
                  )}
                  {relatedFind && (
                    <div className="text-rose-600 flex items-center gap-1 font-mono">
                      <span>Finding:</span>
                      <span className="font-semibold">{relatedFind.reference}</span>
                    </div>
                  )}
                  <div className="text-gray-400 flex items-center gap-1">
                    <span>Evidence attached:</span>
                    <span className="font-mono text-gray-600 font-medium">
                      {wp.evidenceIds?.length || 0} documents
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400 font-mono">
                  {wp.preparedBy} · {wp.date}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewWP(wp)}
                    className="p-1 text-gray-500 hover:text-indigo-600 rounded"
                    title="View Working Paper"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(wp)}
                    className="p-1 text-gray-500 hover:text-indigo-600 rounded"
                    title="Edit Working Paper"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Working Paper Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {editingWP ? `Edit Working Paper: ${editingWP.reference}` : 'Create Working Paper'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Reference Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded"
                  >
                    <option value="Revenue Reconciliation">Revenue Reconciliation</option>
                    <option value="Expense Sampling & Testing">Expense Sampling & Testing</option>
                    <option value="Input VAT Claim Verification">Input VAT Claim Verification</option>
                    <option value="Bank Statement Cross-Check">Bank Statement Cross-Check</option>
                    <option value="Withholding Tax Reconciliation">Withholding Tax Reconciliation</option>
                    <option value="Asset Register Audit">Asset Register Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Working Paper Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Bank Statements to Sales Ledger Reconciliation..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Detailed Description of Work Performed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail testing procedures, sample sizes, formulas applied, reconciliations performed, and variances identified..."
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Audit Conclusions & Findings Cross-Link
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize conclusion reached and basis for tax adjustment..."
                  value={conclusions}
                  onChange={(e) => setConclusions(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Link to Procedure
                  </label>
                  <select
                    value={relatedProcedureId}
                    onChange={(e) => setRelatedProcedureId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                  >
                    <option value="">-- None --</option>
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.reference}: {p.title.slice(0, 28)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Link to Finding
                  </label>
                  <select
                    value={relatedFindingId}
                    onChange={(e) => setRelatedFindingId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                  >
                    <option value="">-- None --</option>
                    {findings.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.reference}: {f.title.slice(0, 28)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Attached Evidence Documents ({evidenceIds.length} attached)
                </label>
                <div className="border border-gray-200 rounded p-2.5 max-h-32 overflow-y-auto space-y-1 bg-gray-50">
                  {evidenceList.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={evidenceIds.includes(ev.id)}
                          onChange={() => handleToggleEvidence(ev.id)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-mono font-bold text-gray-800">{ev.reference}</span>
                        <span className="text-gray-600 truncate max-w-xs">{ev.description}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{ev.source}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded shadow-2xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingWP ? 'Update Working Paper' : 'Save Working Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Working Paper Modal */}
      {previewWP && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {previewWP.reference}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-600 font-semibold">{previewWP.category}</span>
              </div>
              <button
                onClick={() => setPreviewWP(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <h3 className="text-base font-bold text-gray-900">{previewWP.title}</h3>
              <div className="text-[11px] text-gray-500 font-mono">
                Prepared by: {previewWP.preparedBy} · Date: {previewWP.date} · Status: {previewWP.status}
              </div>

              <div>
                <span className="font-bold text-gray-700 uppercase text-[10px] block mb-1">
                  Work Performed & Audit Testing
                </span>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {previewWP.workPerformed}
                </div>
              </div>

              {previewWP.conclusions && (
                <div>
                  <span className="font-bold text-gray-700 uppercase text-[10px] block mb-1">
                    Audit Conclusion
                  </span>
                  <p className="text-gray-800 bg-emerald-50/50 p-2.5 rounded border border-emerald-200">
                    {previewWP.conclusions}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setPreviewWP(null)}
                  className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
