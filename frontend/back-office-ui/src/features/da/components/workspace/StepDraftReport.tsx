import React, { useState } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Printer,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Scale,
  ShieldCheck,
  Download
} from 'lucide-react';
import {
  DraftReport,
  AuditCase,
  AuditProcedure,
  EvidenceItem,
  AuditFinding,
  WorkingPaper,
  TaxQuery
} from '../../types/audit';

interface StepDraftReportProps {
  draftReport: DraftReport;
  caseData: AuditCase;
  procedures: AuditProcedure[];
  evidenceList: EvidenceItem[];
  findings: AuditFinding[];
  workingPapers: WorkingPaper[];
  queries: TaxQuery[];
  onUpdateReport: (report: Partial<DraftReport>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepDraftReport: React.FC<StepDraftReportProps> = ({
  draftReport,
  caseData,
  procedures,
  evidenceList,
  findings,
  workingPapers,
  queries,
  onUpdateReport,
  onTriggerAutosave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState(draftReport.executiveSummary);
  const [scopeAndObjectives, setScopeAndObjectives] = useState(draftReport.scopeAndObjectives);
  const [methodology, setMethodology] = useState(draftReport.methodology);
  const [findingsSummary, setFindingsSummary] = useState(draftReport.findingsSummary);
  const [recommendedAdjustments, setRecommendedAdjustments] = useState(draftReport.recommendedAdjustments);
  const [statutoryRecommendations, setStatutoryRecommendations] = useState(draftReport.statutoryRecommendations);
  const [isSaving, setIsSaving] = useState(false);

  // Financial calculations from live findings
  const totalPrincipal = findings.reduce((sum, f) => sum + (f.underDeclaredAmount || 0), 0);
  const totalPenalty = findings.reduce((sum, f) => sum + (f.penaltyAmount || 0), 0);
  const totalInterest = findings.reduce((sum, f) => sum + (f.interestAmount || 0), 0);
  const grandTotal = findings.reduce((sum, f) => sum + (f.totalTaxImpact || 0), 0);

  const handleRefreshFromWorkspace = () => {
    // Dynamically regenerate summary text from live workspace records
    const completedProcs = procedures.filter((p) => p.status === 'COMPLETED').length;
    const verifiedEvidence = evidenceList.filter((e) => e.status === 'Verified').length;
    const resolvedQueries = queries.filter((q) => q.status === 'RESOLVED').length;

    const newExec = `A desk audit was completed for ${caseData.taxpayerName} (TIN: ${caseData.tin}) for tax period ${caseData.taxPeriod}. During the examination, ${completedProcs} out of ${procedures.length} statutory procedures were executed, supported by ${verifiedEvidence} verified third-party and taxpayer evidence files. The audit established ${findings.length} confirmed non-compliance findings resulting in total proposed tax adjustments of $${(grandTotal || 0).toLocaleString()}.`;

    const newScope = `The scope of this desk audit was restricted to high-risk areas flagged by ITAS automated risk algorithms, specifically: ${caseData.auditScope}.`;

    const newFindingsSum = findings
      .map((f, idx) => `Finding ${f.reference}: ${f.title} (${f.auditArea}) — Principal tax shortfall: $${(f.underDeclaredAmount || 0).toLocaleString()} plus statutory penalties. Criteria: ${f.criteria}.`)
      .join('\n\n');

    const newAdjustments = `1. Total Principal Tax Under-Declaration: $${(totalPrincipal || 0).toLocaleString()}\n2. Statutory 20% Penalty: $${(totalPenalty || 0).toLocaleString()}\n3. Statutory Late Payment Interest: $${(totalInterest || 0).toLocaleString()}\nTotal Proposed Assessment: $${(grandTotal || 0).toLocaleString()}`;

    setExecutiveSummary(newExec);
    setScopeAndObjectives(newScope);
    setFindingsSummary(newFindingsSum);
    setRecommendedAdjustments(newAdjustments);
    alert('Draft report sections refreshed with latest workspace findings and calculations.');
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      await onUpdateReport({
        executiveSummary,
        scopeAndObjectives,
        methodology,
        findingsSummary,
        recommendedAdjustments,
        statutoryRecommendations
      });
      setIsEditing(false);
      onTriggerAutosave();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Draft Statutory Audit Report
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {draftReport.reportReference}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Formulate official audit findings report for supervisory review, taxpayer demand notice, or formal assessment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefreshFromWorkspace}
            className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Re-populate report text from live findings, procedures, and calculations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh from Live Data</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Preview Report' : 'Edit Report'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleSaveReport}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Draft Report'}</span>
          </button>
        </div>
      </div>

      {/* Official Audit Report Document Canvas */}
      <div className="bg-white border border-gray-300 rounded shadow-sm max-w-4xl mx-auto p-8 sm:p-12 space-y-8 font-sans text-xs text-gray-800">
        {/* Document Header */}
        <div className="border-b-2 border-gray-900 pb-6 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-800 block">
            Integrated Tax Administration System (ITAS)
          </span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">
            Statutory Desk Audit Report & Tax Assessment Findings
          </h2>
          <div className="text-xs text-gray-600 font-mono pt-1">
            Report Reference: {draftReport.reportReference} · Date: {draftReport.generatedDate}
          </div>
        </div>

        {/* Audit Entity Identification Box */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Taxpayer Name</span>
            <span className="text-sm font-bold text-gray-900">{caseData.taxpayerName}</span>
            <span className="text-xs text-gray-500 block font-mono">TIN: {caseData.tin}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Audit Details</span>
            <span className="text-xs text-gray-900 font-medium block">
              Period: {caseData.taxPeriod} (FY{caseData.taxYear})
            </span>
            <span className="text-xs text-gray-500 block">
              Auditor: {caseData.assignedAuditor} | Team Leader: {caseData.teamLeader}
            </span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
            1. Executive Summary
          </h4>
          {isEditing ? (
            <textarea
              rows={4}
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded leading-relaxed text-xs"
            />
          ) : (
            <p className="leading-relaxed text-gray-700 whitespace-pre-wrap">{executiveSummary}</p>
          )}
        </div>

        {/* Section 2: Audit Scope & Methodology */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
            2. Scope & Audit Methodology
          </h4>
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={2}
                value={scopeAndObjectives}
                onChange={(e) => setScopeAndObjectives(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded text-xs"
              />
              <textarea
                rows={2}
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded text-xs"
              />
            </div>
          ) : (
            <div className="space-y-2 text-gray-700 leading-relaxed">
              <p>{scopeAndObjectives}</p>
              <p>{methodology}</p>
            </div>
          )}
        </div>

        {/* Section 3: Summary of Findings & Tax Adjustment Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
            3. Summary of Findings & Tax Assessment Schedule
          </h4>

          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-gray-800 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3">Ref</th>
                  <th className="py-2 px-3">Audit Area & Title</th>
                  <th className="py-2 px-3 text-right">Principal Under-Declared</th>
                  <th className="py-2 px-3 text-right">Penalty (20%)</th>
                  <th className="py-2 px-3 text-right">Interest</th>
                  <th className="py-2 px-3 text-right">Total Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono text-xs">
                {findings.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2 px-3 font-bold text-indigo-700">{f.reference}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="font-semibold text-gray-900">{f.title}</span>
                      <span className="text-[10px] text-gray-500 block">{f.auditArea}</span>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      ${(f.underDeclaredAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      ${(f.penaltyAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      ${(f.interestAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-rose-700 tabular-nums">
                      ${(f.totalTaxImpact || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-300">
                  <td colSpan={2} className="py-2.5 px-3 uppercase font-sans">
                    Total Additional Tax Assessment
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">${(totalPrincipal || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">${(totalPenalty || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">${(totalInterest || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-rose-800 tabular-nums text-sm">
                    ${(grandTotal || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {isEditing ? (
            <textarea
              rows={4}
              value={findingsSummary}
              onChange={(e) => setFindingsSummary(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-xs mt-2"
            />
          ) : (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mt-2">{findingsSummary}</p>
          )}
        </div>

        {/* Section 4: Index of Evidence & Working Papers */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
            4. Evidential Register & Working Paper Index
          </h4>
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <div>
              <span className="font-semibold text-gray-700 block mb-1">Supporting Evidence Retained:</span>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                {evidenceList.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono font-medium">{e.reference}:</span> {e.description.slice(0, 48)}...
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-gray-700 block mb-1">Working Paper Schedules:</span>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                {workingPapers.map((wp) => (
                  <li key={wp.id}>
                    <span className="font-mono font-medium">{wp.reference}:</span> {wp.title.slice(0, 48)}...
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5: Statutory Recommendations */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
            5. Recommendations & Next Administrative Steps
          </h4>
          {isEditing ? (
            <textarea
              rows={3}
              value={statutoryRecommendations}
              onChange={(e) => setStatutoryRecommendations(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-xs leading-relaxed"
            />
          ) : (
            <p className="leading-relaxed text-gray-700 whitespace-pre-wrap">{statutoryRecommendations}</p>
          )}
        </div>

        {/* Sign-off Blocks */}
        <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-3">
            <div className="font-semibold text-gray-900">Lead Desk Auditor:</div>
            <div className="font-mono text-gray-600">{caseData.assignedAuditor}</div>
            <div className="h-10 border-b border-gray-400"></div>
            <div className="text-[10px] text-gray-400">Signature & Date</div>
          </div>

          <div className="space-y-3">
            <div className="font-semibold text-gray-900">Supervising Team Leader:</div>
            <div className="font-mono text-gray-600">{caseData.teamLeader}</div>
            <div className="h-10 border-b border-gray-400"></div>
            <div className="text-[10px] text-gray-400">Approval Signature & Date</div>
          </div>
        </div>
      </div>
    </div>
  );
};
