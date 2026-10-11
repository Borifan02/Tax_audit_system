import React, { useState } from 'react';
import {
  Plus,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit2,
  FileCheck,
  FileText,
  AlertCircle,
  X,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { EvidenceItem, AuditProcedure, AuditFinding } from '../../types/audit';

interface StepEvidenceProps {
  evidence: EvidenceItem[];
  procedures: AuditProcedure[];
  findings: AuditFinding[];
  onAddEvidence: (item: Partial<EvidenceItem>) => Promise<void>;
  onDeleteEvidence: (id: string) => Promise<void>;
  onUpdateEvidence?: (id: string, updates: Partial<EvidenceItem>) => Promise<void>;
}

export const StepEvidence: React.FC<StepEvidenceProps> = ({
  evidence,
  procedures,
  findings,
  onAddEvidence,
  onDeleteEvidence
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal & Drawer states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);

  // New Evidence Form State
  const [newReference, setNewReference] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSource, setNewSource] = useState('Taxpayer Submission');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProcedureId, setNewProcedureId] = useState('');
  const [newFindingId, setNewFindingId] = useState('');
  const [newStatus, setNewStatus] = useState<'Verified' | 'Pending Verification' | 'Disputed'>('Verified');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('1.8 MB');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered evidence list
  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch =
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesSource && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setNewReference(`EVD-2026-${String(evidence.length + 1).padStart(3, '0')}`);
    setNewDescription('');
    setNewSource('Taxpayer Submission');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewProcedureId(procedures[0]?.id || '');
    setNewFindingId('');
    setNewStatus('Verified');
    setNewFileName('');
    setNewNotes('');
    setIsAddModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFileName(file.name);
      setNewFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      if (!newDescription) {
        setNewDescription(`Evidence document: ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  };

  const handleSubmitNewEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddEvidence({
        reference: newReference,
        description: newDescription,
        source: newSource,
        date: newDate,
        relatedProcedureId: newProcedureId,
        relatedFindingId: newFindingId || undefined,
        status: newStatus,
        fileName: newFileName || 'document_scan.pdf',
        fileSize: newFileSize || '1.2 MB',
        fileType: 'application/pdf',
        uploadedBy: 'Jane Doe',
        notes: newNotes
      });
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Evidence Register (SOR FR-04.3)
            </h3>
            <span className="text-xs font-mono text-gray-500 font-medium">
              {evidence.length} Registered Records
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit evidence repository with source verification, procedure cross-linking, and document retention.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Evidence Record</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, description, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Sources</option>
            <option value="Taxpayer Submission">Taxpayer Submission</option>
            <option value="Third-Party Bank Confirmation">Third-Party Bank Confirmation</option>
            <option value="Electronic Invoicing System (TIMS)">Electronic Invoicing System (TIMS)</option>
            <option value="Customs Declaration (ASYCUDA)">Customs Declaration</option>
            <option value="Withholding Tax Returns (WHT)">Withholding Tax Returns</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Evidence Register Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Description & File</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Related Procedure</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">No evidence records match your criteria.</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Click "Add Evidence Record" above to register new documents.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((item) => {
                  const relatedProc = procedures.find((p) => p.id === item.relatedProcedureId);
                  const relatedFind = findings.find((f) => f.id === item.relatedFindingId);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Reference */}
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {item.reference}
                      </td>

                      {/* Description & File */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {item.description}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px] mt-0.5">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[180px]">{item.fileName}</span>
                          <span className="text-gray-300">·</span>
                          <span>{item.fileSize}</span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700">
                          {item.source}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {item.date}
                      </td>

                      {/* Related Procedure */}
                      <td className="py-3 px-4">
                        {relatedProc ? (
                          <div>
                            <span className="font-mono font-bold text-gray-800">
                              {relatedProc.reference}
                            </span>
                            <span className="text-gray-500 text-[11px] block truncate max-w-[150px]">
                              {relatedProc.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                        {relatedFind && (
                          <span className="font-mono text-[10px] text-rose-600 block mt-0.5">
                            Linked: {relatedFind.reference}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            item.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'Pending Verification'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'Verified'
                                ? 'bg-emerald-500'
                                : item.status === 'Pending Verification'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100 transition-colors"
                            title="View evidence details and document preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove evidence record ${item.reference}?`)) {
                                onDeleteEvidence(item.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Delete evidence record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Evidence Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Register New Audit Evidence (SOR FR-04.3)
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewEvidence} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Evidence Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Date Obtained <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Evidence Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="E.g. Certified bank confirmation statement for Operating Account #4489..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Evidence Source <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Taxpayer Submission">Taxpayer Submission</option>
                    <option value="Third-Party Bank Confirmation">Third-Party Bank Confirmation</option>
                    <option value="Electronic Invoicing System (TIMS)">Electronic Invoicing System (TIMS)</option>
                    <option value="Customs Declaration (ASYCUDA)">Customs Declaration (ASYCUDA)</option>
                    <option value="Withholding Tax Returns (WHT)">Withholding Tax Returns (WHT)</option>
                    <option value="Payroll Return (PAYE)">Payroll Return (PAYE)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Verification Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Disputed">Disputed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Associate with Audit Procedure
                  </label>
                  <select
                    value={newProcedureId}
                    onChange={(e) => setNewProcedureId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- None / General Evidence --</option>
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.reference}: {p.title.slice(0, 32)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Associate with Finding
                  </label>
                  <select
                    value={newFindingId}
                    onChange={(e) => setNewFindingId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- None --</option>
                    {findings.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.reference}: {f.title.slice(0, 32)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Document Box */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Upload Document File
                </label>
                <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-indigo-400 bg-gray-50/50 transition-colors">
                  <input
                    type="file"
                    id="evidence-file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="evidence-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-600"
                  >
                    <UploadCloud className="w-6 h-6 text-indigo-600" />
                    <span className="font-semibold text-indigo-700">Click to upload file</span>
                    <span className="text-[11px] text-gray-400">
                      PDF, XLSX, CSV, or Scanned Images up to 25MB
                    </span>
                  </label>
                  {newFileName && (
                    <div className="mt-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-flex items-center gap-1.5 border border-emerald-200">
                      <FileCheck className="w-3.5 h-3.5" />
                      {newFileName} ({newFileSize})
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Auditor Verification Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Chain of custody, verification hash, or source authenticity notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded shadow-2xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Evidence Preview Drawer/Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {previewItem.reference}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-600 font-medium">Evidence Details & Chain of Custody</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase">Description</span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{previewItem.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3.5 rounded border border-gray-200">
                <div>
                  <span className="text-[11px] text-gray-500 block">Source</span>
                  <span className="font-medium text-gray-900">{previewItem.source}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Date Obtained</span>
                  <span className="font-mono text-gray-900">{previewItem.date}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Verification Status</span>
                  <span className="font-semibold text-emerald-700">{previewItem.status}</span>
                </div>
              </div>

              {/* Document File Preview Box */}
              <div className="border border-gray-200 rounded p-4 bg-gray-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-gray-900 text-xs">{previewItem.fileName}</div>
                    <div className="text-[11px] text-gray-500">
                      Size: {previewItem.fileSize} · Type: {previewItem.fileType} · Uploaded by: {previewItem.uploadedBy}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Simulated downloading document: ${previewItem.fileName}`)}
                  className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded hover:bg-indigo-50 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Download
                </button>
              </div>

              {previewItem.notes && (
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">Verification Notes</span>
                  <p className="mt-1 text-gray-700 bg-white p-2.5 rounded border border-gray-200 font-mono text-[11px]">
                    {previewItem.notes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-900"
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
