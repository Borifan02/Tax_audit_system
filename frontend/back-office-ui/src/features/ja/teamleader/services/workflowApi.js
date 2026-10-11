/**
 * Audit Workflow API Service
 * Handles all 11 steps of the audit execution workflow
 */

const API_BASE = '/api/v1/backoffice/ap/cases';
const COMMITTEE_API_BASE = '/api/v1/backoffice/ap/committee';

const ID_MAP = {
  'u-tl-aa1a': '10000000-0000-0000-0001-000000000001',
  'u-tl-aa2a': '10000000-0000-0000-0002-000000000001',
  'u-tl-aa3a': '10000000-0000-0000-0003-000000000001',
  'u-tl-or1a': '10000000-0000-0000-0004-000000000001',
  'u-aud-aa1a': 'a0000001-0000-0000-0000-000000000001',
  'u-aud-db02': 'a0000001-0000-0000-0000-000000000002',
  'u-aud-db03': 'a0000001-0000-0000-0000-000000000003',
  'u-aud-db04': 'a0000001-0000-0000-0000-000000000004',
  'u-aud-db05': 'a0000001-0000-0000-0000-000000000005',
  'u-aud-db06': 'a0000001-0000-0000-0000-000000000006',
  'fed.ja.chair': '20000000-0000-0000-0099-000000000001',
  'fed.ja.member': '20000000-0000-0000-0099-000000000002',
  'fed.ja.tl': '10000000-0000-0000-0099-000000000001',
  'u-tl-federal-lto1-ja-1': '10000000-0000-0000-0099-000000000001',
  'u-tl-federal-lto1-joint-1': '10000000-0000-0000-0099-000000000001',
  'teamleader-federal-lto1-ja-1': '10000000-0000-0000-0099-000000000001',
  'fed.ja.auditor1': 'a0000001-0000-0000-0099-000000000001',
  'fed.ja.auditor2': 'a0000001-0000-0000-0099-000000000002',
  'fed.ja.auditor3': 'a0000001-0000-0000-0099-000000000003',
  'fed.ja.auditor4': 'a0000001-0000-0000-0099-000000000004',
  'fed.ja.auditor5': 'a0000001-0000-0000-0099-000000000005',
  'fed2.ja.chair': '20000000-0000-0000-0098-000000000001',
  'fed2.ja.member': '20000000-0000-0000-0098-000000000002',
  'fed2.ja.tl': '10000000-0000-0000-0098-000000000001',
  'u-tl-federal-lto2-ja-1': '10000000-0000-0000-0098-000000000001',
  'u-tl-federal-lto2-joint-1': '10000000-0000-0000-0098-000000000001',
  'teamleader-federal-lto2-ja-1': '10000000-0000-0000-0098-000000000001',
  'fed2.ja.auditor1': 'a0000001-0000-0000-0098-000000000001',
  'fed2.ja.auditor2': 'a0000001-0000-0000-0098-000000000002',
  'fed2.ja.auditor3': 'a0000001-0000-0000-0098-000000000003',
  'fed2.ja.auditor4': 'a0000001-0000-0000-0098-000000000004',
  'fed2.ja.auditor5': 'a0000001-0000-0000-0098-000000000005',
};

function resolveActorId(id) {
  if (!id) return id;
  if (ID_MAP[id]) return ID_MAP[id];
  try {
    const session = JSON.parse(localStorage.getItem('mor_aps_session') || '{}');
    if (id === session?.id || id === session?.username || id === session?.legacyUsername) {
      return ID_MAP[session?.legacyUsername] || session?.userId || id;
    }
  } catch {}
  return id;
}

function getHeaders() {
  const token = localStorage.getItem('authToken');
  const session = JSON.parse(localStorage.getItem('mor_aps_session') || '{}');
  const userId = session?.id || '';
  const actorId = resolveActorId(userId) || session?.userId || userId;
  return {
    'Content-Type': 'application/json',
    'X-Actor-Id': actorId,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// Helper for file uploads
function getFileHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export const workflowAPI = {

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: CASE HANDOFF
  // ═══════════════════════════════════════════════════════════════════════════

  /** Import a case from Committee into Execution Workspace */
  importCaseFromCommittee: async (caseId, teamLeaderId) => {
    const response = await fetch(`${API_BASE}/${caseId}/import-from-committee`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ teamLeaderId: ID_MAP[teamLeaderId] || teamLeaderId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to import case');
    }
    return response.json();
  },

  handoffCase: async (caseId, teamLeaderId, comment) => {
    const resolvedTlId = ID_MAP[teamLeaderId] || teamLeaderId;
    const headers = getHeaders();
    if (resolvedTlId) {
      headers['X-Actor-Id'] = resolvedTlId;
    }
    const response = await fetch(`${API_BASE}/${caseId}/handoff`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        comment: comment || 'Accepted by Team Leader after reviewing the case referral',
        teamLeaderId: resolvedTlId,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error?.message || 'Failed to hand off case');
    }
    return response.json();
  },

  /** Decline a handoff */
  declineHandoff: async (caseId, reason) => {
    const response = await fetch(`${API_BASE}/${caseId}/decline-handoff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to decline handoff');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Assign case to auditor with deadline and instructions */
  assignToAuditor: async (caseId, auditorId, dueDate, instructions) => {
    const response = await fetch(`${API_BASE}/${caseId}/assign-auditor`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ auditorId: ID_MAP[auditorId] || auditorId, dueDate, instructions }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign case');
    }
    return response.json();
  },

  /** Auditor accepts or declines assignment */
  respondToAssignment: async (caseId, accepted, reason) => {
    const response = await fetch(`${API_BASE}/${caseId}/respond-assignment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ accepted, reason }),
    });
    if (!response.ok) throw new Error('Failed to respond to assignment');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: PLANNING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Submit audit plan */
  submitPlan: async (caseId, plan) => {
    const response = await fetch(`${API_BASE}/${caseId}/plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error('Failed to submit plan');
    return response.json();
  },

  /** Get latest audit plan for a case */
  getPlan: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/plan`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch plan');
    return response.json();
  },

  /** Approve plan (Team Leader) */
  approvePlan: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/plan/approve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to approve plan');
    return response.json();
  },

  /** Send plan back for revision (Team Leader) */
  revisePlan: async (caseId, revisionNotes) => {
    const response = await fetch(`${API_BASE}/${caseId}/plan/revise`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ revisionNotes }),
    });
    if (!response.ok) throw new Error('Failed to revise plan');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: ENTRY CONFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Schedule entry conference */
  scheduleConference: async (caseId, conference) => {
    const response = await fetch(`${API_BASE}/${caseId}/conference`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(conference),
    });
    if (!response.ok) throw new Error('Failed to schedule conference');
    return response.json();
  },

  /** Record conference minutes */
  recordConferenceMinutes: async (caseId, minutes) => {
    const response = await fetch(`${API_BASE}/${caseId}/conference/minutes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(minutes),
    });
    if (!response.ok) throw new Error('Failed to record minutes');
    return response.json();
  },

  /** Approve conference record (Team Leader) */
  approveConference: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/conference/approve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to approve conference');
    return response.json();
  },

  /** Skip/waive entry conference — marks step complete without holding a meeting */
  skipConference: async (caseId, reason) => {
    const response = await fetch(`${API_BASE}/${caseId}/conference/skip`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to skip conference');
    return response.json();
  },

  /**
   * Send meeting invitation/notification to taxpayer.
   * This is informational — the conference schedule is already saved.
   * channels: ['PORTAL', 'EMAIL', 'SMS', 'LETTER']
   */
  sendConferenceNotification: async (caseId, { channels, conferenceId, message }) => {
    const response = await fetch(`${API_BASE}/${caseId}/conference/notify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ channels, conferenceId, message }),
    });
    // Non-fatal — notification is optional; swallow errors gracefully
    if (!response.ok) console.warn('[Conference] Notification send failed (non-fatal)');
    return response.ok ? response.json() : { status: 'NOTIFICATION_FAILED' };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: INFORMATION REQUEST
  // ═══════════════════════════════════════════════════════════════════════════

  /** Create document request */
  createDocumentRequest: async (caseId, request) => {
    const response = await fetch(`${API_BASE}/${caseId}/doc-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create document request');
    return response.json();
  },

  /** Send query sheet to taxpayer */
  sendQuerySheet: async (caseId, querySheet) => {
    const response = await fetch(`${API_BASE}/${caseId}/query-sheets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(querySheet),
    });
    if (!response.ok) throw new Error('Failed to send query sheet');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: DOCUMENT COLLECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Upload document (taxpayer portal) */
  uploadDocument: async (caseId, requestId, file, metadata) => {
    const response = await fetch(`${API_BASE}/${caseId}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...(metadata || {}),
        requestId: requestId || metadata?.requestId || null,
        fileName: metadata?.fileName || file?.name || 'document',
        contentType: metadata?.contentType || file?.type || 'application/octet-stream',
        fileSize: metadata?.fileSize || file?.size || 0,
        fileUrl: metadata?.fileUrl || '',
      }),
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return response.json();
  },

  /** Verify document (auditor) */
  verifyDocument: async (caseId, documentId) => {
    const response = await fetch(`${API_BASE}/${caseId}/documents/${documentId}/verify`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to verify document');
    return response.json();
  },

  /** Reject document (auditor) with reason */
  rejectDocument: async (caseId, documentId, reason) => {
    const response = await fetch(`${API_BASE}/${caseId}/documents/${documentId}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject document');
    return response.json();
  },

  /** Send follow-up reminder */
  sendFollowUp: async (caseId, requestId, message) => {
    const response = await fetch(`${API_BASE}/${caseId}/doc-requests/${requestId}/followup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to send follow-up');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: CAAT ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Run CAAT analysis */
  runCAATAnalysis: async (caseId, analysisTypes) => {
    const response = await fetch(`${API_BASE}/${caseId}/caat/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ analysisTypes }),
    });
    if (!response.ok) throw new Error('Failed to run CAAT analysis');
    return response.json();
  },

  /** Validate anomaly (accept/amend/reject) */
  validateAnomaly: async (caseId, anomalyId, decision, notes, amendedAmount = null) => {
    const response = await fetch(`${API_BASE}/${caseId}/caat/anomalies/${anomalyId}/validate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, notes, reason: notes, amendedAmount }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to validate anomaly');
    }
    return response.json();
  },

  /** Promote validated CAAT anomalies (ACCEPTED/AMENDED) to draft Findings */
  promoteCaatToFindings: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/caat/promote-to-findings`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to promote CAAT anomalies to findings');
    }
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: AUDIT TESTING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Add working paper / test result */
  addWorkingPaper: async (caseId, paper) => {
    const response = await fetch(`${API_BASE}/${caseId}/working-papers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paper),
    });
    if (!response.ok) throw new Error('Failed to add working paper');
    return response.json();
  },

  /** Upload evidence file */
  uploadEvidence: async (caseId, paperId, file) => {
    const response = await fetch(`${API_BASE}/${caseId}/working-papers/${paperId}/evidence`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fileName: file?.name || 'evidence',
        fileUrl: typeof file === 'string' ? file : '',
      }),
    });
    if (!response.ok) throw new Error('Failed to upload evidence');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 9: FINDINGS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Create a finding */
  createFinding: async (caseId, finding) => {
    const response = await fetch(`${API_BASE}/${caseId}/findings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(finding),
    });
    if (!response.ok) throw new Error('Failed to create finding');
    return response.json();
  },

  /** Submit findings for TL approval */
  submitFindings: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/findings/submit`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to submit findings');
    return response.json();
  },

  /** Approve finding (Team Leader) */
  approveFinding: async (caseId, findingId) => {
    const response = await fetch(`${API_BASE}/${caseId}/findings/${findingId}/approve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to approve finding');
    return response.json();
  },

  /** Reject/revise finding (Team Leader) */
  reviseFinding: async (caseId, findingId, revisionNotes) => {
    const response = await fetch(`${API_BASE}/${caseId}/findings/${findingId}/revise`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ revisionNotes }),
    });
    if (!response.ok) throw new Error('Failed to revise finding');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 10: TAXPAYER RESPONSE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Taxpayer responds to a finding */
  respondToFinding: async (caseId, findingId, response_type, explanation, evidence) => {
    const resp = await fetch(`${API_BASE}/${caseId}/findings/${findingId}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ responseType: response_type, explanation, evidence }),
    });
    if (!resp.ok) throw new Error('Failed to submit response');
    return resp.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 11: CONCLUSION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Create conclusion for a finding */
  createConclusion: async (caseId, findingId, conclusion) => {
    const response = await fetch(`${API_BASE}/${caseId}/findings/${findingId}/conclude`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(conclusion),
    });
    if (!response.ok) throw new Error('Failed to create conclusion');
    return response.json();
  },

  /** Finalize case (all findings concluded) */
  finalizeCase: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/finalize`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to finalize case');
    return response.json();
  },

  /** Sign consolidated report (Team Leader) */
  signReport: async (caseId, signature) => {
    const response = await fetch(`${API_BASE}/${caseId}/sign-report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ digitalSignature: signature }),
    });
    if (!response.ok) throw new Error('Failed to sign report');
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAL QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get full case workflow state */
  getCaseWorkflow: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/workflow`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch workflow state');
    return response.json();
  },

  /** Get all documents for a case */
  getDocuments: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/documents`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  /** Get all findings for a case */
  getFindings: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/findings`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch findings');
    return response.json();
  },

  /** Get CAAT analysis results */
  getCAATResults: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/caat/results`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch CAAT results');
    return response.json();
  },

  /** Get working papers */
  getWorkingPapers: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/working-papers`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch working papers');
    return response.json();
  },

  /** Get all document requests */
  getDocumentRequests: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/doc-requests`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch document requests');
    return response.json();
  },

  /** Get conference details */
  getConference: async (caseId) => {
    const response = await fetch(`${API_BASE}/${caseId}/conference`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch conference');
    return response.json();
  },
};
