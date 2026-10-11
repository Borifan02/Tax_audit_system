import React, { useState } from 'react';
import {
  Plus,
  Scale,
  DollarSign,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  FileText,
  X,
  ShieldAlert,
  HelpCircle,
  Link2
} from 'lucide-react';
import { AuditFinding, AuditProcedure, EvidenceItem, TaxQuery, WorkingPaper } from '../../types/audit';

interface StepFindingsProps {
  findings: AuditFinding[];
  procedures: AuditProcedure[];
  evidenceList: EvidenceItem[];
  queries: TaxQuery[];
  workingPapers: WorkingPaper[];
  onCreateFinding: (finding: Partial<AuditFinding>) => Promise<void>;
  onUpdateFinding: (findingId: string, updates: Partial<AuditFinding>) => Promise<void>;
  onDeleteFinding: (findingId: string) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepFindings: React.FC<StepFindingsProps> = ({
  findings,
  procedures,
  evidenceList,
  queries,
  workingPapers,
  onCreateFinding,
  onUpdateFinding,
  onDeleteFinding,
  onTriggerAutosave
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null);
  const [previewFinding, setPreviewFinding] = useState<AuditFinding | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [auditArea, setAuditArea] = useState('Corporate Income Tax');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [condition, setCondition] = useState('');
  const [cause, setCause] = useState('');
  const [effect, setEffect] = useState('');
  const [underDeclaredAmount, setUnderDeclaredAmount] = useState<number>(0);
  const [penaltyRate, setPenaltyRate] = useState<number>(20);
  const [auditorAnalysis, setAuditorAnalysis] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [status, setStatus] = useState<AuditFinding['status']>('CONFIRMED');
  const [relatedProcedureId, setRelatedProcedureId] = useState('');
  const [relatedQueryId, setRelatedQueryId] = useState('');
  const [relatedWorkingPaperId, setRelatedWorkingPaperId] = useState('');
  const [relatedEvidenceIds, setRelatedEvidenceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial totals
  const totalPrincipal = findings.reduce((sum, f) => sum + (f.underDeclaredAmount || 0), 0);
  const totalPenalty = findings.reduce((sum, f) => sum + (f.penaltyAmount || 0), 0);
  const totalInterest = findings.reduce((sum, f) => sum + (f.interestAmount || 0), 0);
  const grandTotal = findings.reduce((sum, f) => sum + (f.totalTaxImpact || 0), 0);

  const openCreateModal = () => {
    setEditingFinding(null);
    setTitle('');
    setAuditArea('Corporate Income Tax');
    setDescription('');
    setCriteria('Corporate Income Tax Act Section 16(1) (Wholly & Exclusively Incurred Rule)');
    setCondition('');
    setCause('');
    setEffect('');
    setUnderDeclaredAmount(15000);
    setPenaltyRate(20);
    setAuditorAnalysis('');
    setConclusion('');
    setRecommendation('');
    setStatus('CONFIRMED');
    setRelatedProcedureId(procedures[0]?.id || '');
    setRelatedQueryId('');
    setRelatedWorkingPaperId('');
    setRelatedEvidenceIds([]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (f: AuditFinding) => {
    setEditingFinding(f);
    setTitle(f.title);
    setAuditArea(f.auditArea);
    setDescription(f.description);
    setCriteria(f.criteria);
    setCondition(f.condition);
    setCause(f.cause);
    setEffect(f.effect);
    setUnderDeclaredAmount(f.underDeclaredAmount);
    setPenaltyRate(f.penaltyRate);
    setAuditorAnalysis(f.auditorAnalysis);
    setConclusion(f.conclusion);
    setRecommendation(f.recommendation);
    setStatus(f.status);
    setRelatedProcedureId(f.relatedProcedureId || '');
    setRelatedQueryId(f.relatedQueryId || '');
    setRelatedWorkingPaperId(f.relatedWorkingPaperId || '');
    setRelatedEvidenceIds(f.relatedEvidenceIds || []);
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<AuditFinding> = {
        title,
        auditArea,
        description,
        criteria,
        condition,
        cause,
        effect,
        underDeclaredAmount: Number(underDeclaredAmount),
        penaltyRate: Number(penaltyRate),
        auditorAnalysis,
        conclusion,
        recommendation,
        status,
        isSignificant: Number(underDeclaredAmount) >= 50000,
        relatedProcedureId,
        relatedQueryId: relatedQueryId || undefined,
        relatedWorkingPaperId: relatedWorkingPaperId || undefined,
        relatedEvidenceIds
      };

      if (editingFinding) {
        await onUpdateFinding(editingFinding.id, payload);
      } else {
        await onCreateFinding({
          ...payload,
          reference: `FND-2026-${String(findings.length + 1).padStart(2, '0')}`
        });
      }
      setIsCreateModalOpen(false);
      onTriggerAutosave();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Audit Findings & Tax Liability Adjustments
            </h3>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {findings.length} Established Findings
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Structured audit finding sheets documenting criteria, conditions, root cause, and computation of statutory tax shortfalls.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Audit Finding</span>
        </button>
      </div>

      {/* Tax Adjustment Summary Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-indigo-600" />
            Statutory Additional Tax Assessment Computation
          </span>
          <span className="text-xs text-gray-400">
            Subject to Section 45 Statutory Assessment Notice
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <div>
            <span className="text-[11px] text-gray-500 block uppercase">Principal Tax Shortfall</span>
            <span className="text-xl font-bold font-mono text-gray-900 tabular-nums">
              ${(totalPrincipal || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block uppercase">20% Statutory Penalties</span>
            <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
              ${(totalPenalty || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block uppercase">Cumulative Interest</span>
            <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
              ${(totalInterest || 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800 block uppercase">Total Adjustment</span>
            <span className="text-2xl font-bold font-mono text-rose-900 tabular-nums">
              ${(grandTotal || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Ref</th>
                <th className="py-2.5 px-4">Area & Title</th>
                <th className="py-2.5 px-4">Statutory Criteria</th>
                <th className="py-2.5 px-4 text-right">Principal</th>
                <th className="py-2.5 px-4 text-right">Penalties & Int.</th>
                <th className="py-2.5 px-4 text-right">Total Impact</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {findings.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                    {f.reference}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-semibold text-[10px] uppercase text-gray-500 block">
                      {f.auditArea}
                    </span>
                    <span className="font-bold text-gray-900 text-xs">{f.title}</span>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{f.description}</p>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="text-[11px] text-gray-700 font-mono line-clamp-2">
                      {f.criteria}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-gray-900 tabular-nums">
                    ${(f.underDeclaredAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-600 tabular-nums">
                    ${((f.penaltyAmount || 0) + (f.interestAmount || 0)).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 tabular-nums text-sm">
                    ${(f.totalTaxImpact || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        f.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : f.status === 'UNDER_REVIEW'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewFinding(f)}
                        className="p-1 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
                        title="View Full Finding Sheet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(f)}
                        className="p-1 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
                        title="Edit Finding"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete finding ${f.reference}?`)) {
                            onDeleteFinding(f.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete Finding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Finding Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {editingFinding ? `Edit Finding: ${editingFinding.reference}` : 'Record Audit Finding'}
              </h4>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Audit Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={auditArea}
                    onChange={(e) => setAuditArea(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Corporate Income Tax">Corporate Income Tax</option>
                    <option value="Value Added Tax (VAT)">Value Added Tax (VAT)</option>
                    <option value="Withholding Tax (WHT)">Withholding Tax (WHT)</option>
                    <option value="Customs & Excise">Customs & Excise</option>
                    <option value="Payroll Tax (PAYE)">Payroll Tax (PAYE)</option>
                    <option value="Transfer Pricing">Transfer Pricing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Finding Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Disallowance of Unsubstantiated Consulting Fees..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  General Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of finding and transactions scrutinized..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Four Elements of an Audit Finding (Criteria, Condition, Cause, Effect) */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-800 text-[10px] uppercase mb-1">
                    Criteria (Tax Law / Statutory Rule Violated)
                  </label>
                  <input
                    type="text"
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    placeholder="E.g. Income Tax Act Sec 16(1)..."
                    className="w-full px-2.5 py-1 border border-gray-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-800 text-[10px] uppercase mb-1">
                    Condition (Observed Facts / Defect)
                  </label>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="E.g. $110,000 paid without timesheets or invoices..."
                    className="w-full px-2.5 py-1 border border-gray-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-800 text-[10px] uppercase mb-1">
                    Cause (Root Reason / Taxpayer Failure)
                  </label>
                  <input
                    type="text"
                    value={cause}
                    onChange={(e) => setCause(e.target.value)}
                    placeholder="E.g. Profit shifting to offshore non-resident affiliate..."
                    className="w-full px-2.5 py-1 border border-gray-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-800 text-[10px] uppercase mb-1">
                    Effect / Statutory Impact
                  </label>
                  <input
                    type="text"
                    value={effect}
                    onChange={(e) => setEffect(e.target.value)}
                    placeholder="E.g. CIT base eroded; unpaid tax liability..."
                    className="w-full px-2.5 py-1 border border-gray-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* Financial Computation */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Under-Declared Amount (USD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={underDeclaredAmount}
                    onChange={(e) => setUnderDeclaredAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono font-bold text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Statutory Penalty Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={penaltyRate}
                    onChange={(e) => setPenaltyRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Estimated Total Impact
                  </label>
                  <div className="py-2 px-3 bg-white border border-gray-300 rounded font-mono font-bold text-rose-700">
                    $
                    {(
                      underDeclaredAmount +
                      Math.round(underDeclaredAmount * (penaltyRate / 100)) +
                      Math.round(underDeclaredAmount * 0.05)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Auditor Analysis & Technical Evaluation
                  </label>
                  <textarea
                    rows={2}
                    value={auditorAnalysis}
                    onChange={(e) => setAuditorAnalysis(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Proposed Recommendation / Assessment
                  </label>
                  <textarea
                    rows={2}
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Cross-linking to Procedure, Query, Working Paper */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Link Procedure
                  </label>
                  <select
                    value={relatedProcedureId}
                    onChange={(e) => setRelatedProcedureId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                  >
                    <option value="">-- None --</option>
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.reference}: {p.title.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Link Query
                  </label>
                  <select
                    value={relatedQueryId}
                    onChange={(e) => setRelatedQueryId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                  >
                    <option value="">-- None --</option>
                    {queries.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.reference}: {q.subject.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Link Working Paper
                  </label>
                  <select
                    value={relatedWorkingPaperId}
                    onChange={(e) => setRelatedWorkingPaperId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                  >
                    <option value="">-- None --</option>
                    {workingPapers.map((wp) => (
                      <option key={wp.id} value={wp.id}>
                        {wp.reference}: {wp.title.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
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
                  {isSubmitting ? 'Saving...' : editingFinding ? 'Update Finding' : 'Record Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Finding Drawer/Modal */}
      {previewFinding && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {previewFinding.reference}
                </span>
                <span className="text-gray-300 mx-2">·</span>
                <span className="text-xs text-gray-600 font-semibold">{previewFinding.auditArea}</span>
              </div>
              <button
                onClick={() => setPreviewFinding(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <h3 className="text-base font-bold text-gray-900">{previewFinding.title}</h3>
              <p className="text-gray-700 leading-relaxed">{previewFinding.description}</p>

              <div className="bg-gray-50 p-3.5 rounded border border-gray-200 grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-gray-400 block font-sans">Under-Declared:</span>
                  <span className="font-bold text-gray-900">${(previewFinding.underDeclaredAmount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Total Tax Assessment:</span>
                  <span className="font-bold text-rose-700">${(previewFinding.totalTaxImpact || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="font-bold text-gray-700 uppercase text-[10px]">Statutory Criteria:</span>
                  <p className="text-gray-800 bg-white p-2 rounded border border-gray-200 font-mono text-[11px] mt-0.5">
                    {previewFinding.criteria}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 uppercase text-[10px]">Condition & Observed Facts:</span>
                  <p className="text-gray-800 mt-0.5">{previewFinding.condition}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 uppercase text-[10px]">Recommendation:</span>
                  <p className="text-gray-800 mt-0.5">{previewFinding.recommendation}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setPreviewFinding(null)}
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
