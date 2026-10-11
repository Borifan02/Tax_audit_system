/**
 * Auditor API Service
 * Handles all API calls for the auditor workspace including
 * dashboard metrics, case management, and workflow operations
 */

const API_BASE = '/api/v1/backoffice/ap';
const CASE_API_BASE = `${API_BASE}/cases`;
const AUDITOR_API_BASE = `${API_BASE}/auditor`;

// Map frontend auditor IDs to backend UUIDs
const AUDITOR_ID_MAP = {
  'u-aud-aa1a': 'a0000001-0000-0000-0000-000000000001',
  'u-aud-db02': 'a0000001-0000-0000-0000-000000000002',
  'u-aud-db03': 'a0000001-0000-0000-0000-000000000003',
  'u-aud-db04': 'a0000001-0000-0000-0000-000000000004',
  'u-aud-db05': 'a0000001-0000-0000-0000-000000000005',
  'u-aud-db06': 'a0000001-0000-0000-0000-000000000006',
};

function resolveAuditorId(frontendId) {
  return AUDITOR_ID_MAP[frontendId] || frontendId;
}

function getHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

function getFileHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

export const auditorAPI = {

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  getDashboard: async (auditorId) => {
    const resolvedId = resolveAuditorId(auditorId);
    try {
      const response = await fetch(`${AUDITOR_API_BASE}/dashboard?auditorId=${resolvedId}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Ignore network error
    }
    // Fallback to mock dashboard data
    return {
      activeCases: 1,
      completedCases: 0,
      upcomingDeadlines: 1,
      pendingReviews: 0,
      efficiencyScore: 85,
      averageCompletionDays: 14
    };
  },

  /**
   * Get auditor workload summary
   */
  getWorkload: async (auditorId) => {
    const resolvedId = resolveAuditorId(auditorId);
    const response = await fetch(`${AUDITOR_API_BASE}/workload?auditorId=${resolvedId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch workload');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all cases assigned to this auditor from the backend
   */
  getMyCases: async (auditorId, filters = {}) => {
    const resolvedId = resolveAuditorId(auditorId);
    const params = new URLSearchParams({ assignedAuditor: resolvedId });
    if (filters.status) params.append('status', filters.status);

    let cases = [];
    try {
      const response = await fetch(`${CASE_API_BASE}?${params}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        cases = await response.json();
      }
    } catch (e) {
      // Ignore network error
    }

    // Fallback to mock data if empty
    if (!cases || cases.length === 0) {
      cases = [
        {
          id: 'DA-2026-001',
          caseId: 'DA-2026-001',
          caseNumber: 'DA-2026-001',
          taxpayerName: 'Acme Corp',
          taxpayerId: 'TIN-123456789',
          tin: 'TIN-123456789',
          auditType: 'DESK_AUDIT',
          riskLevel: 'HIGH',
          status: 'AUDITOR_ASSIGNED',
          assignedAuditor: auditorId
        }
      ];
    }
    return cases;
  },

  /**
   * Get case detail from the backend
   */
  getCaseDetail: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch case detail');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get workflow state for a case
   */
  getWorkflow: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/workflow`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch workflow');
    return response.json();
  },

  /**
   * Submit audit plan
   */
  submitPlan: async (caseId, plan) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error('Failed to submit plan');
    return response.json();
  },

  /**
   * Record conference minutes
   */
  recordConferenceMinutes: async (caseId, minutes) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/conference/minutes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(minutes),
    });
    if (!response.ok) throw new Error('Failed to record minutes');
    return response.json();
  },

  /**
   * Create document request
   */
  createDocumentRequest: async (caseId, request) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/doc-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create document request');
    return response.json();
  },

  /**
   * Run CAAT analysis
   */
  runCAATAnalysis: async (caseId, analysisTypes) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/caat/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ analysisTypes }),
    });
    if (!response.ok) throw new Error('Failed to run CAAT analysis');
    return response.json();
  },

  /**
   * Validate anomaly
   */
  validateAnomaly: async (caseId, anomalyId, decision, notes) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/caat/anomalies/${anomalyId}/validate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, notes }),
    });
    if (!response.ok) throw new Error('Failed to validate anomaly');
    return response.json();
  },

  /**
   * Add working paper
   */
  addWorkingPaper: async (caseId, paper) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/working-papers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paper),
    });
    if (!response.ok) throw new Error('Failed to add working paper');
    return response.json();
  },

  /**
   * Create finding
   */
  createFinding: async (caseId, finding) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/findings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(finding),
    });
    if (!response.ok) throw new Error('Failed to create finding');
    return response.json();
  },

  /**
   * Submit findings
   */
  submitFindings: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/findings/submit`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to submit findings');
    return response.json();
  },

  /**
   * Respond to finding (taxpayer response)
   */
  respondToFinding: async (caseId, findingId, responseType, explanation, evidence) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/findings/${findingId}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ responseType, explanation, evidence }),
    });
    if (!response.ok) throw new Error('Failed to respond to finding');
    return response.json();
  },

  /**
   * Create conclusion for a finding
   */
  createConclusion: async (caseId, findingId, conclusion) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/findings/${findingId}/conclude`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(conclusion),
    });
    if (!response.ok) throw new Error('Failed to create conclusion');
    return response.json();
  },

  /**
   * Finalize case
   */
  finalizeCase: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/finalize`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to finalize case');
    return response.json();
  },

  /**
   * Get documents for a case
   */
  getDocuments: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/documents`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  /**
   * Get findings for a case
   */
  getFindings: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/findings`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch findings');
    return response.json();
  },

  /**
   * Get CAAT results for a case
   */
  getCAATResults: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/caat/results`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch CAAT results');
    return response.json();
  },

  /**
   * Get working papers for a case
   */
  getWorkingPapers: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/working-papers`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch working papers');
    return response.json();
  },

  /**
   * Get document requests for a case
   */
  getDocumentRequests: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/doc-requests`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch document requests');
    return response.json();
  },

  /**
   * Get conference details
   */
  getConference: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/conference`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch conference');
    return response.json();
  },
};
