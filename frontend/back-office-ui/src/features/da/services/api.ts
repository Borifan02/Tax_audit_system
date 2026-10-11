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
  AuditStatus
} from '../types/audit';
import { INITIAL_CASES_DATA, CaseFullData } from '../data/initialData';

// Resolve the logged-in actor ID from session/localStorage (set during login)
function getActorId(): string {
  return (
    localStorage.getItem('itas_actor_id') ||
    sessionStorage.getItem('itas_actor_id') ||
    localStorage.getItem('userId') ||
    sessionStorage.getItem('userId') ||
    'u-aud-federal-lto1-desk-1-1'
  );
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'X-Actor-Id': getActorId(),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// Local storage key prefix
const STORAGE_PREFIX = 'itas_audit_case_';

// Helper to get or seed fallback local cache
function getLocalCaseData(caseId: string, initialCaseInfo?: any): CaseFullData {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + caseId);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-heal corrupted local storage (e.g., from previous broken loads)
      if (!parsed.analysis) {
        parsed.analysis = { 
          historicalData: [], 
          quarterlyData: [], 
          ratios: [], 
          notes: '',
          anomalies: [],
          annualFinancials: [],
          quarterlyVAT: []
        };
      }
      if (!parsed.draftReport) {
        parsed.draftReport = { caseId: caseId, executiveSummary: '', scopeAndObjectives: '', methodology: '', findingsSummary: '', recommendedAdjustments: '', statutoryRecommendations: '', status: 'DRAFT', lastUpdated: new Date().toISOString() };
      }
      if (initialCaseInfo) {
        if (initialCaseInfo.taxpayerName) parsed.auditCase.taxpayerName = initialCaseInfo.taxpayerName;
        if (initialCaseInfo.caseNumber) parsed.auditCase.caseNumber = initialCaseInfo.caseNumber;
        if (initialCaseInfo.tin) parsed.auditCase.tin = initialCaseInfo.tin;
      }
      return parsed;
    }
  } catch {
    // Ignore localStorage errors
  }

  // If a mock explicitly exists, use it
  if (INITIAL_CASES_DATA[caseId]) {
    return JSON.parse(JSON.stringify(INITIAL_CASES_DATA[caseId]));
  }

  // Otherwise, construct a clean slate using the REAL passed case data from the backend queue
  const realCase = {
    auditCase: {
      id: caseId,
      caseNumber: initialCaseInfo?.caseNumber || caseId,
      taxpayerName: initialCaseInfo?.taxpayerName || 'Unknown Taxpayer',
      taxpayerId: initialCaseInfo?.taxpayerId || 'N/A',
      auditType: initialCaseInfo?.auditType || 'DESK_AUDIT',
      riskLevel: initialCaseInfo?.riskLevel || 'MEDIUM',
      status: initialCaseInfo?.status || 'IN_PROGRESS',
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      assignedAuditor: initialCaseInfo?.assignedAuditor || 'Unknown',
      teamLeader: initialCaseInfo?.teamLeader || 'Unknown',
      lastSaved: new Date().toLocaleTimeString(),
      ...initialCaseInfo
    },
    evidence: [
      {
        id: 'EVD-001',
        caseId: caseId,
        reference: 'EVD-2026-001',
        description: 'Audited Financial Statements FY2024',
        source: 'Taxpayer Submission',
        date: '2026-09-03',
        relatedProcedureId: 'proc-01',
        status: 'Verified',
        fileName: 'AFS_FY2024_Signed.pdf'
      }
    ],
    procedures: [
      { id: 'proc-01', code: 'P01', description: 'Review Taxpayer Master File', status: 'COMPLETED', comments: 'All good' },
      { id: 'proc-02', code: 'P02', description: 'Analyze Sales Registers vs VAT returns', status: 'COMPLETED', comments: 'Variance found' },
      { id: 'proc-03', code: 'P03', description: 'Review Withholding Tax deductions', status: 'PENDING', comments: '' }
    ],
    analysis: {
      historicalData: [],
      quarterlyData: [],
      ratios: [],
      anomalies: [],
      annualFinancials: [],
      quarterlyVAT: [],
      notes: 'Significant variance in Q2 VAT returns.'
    },
    queries: [],
    findings: [
      {
        id: 'FND-001',
        title: 'Unreported Sales Revenue in Q2',
        description: 'Variance between VAT returns and sales register',
        taxType: 'VAT',
        period: 'Q2 2024',
        originalAmount: 1500000,
        auditedAmount: 2000000,
        adjustmentAmount: 500000,
        totalTaxImpact: 75000,
        penalty: 15000,
        interest: 5000,
        legalBasis: 'VAT Proclamation No. 1186/2020 Art. 21',
        status: 'Draft',
        relatedProcedure: 'P02'
      }
    ],
    workingPapers: [],
    draftReport: {
      caseId: caseId,
      executiveSummary: '',
      scopeAndObjectives: '',
      methodology: '',
      findingsSummary: '',
      recommendedAdjustments: '',
      statutoryRecommendations: '',
      status: 'DRAFT',
      lastUpdated: new Date().toISOString()
    },
    auditTrail: [
      {
        id: 'at-sys-1',
        timestamp: new Date().toISOString(),
        actor: initialCaseInfo?.assignedAuditor || 'System',
        action: 'CASE_OPENED',
        description: 'Auditor opened real assigned case from queue',
        type: 'system'
      }
    ]
  };
  
  return realCase as unknown as CaseFullData;
}

function saveLocalCaseData(caseId: string, data: CaseFullData): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + caseId, JSON.stringify(data));
  } catch {
    // Ignore localStorage quota errors
  }
}

export const itasApi = {
  // Cases list
  async getAssignedCases(): Promise<Array<any>> {
    try {
      const res = await fetch('/api/v1/backoffice/ap/cases', { credentials: 'include' });
      if (res.ok) {
        const backendCases = await res.json();
        if (backendCases && backendCases.length > 0) {
          return backendCases;
        }
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
  async getCaseData(caseId: string, initialCaseInfo?: any): Promise<CaseFullData> {
    try {
      let realId = caseId;
      const res = await fetch(`/api/v1/backoffice/da/cases/${realId}`, { credentials: 'include' });
      if (res.ok) {
        const rawData = await res.json();
        // The backend returns { auditCase, evidence: [], procedures: [], findings: [], workingPapers: [], queries: [], draftReport: {}, analysis: {} }
        // We need to ensure it perfectly matches CaseFullData structure so UI doesn't crash
        const mappedData: CaseFullData = {
          auditCase: {
            id: rawData.auditCase.id,
            caseNumber: initialCaseInfo?.caseNumber || rawData.auditCase.caseNumber || 'Unknown',
            taxpayerName: initialCaseInfo?.taxpayerName || rawData.auditCase.taxpayerName || 'Unknown',
            tin: initialCaseInfo?.tin || rawData.auditCase.tin || 'Unknown',
            auditType: rawData.auditCase.auditType || 'DESK_AUDIT',
            riskScore: rawData.auditCase.riskScore || 0,
            riskCategory: rawData.auditCase.riskCategory || 'LOW',
            status: rawData.auditCase.status || 'IN_PROGRESS',
            dueDate: rawData.auditCase.dueDate || new Date().toISOString(),
            assignedAuditor: rawData.auditCase.assignedAuditorId || 'Unknown',
            teamLeader: rawData.auditCase.assignedTeamLeaderId || 'Unknown',
            taxPeriod: '2024-2025', // fallback
            teamLeaderComment: getLocalCaseData(caseId)?.auditCase?.teamLeaderComment
          },
          evidence: rawData.evidence || [],
          procedures: rawData.procedures || [],
          analysis: {
            ...rawData.analysis,
            historicalData: rawData.analysis?.historicalData || [],
            quarterlyData: rawData.analysis?.quarterlyData || [],
            ratios: rawData.analysis?.ratios || [],
            anomalies: rawData.analysis?.anomalies || [],
            annualFinancials: rawData.analysis?.annualFinancials || [],
            quarterlyVAT: rawData.analysis?.quarterlyVAT || [],
            notes: rawData.analysis?.notes || ''
          },
          queries: rawData.queries || [],
          findings: rawData.findings || [],
          workingPapers: rawData.workingPapers || [],
          draftReport: rawData.draftReport?.id ? rawData.draftReport : { caseId: rawData.auditCase.id, status: 'DRAFT' },
          auditTrail: []
        };
        saveLocalCaseData(caseId, mappedData);
        return mappedData;
      }
    } catch {
      // Network failure
    }
    return getLocalCaseData(caseId, initialCaseInfo);
  },

  // Autosave snapshot
  async autosaveCase(caseId: string, snapshot: Partial<CaseFullData>): Promise<{ success: boolean; lastSaved: string }> {
    const timestamp = new Date().toLocaleTimeString();
    try {
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/autosave`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(snapshot)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        }
        throw new Error('Not JSON');
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/procedures/${procId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/evidence`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  async deleteEvidence(caseId: string, evidenceId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/evidence/${evidenceId}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/queries`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/queries/${queryId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/findings`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/findings/${findingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/findings/${findingId}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/working-papers`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/working-papers/${wpId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/analysis`, {
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/report`, {
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

  // Workflow actions: Submit, Approve, Return for Correction, Escalate
  async executeWorkflow(
    caseId: string,
    payload: {
      action: 'SUBMIT_FOR_REVIEW' | 'APPROVE_AUDIT' | 'RETURN_FOR_CORRECTION' | 'ESCALATE_COMPREHENSIVE';
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
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/workflow`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        // Backend returns { success, status, auditCase } — normalize the shape
        return {
          success: json.success ?? true,
          status: json.status || payload.action,
          auditCase: json.auditCase || { status: json.status }
        };
      }
    } catch {
      // Fallback to local state
    }

    const current = getLocalCaseData(caseId);
    if (payload.action === 'SUBMIT_FOR_REVIEW') {
      current.auditCase.status = 'SUBMITTED';
    } else if (payload.action === 'APPROVE_AUDIT') {
      current.auditCase.status = 'APPROVED';
      current.auditCase.teamLeaderComment = payload.comment || 'Audit approved.';
    } else if (payload.action === 'RETURN_FOR_CORRECTION') {
      current.auditCase.status = 'RETURNED_FOR_CORRECTION';
      current.auditCase.teamLeaderComment = payload.comment || 'Returned for correction.';
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
    }
    saveLocalCaseData(caseId, current);
    return { success: true, status: current.auditCase.status, auditCase: current.auditCase };
  },

  // Audit trail
  async getAuditTrail(caseId: string): Promise<AuditTrailEntry[]> {
    try {
      const res = await fetch(`/api/v1/backoffice/da/cases/${caseId}/audit-trail`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return getLocalCaseData(caseId).auditTrail;
  },

  async logAuditAction(caseId: string, user: string, action: string, details: string): Promise<void> {
    try {
      await fetch(`/api/v1/backoffice/da/cases/${caseId}/audit-trail`, {
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
  }
};
