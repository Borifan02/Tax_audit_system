import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  FileSearch,
  Scale,
  BadgeAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  FileText,
  FileSignature,
  FileBadge,
  Archive,
  Database
} from 'lucide-react';
import {
  AuditCase,
  AuditFinding,
  AuditTrailEntry,
  AssessmentNotice,
  AuthUser
} from '../../types/audit';
import { itasApi } from '../../services/api';
import { AuditTrailDrawer } from '../workspace/AuditTrailDrawer';

interface FraudInvestigatorWorkspaceProps {
  currentUser: AuthUser;
  onSelectCase?: (caseId: string) => void;
}

export const FraudInvestigatorWorkspace: React.FC<FraudInvestigatorWorkspaceProps> = ({
  currentUser,
  onSelectCase
}) => {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CA-2026-104');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [caseLoading, setCaseLoading] = useState<boolean>(false);

  // Loaded full case
  const [activeCase, setActiveCase] = useState<AuditCase | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [assessmentNotice, setAssessmentNotice] = useState<AssessmentNotice | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Action
  const [dossierNotes, setDossierNotes] = useState<string>('');
  const [isUpdatingDossier, setIsUpdatingDossier] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await itasApi.getAssignedCases(false);
      setCasesList(list);
      if (list.length > 0 && !list.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load fraud investigator cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const loadFullCase = useCallback(async (caseId: string) => {
    setCaseLoading(true);
    setSuccessMessage(null);
    try {
      const fullCase = await itasApi.getFullCase(caseId);
      setActiveCase(fullCase.auditCase);
      setFindings(fullCase.findings || []);
      setAssessmentNotice(fullCase.assessmentNotice || null);
      setAuditTrail(fullCase.auditTrail || []);
      setDossierNotes(fullCase.auditCase.fraudDossierNotes || '');
    } catch (err) {
      console.error('Failed to load fraud case:', err);
    } finally {
      setCaseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadFullCase(selectedCaseId);
    }
  }, [selectedCaseId, loadFullCase]);

  const handleSaveDossier = async () => {
    if (!activeCase) return;
    setIsUpdatingDossier(true);
    try {
      const res = await itasApi.executeWorkflow(activeCase.id, {
        action: 'INVESTIGATOR_UPDATE_DOSSIER',
        comment: dossierNotes,
        user: currentUser.name
      });
      if (res.success) {
        setSuccessMessage('Criminal Investigation Dossier updated successfully.');
        await loadFullCase(activeCase.id);
      }
    } catch (err) {
      console.error('Failed to update dossier:', err);
    } finally {
      setIsUpdatingDossier(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900/5 flex flex-col">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white px-4 sm:px-6 py-3 border-b border-rose-950/60 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <BadgeAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100">
                  Criminal Tax Fraud Investigation Directorate
                </h1>
                <span className="text-2xs px-2 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Penal Code Enactment
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lead Investigator: <strong className="text-slate-200">{currentUser.name}</strong> • Badge:{' '}
                <span className="font-mono text-slate-300">{currentUser.badgeNumber}</span> • Clearance:{' '}
                <span className="text-slate-300 font-mono text-2xs">{currentUser.clearanceLevel}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuditTrailOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors self-end md:self-auto"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Forensic Chain of Custody</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fraud Cases */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <h2 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Referred Fraud Dockets
                </h2>
              </div>
              <span className="text-2xs font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                {casesList.length} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {casesList.map((c) => {
                const isSelected = c.id === selectedCaseId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50/70 border-l-4 border-rose-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="font-mono text-2xs font-bold text-rose-700 block">
                          {c.caseNumber}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">
                          {c.taxpayerName}
                        </h3>
                      </div>
                      <span className="text-2xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                        CRIMINAL FRAUD
                      </span>
                    </div>

                    <div className="text-2xs text-slate-500 flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span>TIN: {c.tin}</span>
                      <span className="font-bold text-rose-900 font-mono">
                        ${(c.totalAssessment || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Forensic Details */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {caseLoading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-600 mb-2" />
              <p className="text-xs font-medium">Loading criminal docket...</p>
            </div>
          ) : !activeCase ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              <FileSearch className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Select a fraud docket to inspect forensic evidence.</p>
            </div>
          ) : (
            <>
              {/* Docket Overview */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-700">
                      {activeCase.caseNumber} • DOCKET ID: FIU-2026-CRIM-0881
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {activeCase.taxpayerName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      TIN: <strong className="font-mono text-slate-700">{activeCase.tin}</strong> • Period:{' '}
                      <strong className="text-slate-700">{activeCase.taxPeriod}</strong> • Auditor:{' '}
                      <strong className="text-slate-700">{activeCase.assignedAuditor}</strong>
                    </p>
                  </div>

                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">
                      Estimated Evasion & Due
                    </span>
                    <span className="text-xl font-bold font-mono text-rose-950">
                      ${(assessmentNotice?.totalAssessmentDue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Prima Facie Fraud Indicators */}
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-950">
                  <h4 className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>Statutory Criminal Evasion Indicators (SOR FR-04.4-28)</span>
                  </h4>
                  <p className="text-rose-900 leading-relaxed text-2xs">
                    {activeCase.riskInformation}
                  </p>
                  {assessmentNotice?.fraudReferralReason && (
                    <div className="mt-2 pt-2 border-t border-rose-200 text-2xs">
                      <strong>Audit Team Referral Basis:</strong> "{assessmentNotice.fraudReferralReason}"
                    </div>
                  )}
                </div>

                {successMessage && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Criminal Investigation Dossier */}
                <div className="mt-5 pt-4 border-t border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Criminal Prosecution Dossier Notes
                  </h3>
                  <textarea
                    value={dossierNotes}
                    onChange={(e) => setDossierNotes(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                    placeholder="Enter criminal investigation progress, subpoena records, search warrant execution details..."
                  />

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={handleSaveDossier}
                      disabled={isUpdatingDossier}
                      className="px-4 py-2 text-xs font-bold rounded bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      {isUpdatingDossier ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Update Investigation Dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AuditTrailDrawer
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
        entries={auditTrail}
        caseId={selectedCaseId}
      />
    </div>
  );
};

export default FraudInvestigatorWorkspace;
