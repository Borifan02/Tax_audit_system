import {
  AuditCase,
  EvidenceItem,
  AuditProcedure,
  TaxAnalysis,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  DraftReport,
  AuditTrailEntry,
  AuditStatus,
  EntryConference,
  CAATAuditData,
  ComprehensiveReconciliation,
  ExitConference,
  AssessmentNotice,
  AuthUser,
  SystemNotification
} from '../types/audit';
import { INITIAL_CASES_DATA, CaseFullData } from '../data/initialData';

// Local storage key prefix
const STORAGE_PREFIX = 'itas_audit_case_';

let currentUserId = localStorage.getItem('itas_current_user_id') || 'usr-auditor-01';

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
  localStorage.setItem('itas_current_user_id', userId);
}

export function getCurrentUserId(): string {
  return currentUserId;
}

function getRequestHeaders(additional?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': currentUserId,
    ...(additional || {})
  };
}

// Helper to get or seed fallback local cache
function getLocalCaseData(caseId: string): CaseFullData {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + caseId);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore localStorage errors
  }
  const initial = INITIAL_CASES_DATA[caseId] || INITIAL_CASES_DATA['CA-2026-101'];
  return JSON.parse(JSON.stringify(initial));
}

function saveLocalCaseData(caseId: string, data: CaseFullData): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + caseId, JSON.stringify(data));
  } catch {
    // Ignore localStorage quota errors
  }
}

export const itasApi = {
  // Auth
  async getAuthUsers(): Promise<AuthUser[]> {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) return await res.json();
    } catch {}
    return [
      {
        id: 'usr-auditor-01',
        name: 'Jane Doe',
        email: 'jane.doe@itas.gov.tax',
        role: 'COMPREHENSIVE_AUDITOR',
        title: 'Senior Comprehensive Tax Auditor',
        directorate: 'Large Taxpayers Office (LTO)',
        badgeNumber: 'LTO-AUD-2041',
        clearanceLevel: 'Level 3 (Restricted Financial Data)'
      },
      {
        id: 'usr-tl-01',
        name: 'John Smith',
        email: 'john.smith@itas.gov.tax',
        role: 'TEAM_LEADER',
        title: 'Audit Team Leader & Technical Reviewer',
        directorate: 'LTO Substantive Audit Division',
        badgeNumber: 'LTO-TL-1092',
        clearanceLevel: 'Level 4 (Supervisory Review & Endorsement)'
      },
      {
        id: 'usr-director-01',
        name: 'Marcus Vance',
        email: 'marcus.vance@itas.gov.tax',
        role: 'AUDIT_DIRECTOR',
        title: 'Director of Comprehensive Audits & Process Owner',
        directorate: 'Executive Directorate of Large Taxpayer Audits',
        badgeNumber: 'HQ-DIR-0043',
        clearanceLevel: 'Level 5 (Executive Statutory Authorization)'
      },
      {
        id: 'usr-fraud-01',
        name: 'Sarah Connor',
        email: 'sarah.connor@itas.gov.tax',
        role: 'FRAUD_INVESTIGATOR',
        title: 'Special Criminal Tax Fraud Investigator',
        directorate: 'Intelligence & Tax Fraud Investigation Directorate',
        badgeNumber: 'INV-FRAUD-088',
        clearanceLevel: 'Level 5 (Criminal Enforcement & Penal Sanctions)'
      }
    ];
  },

  async getCurrentUser(): Promise<AuthUser> {
    try {
      const res = await fetch(`/api/auth/me?userId=${currentUserId}`, {
        headers: getRequestHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    const all = await this.getAuthUsers();
    return all.find((u) => u.id === currentUserId) || all[0];
  },

  // Notifications
  async getNotifications(): Promise<SystemNotification[]> {
    try {
      const res = await fetch('/api/notifications', {
        headers: getRequestHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async markNotificationRead(id: string): Promise<SystemNotification | null> {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getRequestHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async markAllNotificationsRead(): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: getRequestHeaders()
      });
      if (res.ok) return true;
    } catch {}
    return false;
  },

  // Cases list
  async getAssignedCases(all?: boolean): Promise<Array<{
    id: string;
    caseNumber: string;
    tin: string;
    taxpayerName: string;
    taxPeriod: string;
    auditType: string;
    status: AuditStatus;
    riskScore: number;
    riskCategory: string;
    dueDate: string;
    assignedAuditor: string;
    teamLeader: string;
    requiresAction?: boolean;
    totalAssessment?: number;
    teamLeaderComment?: string;
    teamLeaderRecommendation?: string;
    directorComment?: string;
    stats: {
      proceduresCompleted: number;
      proceduresTotal: number;
      evidenceCollected: number;
      evidenceRequired: number;
      queriesResolved: number;
      queriesTotal: number;
      findings: number;
      workingPapers: number;
    };
  }>> {
    try {
      const res = await fetch('/api/v1/backoffice/ca/cases');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    // Return fallback list
    return Object.keys(INITIAL_CASES_DATA).map((id) => {
      const cData = getLocalCaseData(id);
      const c = cData.auditCase;
      const completedProcs = cData.procedures.filter((p) => p.status === 'COMPLETED').length;
      const verifiedEvidence = cData.evidence.filter((e) => e.status === 'Verified').length;
      const resolvedQueries = cData.queries.filter((q) => q.status === 'RESOLVED').length;
      return {
        id: c.id,
        caseNumber: c.caseNumber,
        tin: c.tin,
        taxpayerName: c.taxpayerName,
        taxPeriod: c.taxPeriod,
        auditType: c.auditType,
        status: c.status,
        riskScore: c.riskScore,
        riskCategory: c.riskCategory,
        dueDate: c.dueDate,
        assignedAuditor: c.assignedAuditor,
        teamLeader: c.teamLeader,
        stats: {
          proceduresCompleted: completedProcs,
          proceduresTotal: cData.procedures.length,
          evidenceCollected: verifiedEvidence,
          evidenceRequired: 5,
          queriesResolved: resolvedQueries,
          queriesTotal: cData.queries.length,
          findings: cData.findings.length,
          workingPapers: cData.workingPapers.length
        }
      };
    });
  },

  // Get full case data
  async getCaseData(caseId: string): Promise<CaseFullData> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        saveLocalCaseData(caseId, data);
        return data;
      }
    } catch {
      // Network failure
    }
    return getLocalCaseData(caseId);
  },

  async getFullCase(caseId: string): Promise<CaseFullData> {
    return this.getCaseData(caseId);
  },

  // Update case metadata
  async updateCase(caseId: string, updates: Partial<AuditCase>): Promise<AuditCase> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    current.auditCase = { ...current.auditCase, ...updates, lastSaved: new Date().toLocaleTimeString() };
    saveLocalCaseData(caseId, current);
    return current.auditCase;
  },

  // Autosave snapshot
  async autosaveCase(caseId: string, snapshot: Partial<CaseFullData>): Promise<{ success: boolean; lastSaved: string }> {
    const timestamp = new Date().toLocaleTimeString();
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });
      if (res.ok) {
        const result = await res.json();
        return result;
      }
    } catch {
      // Offline
    }

    // Save to local storage
    const current = getLocalCaseData(caseId);
    if (snapshot.procedures) current.procedures = snapshot.procedures;
    if (snapshot.evidence) current.evidence = snapshot.evidence;
    if (snapshot.queries) current.queries = snapshot.queries;
    if (snapshot.findings) current.findings = snapshot.findings;
    if (snapshot.workingPapers) current.workingPapers = snapshot.workingPapers;
    if (snapshot.draftReport) current.draftReport = snapshot.draftReport;
    if (snapshot.analysis) current.analysis = snapshot.analysis;
    current.auditCase.lastSaved = timestamp;
    saveLocalCaseData(caseId, current);

    return { success: true, lastSaved: timestamp };
  },

  // Procedures
  async updateProcedure(caseId: string, procId: string, updates: Partial<AuditProcedure>): Promise<AuditProcedure> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/procedures/${procId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const idx = current.procedures.findIndex((p) => p.id === procId);
    if (idx !== -1) {
      current.procedures[idx] = { ...current.procedures[idx], ...updates };
      saveLocalCaseData(caseId, current);
      return current.procedures[idx];
    }
    throw new Error('Procedure not found');
  },

  // Evidence
  async addEvidence(caseId: string, item: Partial<EvidenceItem>): Promise<EvidenceItem> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const newItem: EvidenceItem = {
      id: `EVD-${Date.now()}`,
      caseId,
      reference: item.reference || `EVD-2026-${String(current.evidence.length + 1).padStart(3, '0')}`,
      description: item.description || 'Uploaded Evidence',
      source: item.source || 'Taxpayer Submission',
      date: item.date || new Date().toISOString().split('T')[0],
      relatedProcedureId: item.relatedProcedureId || '',
      relatedFindingId: item.relatedFindingId || '',
      status: item.status || 'Verified',
      fileName: item.fileName || 'evidence_document.pdf',
      fileSize: item.fileSize || '1.2 MB',
      fileType: item.fileType || 'application/pdf',
      uploadedBy: item.uploadedBy || 'Jane Doe',
      notes: item.notes || ''
    };
    current.evidence.push(newItem);
    saveLocalCaseData(caseId, current);
    return newItem;
  },

  async createEvidence(caseId: string, item: Partial<EvidenceItem>): Promise<EvidenceItem> {
    return this.addEvidence(caseId, item);
  },

  async deleteEvidence(caseId: string, evidenceId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/evidence/${evidenceId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    current.evidence = current.evidence.filter((e) => e.id !== evidenceId);
    saveLocalCaseData(caseId, current);
    return true;
  },

  // Queries
  async createQuery(caseId: string, query: Partial<TaxQuery>): Promise<TaxQuery> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const newQ: TaxQuery = {
      id: `QRY-${Date.now()}`,
      caseId,
      reference: query.reference || `QRY-2026-${String(current.queries.length + 1).padStart(2, '0')}`,
      subject: query.subject || 'Tax Compliance Query',
      question: query.question || '',
      statutoryBasis: query.statutoryBasis || 'Tax Administration Act Section 42(1)',
      dueDate: query.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      attachedEvidenceIds: query.attachedEvidenceIds || []
    };
    current.queries.push(newQ);
    saveLocalCaseData(caseId, current);
    return newQ;
  },

  async updateQuery(caseId: string, queryId: string, updates: Partial<TaxQuery>): Promise<TaxQuery> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/queries/${queryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const idx = current.queries.findIndex((q) => q.id === queryId);
    if (idx !== -1) {
      current.queries[idx] = { ...current.queries[idx], ...updates };
      saveLocalCaseData(caseId, current);
      return current.queries[idx];
    }
    throw new Error('Query not found');
  },

  // Findings
  async createFinding(caseId: string, finding: Partial<AuditFinding>): Promise<AuditFinding> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finding)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const under = Number(finding.underDeclaredAmount) || 0;
    const penRate = Number(finding.penaltyRate) || 20;
    const penAmt = Math.round(under * (penRate / 100));
    const intAmt = Math.round(under * 0.05);
    const totalImpact = under + penAmt + intAmt;

    const newF: AuditFinding = {
      id: `FND-${Date.now()}`,
      caseId,
      reference: finding.reference || `FND-2026-${String(current.findings.length + 1).padStart(2, '0')}`,
      auditArea: finding.auditArea || 'Corporate Income Tax',
      title: finding.title || 'Tax Finding',
      description: finding.description || '',
      criteria: finding.criteria || '',
      condition: finding.condition || '',
      cause: finding.cause || '',
      effect: finding.effect || '',
      underDeclaredAmount: under,
      penaltyRate: penRate,
      penaltyAmount: penAmt,
      interestAmount: intAmt,
      totalTaxImpact: totalImpact,
      auditorAnalysis: finding.auditorAnalysis || '',
      conclusion: finding.conclusion || '',
      recommendation: finding.recommendation || '',
      status: finding.status || 'DRAFT',
      isSignificant: Boolean(finding.isSignificant || under > 50000),
      relatedProcedureId: finding.relatedProcedureId || '',
      relatedEvidenceIds: finding.relatedEvidenceIds || [],
      relatedQueryId: finding.relatedQueryId || '',
      relatedWorkingPaperId: finding.relatedWorkingPaperId || ''
    };
    current.findings.push(newF);
    saveLocalCaseData(caseId, current);
    return newF;
  },

  async updateFinding(caseId: string, findingId: string, updates: Partial<AuditFinding>): Promise<AuditFinding> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/findings/${findingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const idx = current.findings.findIndex((f) => f.id === findingId);
    if (idx !== -1) {
      const prev = current.findings[idx];
      const merged = { ...prev, ...updates };
      if (updates.underDeclaredAmount !== undefined) {
        const under = Number(updates.underDeclaredAmount);
        const penRate = Number(updates.penaltyRate || prev.penaltyRate || 20);
        merged.penaltyAmount = Math.round(under * (penRate / 100));
        merged.interestAmount = Math.round(under * 0.05);
        merged.totalTaxImpact = under + merged.penaltyAmount + merged.interestAmount;
      }
      current.findings[idx] = merged;
      saveLocalCaseData(caseId, current);
      return merged;
    }
    throw new Error('Finding not found');
  },

  async deleteFinding(caseId: string, findingId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/findings/${findingId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    current.findings = current.findings.filter((f) => f.id !== findingId);
    saveLocalCaseData(caseId, current);
    return true;
  },

  // Working Papers
  async createWorkingPaper(caseId: string, wp: Partial<WorkingPaper>): Promise<WorkingPaper> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/working-papers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wp)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const newW: WorkingPaper = {
      id: `WP-${Date.now()}`,
      caseId,
      reference: wp.reference || `WP-${String(current.workingPapers.length + 1).padStart(2, '0')}`,
      title: wp.title || 'Audit Working Paper',
      category: wp.category || 'General Testing',
      preparedBy: wp.preparedBy || 'Jane Doe',
      date: wp.date || new Date().toISOString().split('T')[0],
      workPerformed: wp.workPerformed || '',
      conclusions: wp.conclusions || '',
      status: wp.status || 'DRAFT',
      evidenceIds: wp.evidenceIds || [],
      relatedProcedureId: wp.relatedProcedureId || '',
      relatedFindingId: wp.relatedFindingId || ''
    };
    current.workingPapers.push(newW);
    saveLocalCaseData(caseId, current);
    return newW;
  },

  async updateWorkingPaper(caseId: string, wpId: string, updates: Partial<WorkingPaper>): Promise<WorkingPaper> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/working-papers/${wpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    const idx = current.workingPapers.findIndex((w) => w.id === wpId);
    if (idx !== -1) {
      current.workingPapers[idx] = { ...current.workingPapers[idx], ...updates };
      saveLocalCaseData(caseId, current);
      return current.workingPapers[idx];
    }
    throw new Error('Working paper not found');
  },

  // Analysis
  async updateAnalysis(caseId: string, updates: Partial<TaxAnalysis>): Promise<TaxAnalysis> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/analysis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    current.analysis = { ...current.analysis, ...updates };
    saveLocalCaseData(caseId, current);
    return current.analysis;
  },

  // Report
  async updateReport(caseId: string, report: Partial<DraftReport>): Promise<DraftReport> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/report`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    current.draftReport = { ...current.draftReport, ...report, lastUpdated: new Date().toISOString() };
    saveLocalCaseData(caseId, current);
    return current.draftReport;
  },

  // Workflow actions: Submit, Approve, Return for Correction, Escalate, Fraud Referral, Issue Notice, Director decisions
  async executeWorkflow(
    caseId: string,
    payload: {
      action:
        | 'SUBMIT_FOR_REVIEW'
        | 'APPROVE_AUDIT'
        | 'RETURN_FOR_CORRECTION'
        | 'RECOMMEND_FOR_DIRECTOR_APPROVAL'
        | 'DIRECTOR_APPROVE'
        | 'DIRECTOR_RETURN'
        | 'AUTHORIZE_FRAUD_PROSECUTION'
        | 'TRIGGER_FRAUD_INVESTIGATION'
        | 'INVESTIGATOR_UPDATE_DOSSIER'
        | 'ISSUE_ASSESSMENT_NOTICE'
        | 'ESCALATE_COMPREHENSIVE';
      comment?: string;
      user?: string;
      escalationDetails?: {
        reason: string;
        extendedScope: string;
        estimatedTaxExposure: number;
      };
    }
  ): Promise<{ success: boolean; status: AuditStatus; auditCase: AuditCase }> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/workflow`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Workflow action failed with status ${res.status}`);
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      // Fallback only if offline/network error
    }

    const current = getLocalCaseData(caseId);
    if (payload.action === 'SUBMIT_FOR_REVIEW') {
      current.auditCase.status = 'SUBMITTED';
    } else if (payload.action === 'APPROVE_AUDIT' || payload.action === 'DIRECTOR_APPROVE') {
      current.auditCase.status = 'APPROVED';
      if (payload.action === 'DIRECTOR_APPROVE') {
        current.auditCase.directorComment = payload.comment || 'Director approved.';
        current.auditCase.directorDecisionDate = new Date().toISOString();
      } else {
        current.auditCase.teamLeaderComment = payload.comment || 'Audit approved.';
        current.auditCase.teamLeaderDecisionDate = new Date().toISOString();
      }
    } else if (payload.action === 'RETURN_FOR_CORRECTION' || payload.action === 'DIRECTOR_RETURN') {
      current.auditCase.status = 'RETURNED_FOR_CORRECTION';
      if (payload.action === 'DIRECTOR_RETURN') {
        current.auditCase.directorComment = payload.comment || 'Returned by Director.';
        current.auditCase.directorDecisionDate = new Date().toISOString();
      } else {
        current.auditCase.teamLeaderComment = payload.comment || 'Returned for correction.';
        current.auditCase.teamLeaderDecisionDate = new Date().toISOString();
      }
    } else if (payload.action === 'RECOMMEND_FOR_DIRECTOR_APPROVAL') {
      current.auditCase.status = 'PENDING_DIRECTOR_APPROVAL';
      current.auditCase.teamLeaderRecommendation = payload.comment || 'Recommended for Director approval.';
      current.auditCase.teamLeaderDecisionDate = new Date().toISOString();
    } else if (payload.action === 'AUTHORIZE_FRAUD_PROSECUTION') {
      current.auditCase.status = 'REFERRED_TO_FRAUD_INVESTIGATION';
      current.auditCase.directorComment = payload.comment || 'Criminal prosecution docket authorized.';
      current.auditCase.directorDecisionDate = new Date().toISOString();
    } else if (payload.action === 'INVESTIGATOR_UPDATE_DOSSIER') {
      current.auditCase.fraudDossierNotes = payload.comment;
    } else if (payload.action === 'ESCALATE_COMPREHENSIVE') {
      current.auditCase.status = 'ESCALATED_COMPREHENSIVE';
      current.auditCase.auditType = 'COMPREHENSIVE_AUDIT';
      current.auditCase.escalationDetails = {
        escalatedAt: new Date().toISOString(),
        escalatedBy: payload.user || 'Auditor',
        reason: payload.escalationDetails?.reason || 'Material discrepancies',
        extendedScope: payload.escalationDetails?.extendedScope || 'Full on-site audit',
        estimatedTaxExposure: payload.escalationDetails?.estimatedTaxExposure || 250000
      };
    } else if (payload.action === 'TRIGGER_FRAUD_INVESTIGATION') {
      current.auditCase.status = 'REFERRED_TO_FRAUD_INVESTIGATION';
      if (current.assessmentNotice) {
        current.assessmentNotice.fraudReferralTriggered = true;
        current.assessmentNotice.fraudReferralReason = payload.comment;
      }
    } else if (payload.action === 'ISSUE_ASSESSMENT_NOTICE') {
      current.auditCase.status = 'ASSESSMENT_ISSUED';
      if (current.assessmentNotice) {
        current.assessmentNotice.issueDate = new Date().toISOString().split('T')[0];
        current.assessmentNotice.statutoryDue30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      }
    }
    saveLocalCaseData(caseId, current);
    return { success: true, status: current.auditCase.status, auditCase: current.auditCase };
  },

  // Audit trail
  async getAuditTrail(caseId: string): Promise<AuditTrailEntry[]> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/audit-trail`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return getLocalCaseData(caseId).auditTrail;
  },

  async logAuditAction(caseId: string, user: string, action: string, details: string): Promise<void> {
    try {
      await fetch(`/api/v1/backoffice/ca/cases/${caseId}/audit-trail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, action, details })
      });
    } catch {
      // Fallback
    }
    const current = getLocalCaseData(caseId);
    current.auditTrail.unshift({
      id: `TRL-${Date.now()}`,
      caseId,
      user,
      action,
      timestamp: new Date().toISOString(),
      details
    });
    saveLocalCaseData(caseId, current);
  },

  // Comprehensive Tax Audit Specific Endpoints
  async getEntryConference(caseId: string): Promise<EntryConference | null> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/entry-conference`);
      if (res.ok) return await res.json();
    } catch {}
    return getLocalCaseData(caseId).entryConference || null;
  },

  async updateEntryConference(caseId: string, updates: Partial<EntryConference>): Promise<EntryConference> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/entry-conference`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    const current = getLocalCaseData(caseId);
    current.entryConference = { ...(current.entryConference as any), ...updates };
    saveLocalCaseData(caseId, current);
    return current.entryConference!;
  },

  async getCAATAudit(caseId: string): Promise<CAATAuditData | null> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/caat`);
      if (res.ok) return await res.json();
    } catch {}
    return getLocalCaseData(caseId).caatAudit || null;
  },

  async updateCAATAudit(caseId: string, updates: Partial<CAATAuditData>): Promise<CAATAuditData> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/caat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    const current = getLocalCaseData(caseId);
    current.caatAudit = { ...(current.caatAudit as any), ...updates };
    saveLocalCaseData(caseId, current);
    return current.caatAudit!;
  },

  async getReconciliations(caseId: string): Promise<ComprehensiveReconciliation | null> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/reconciliations`);
      if (res.ok) return await res.json();
    } catch {}
    return getLocalCaseData(caseId).reconciliations || null;
  },

  async updateReconciliations(caseId: string, updates: Partial<ComprehensiveReconciliation>): Promise<ComprehensiveReconciliation> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/reconciliations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    const current = getLocalCaseData(caseId);
    current.reconciliations = { ...(current.reconciliations as any), ...updates };
    saveLocalCaseData(caseId, current);
    return current.reconciliations!;
  },

  async getExitConference(caseId: string): Promise<ExitConference | null> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/exit-conference`);
      if (res.ok) return await res.json();
    } catch {}
    return getLocalCaseData(caseId).exitConference || null;
  },

  async updateExitConference(caseId: string, updates: Partial<ExitConference>): Promise<ExitConference> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/exit-conference`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    const current = getLocalCaseData(caseId);
    current.exitConference = { ...(current.exitConference as any), ...updates };
    saveLocalCaseData(caseId, current);
    return current.exitConference!;
  },

  async getAssessmentNotice(caseId: string): Promise<AssessmentNotice | null> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/assessment-notice`);
      if (res.ok) return await res.json();
    } catch {}
    return getLocalCaseData(caseId).assessmentNotice || null;
  },

  async updateAssessmentNotice(caseId: string, updates: Partial<AssessmentNotice>): Promise<AssessmentNotice> {
    try {
      const res = await fetch(`/api/v1/backoffice/ca/cases/${caseId}/assessment-notice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}
    const current = getLocalCaseData(caseId);
    current.assessmentNotice = { ...(current.assessmentNotice as any), ...updates };
    saveLocalCaseData(caseId, current);
    return current.assessmentNotice!;
  }
};
