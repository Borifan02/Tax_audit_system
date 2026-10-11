/**
 * Team Leader API Service
 * Handles all backend API calls for the team leader dashboard and cases.
 * 
 * Cases flow:
 * 1. Committee votes → status becomes TEAM_ASSIGNED
 * 2. Team Leader sees incoming cases and assigns to auditors
 * 3. Auditor executes the audit
 */

const COMMITTEE_API_BASE = '/api/v1/backoffice/ap/committee';
const CASE_API_BASE = '/api/v1/backoffice/ap/cases';

// Map frontend user IDs to backend UUIDs
const ID_MAP = {
  'u-tl-aa1a': '10000000-0000-0000-0001-000000000001',
  'u-tl-aa2a': '10000000-0000-0000-0002-000000000001',
  'u-tl-aa3a': '10000000-0000-0000-0003-000000000001',
  'u-tl-or1a': '10000000-0000-0000-0004-000000000001',
  'u-cc-aa1': '10000000-0000-0000-0000-000000000005',
  'u-cc-aa2': '10000000-0000-0000-0000-000000000006',
  'u-cc-aa3': '10000000-0000-0000-0000-000000000008',
  'u-cc-or1': '10000000-0000-0000-0000-000000000016',
  'u-cm-aa1': '20000000-0000-0000-0000-000000000001',
  'u-cm-aa2': '20000000-0000-0000-0000-000000000002',
  'u-cm-aa3': '20000000-0000-0000-0000-000000000003',
  'u-cm-or1': '20000000-0000-0000-0000-000000000004',
  'aa1.chair': '20000000-0000-0001-0000-000000000001',
  'aa1.member': '20000000-0000-0001-0000-000000000002',
  'aa1.tl': '10000000-0000-0000-0001-000000000001',
  'aa1.tl2': '10000000-0000-0000-0001-000000000002',
  'fed.ja.chair': '20000000-0000-0000-0099-000000000001',
  'fed.ja.member': '20000000-0000-0000-0099-000000000002',
  'fed.ja.tl': '10000000-0000-0000-0099-000000000001',
  'fed.ja.tl2': '10000000-0000-0000-0099-000000000002',
  'u-tl-federal-lto1-ja-1': '10000000-0000-0000-0099-000000000001',
  'u-tl-federal-lto1-joint-1': '10000000-0000-0000-0099-000000000001',
  'fed2.ja.chair': '20000000-0000-0000-0098-000000000001',
  'fed2.ja.member': '20000000-0000-0000-0098-000000000002',
  'fed2.ja.tl': '10000000-0000-0000-0098-000000000001',
  'fed2.ja.tl2': '10000000-0000-0000-0098-000000000002',
  'or1.chair': '20000000-0000-0002-0000-000000000001',
  'or1.member': '20000000-0000-0002-0000-000000000002',
  'or1.tl': '10000000-0000-0000-0004-000000000001',
  'u-tl-or1-ja-1': '10000000-0000-0000-0004-000000000001',
  'u-tl-or1-joint-1': '10000000-0000-0000-0004-000000000001',
};

const AUDITOR_ID_MAP = {
  'u-aud-aa1a': 'a0000001-0000-0000-0000-000000000001',
  'u-aud-db02': 'a0000001-0000-0000-0000-000000000002',
  'u-aud-db03': 'a0000001-0000-0000-0000-000000000003',
  'u-aud-db04': 'a0000001-0000-0000-0000-000000000004',
  'u-aud-db05': 'a0000001-0000-0000-0000-000000000005',
  'u-aud-db06': 'a0000001-0000-0000-0000-000000000006',
  'fed.ja.auditor1': 'a0000001-0000-0000-0099-000000000001',
  'fed.ja.auditor2': 'a0000001-0000-0000-0099-000000000002',
  'fed.ja.auditor3': 'a0000001-0000-0000-0099-000000000003',
  'fed.ja.auditor4': 'a0000001-0000-0000-0099-000000000004',
  'fed.ja.auditor5': 'a0000001-0000-0000-0099-000000000005',
  'fed2.ja.auditor1': 'a0000001-0000-0000-0098-000000000001',
  'fed2.ja.auditor2': 'a0000001-0000-0000-0098-000000000002',
  'fed2.ja.auditor3': 'a0000001-0000-0000-0098-000000000003',
  'fed2.ja.auditor4': 'a0000001-0000-0000-0098-000000000004',
  'fed2.ja.auditor5': 'a0000001-0000-0000-0098-000000000005',
};

function resolveId(frontendId) {
  return ID_MAP[frontendId] || frontendId;
}

function resolveUserId(frontendId) {
  return resolveId(frontendId) || AUDITOR_ID_MAP[frontendId] || frontendId;
}

function getHeaders() {
  const token = localStorage.getItem('authToken');
  const session = JSON.parse(localStorage.getItem('mor_aps_session') || '{}');
  const userId = session?.id || '';
  const actorId = resolveId(userId);
  
  return {
    'Content-Type': 'application/json',
    'X-Actor-Id': actorId,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export const teamLeaderAPI = {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  /**
   * Get team leader dashboard metrics
   * Aggregates incoming committee cases + assigned cases
   */
  getDashboard: async (teamLeaderId) => {
    const params = new URLSearchParams({ teamLeaderId: resolveId(teamLeaderId) });
    const response = await fetch(`${COMMITTEE_API_BASE.replace('/committee', '/team-leader')}/dashboard?${params}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch team leader dashboard');
    return response.json();
  },

  // ── Committee Cases (incoming after vote passes) ────────────────

  /**
   * Get committee cases with TEAM_ASSIGNED status (after vote passes)
   * These cases need team assignment before viability assessment
   */
  getTeamAssignedCases: async () => {
    const params = new URLSearchParams({ status: 'TEAM_ASSIGNED' });
    
    const response = await fetch(`${COMMITTEE_API_BASE}/cases?${params}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch team assigned cases');
    return response.json();
  },

  /**
   * Get AP audit cases with PENDING_ASSIGNMENT status (after viability approved)
   * These are ready for team leader to assign to auditors
   */
  getPendingAssignmentCases: async () => {
    const params = new URLSearchParams({ status: 'PENDING_ASSIGNMENT' });
    
    const response = await fetch(`${CASE_API_BASE}?${params}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch pending assignment cases');
    return response.json();
  },

  /**
   * Get detail of a specific committee case
   */
  getCommitteeCaseDetail: async (caseId) => {
    const response = await fetch(`${COMMITTEE_API_BASE}/cases/${caseId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch case detail');
    return response.json();
  },

  // ── Case Management (AP system) ────────────────────────────────────────────

  /**
   * Get all cases assigned to this team leader
   */
  getAssignedCases: async (teamLeaderId, filters = {}) => {
    // Resolve frontend ID to backend UUID for DB query
    const params = new URLSearchParams({ assignedTeamLeader: resolveId(teamLeaderId) });
    if (filters.status) params.append('status', filters.status);
    
    const response = await fetch(`${CASE_API_BASE}?${params}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch assigned cases');
    return response.json();
  },

  /**
   * Get case detail from AP system
   */
  getCaseDetail: async (caseId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch case detail');
    return response.json();
  },

  /**
   * Assign a case to an auditor (Team Leader action)
   * Goes through the C2/C3-validated CaseHandoffController:
   * - creates a case_auditor_assignment record (partial unique index: one ACTIVE per case)
   * - validates auditor is in the leader's team (403 AUDITOR_NOT_IN_TEAM on violation)
   * - rejects empty teams early (400 NO_TEAM_MEMBERS)
   * - requires the requesting user to be the assigned team leader (401)
   * Status: HANDED_OFF/ASSIGNED_TO_TEAM_LEADER/TEAM_ASSIGNED → AUDITOR_ASSIGNED
   */
  assignCaseToAuditor: async (caseId, auditorId) => {
    const response = await fetch(`/api/v1/backoffice/cases/${caseId}/assign-auditor`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ auditorId: resolveUserId(auditorId) }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const codeMessages = {
        NO_TEAM_MEMBERS: 'Your team has no active members. Ask the Chairperson to form your team first.',
        AUDITOR_NOT_IN_TEAM: 'Selected auditor is not a member of your team.',
        UNAUTHORIZED: 'Only the assigned team leader can assign auditors to this case.',
        CASE_NOT_FOUND: 'Case not found.',
        AUDITOR_NOT_FOUND: 'Selected auditor does not exist.',
      };
      throw new Error(codeMessages[error.error] || error.message || 'Failed to assign case to auditor');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  },

  /**
   * Assign case to team leader (transfer from committee)
   * Status: PENDING → ASSIGNED
   */
  assignCaseToTeamLeader: async (caseId, teamLeaderId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/assign-team-leader`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ teamLeaderId: resolveId(teamLeaderId) }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to assign case to team leader');
    }
    return response.json();
  },

  /**
   * Ensure a committee case exists in the AP execution workspace.
   */
  importCaseFromCommittee: async (caseId, teamLeaderId) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/import-from-committee`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ teamLeaderId: resolveId(teamLeaderId) }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error?.message || 'Failed to import case into execution');
    }
    const result = await response.json();
    return result.data || result;
  },

  /**
   * Get auditor nominations for a case (used to show team auditors)
   */
  getAuditorNominations: async (caseId) => {
    const response = await fetch(`${COMMITTEE_API_BASE}/cases/${caseId}/auditor-nominations`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch auditor nominations');
    return response.json();
  },

  /**
   * Get team leader nominations for a case
   */
  getTeamLeaderNominations: async (caseId) => {
    const response = await fetch(`${COMMITTEE_API_BASE}/cases/${caseId}/team-leader-nominations`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch team leader nominations');
    return response.json();
  },

  /**
   * Assign an auditor from nominated team to a case
   */
  assignAuditorToCase: async (caseId, auditorId, teamLeaderId) => {
    const response = await fetch(`${COMMITTEE_API_BASE}/cases/${caseId}/assign-auditor-to-case`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        auditorId: resolveUserId(auditorId),
        teamLeaderId: teamLeaderId ? resolveId(teamLeaderId) : undefined,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to assign auditor to case');
    }
    return response.json();
  },

  /**
   * Hand off a case (Team Leader takes responsibility)
   * Status: ASSIGNED → HANDED_OFF
   */
  handoffCase: async (caseId, teamLeaderId, comment) => {
    const resolvedTlId = resolveId(teamLeaderId);
    let executionCaseId = caseId;
    try {
      const importedCase = await teamLeaderAPI.importCaseFromCommittee(caseId, teamLeaderId);
      if (importedCase && (importedCase.id || importedCase.caseId)) {
        executionCaseId = importedCase.id || importedCase.caseId;
      }
    } catch (e) {
      console.warn('Auto-import from committee before handoff notice:', e);
    }
    const headers = getHeaders();
    if (resolvedTlId) {
      headers['X-Actor-Id'] = resolvedTlId;
    }
    const response = await fetch(`${CASE_API_BASE}/${executionCaseId}/handoff`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        comment: comment || 'Accepted by Team Leader',
        teamLeaderId: resolvedTlId,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error?.message || 'Failed to hand off case');
    }
    return response.json();
  },

  /**
   * Update case status
   */
  updateCaseStatus: async (caseId, status) => {
    const response = await fetch(`${CASE_API_BASE}/${caseId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update case status');
    }
    return response.json();
  },

  // ── Team Formation ────────────────────────────────────────────────────────

  /**
   * Get the team for the current team leader
   * Returns team info with auditor details
   */
  getMyTeam: async (teamLeaderId) => {
    const actorId = ID_MAP[teamLeaderId] || teamLeaderId;
    const url = actorId
      ? `${COMMITTEE_API_BASE}/teams/my-team?teamLeaderId=${encodeURIComponent(actorId)}`
      : `${COMMITTEE_API_BASE}/teams/my-team`;
    const headers = getHeaders();
    if (actorId) {
      headers['X-Actor-Id'] = actorId;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  },

  // ── Vote tally (for committee cases details) ───────────────────────────────

  getVoteTally: async (caseId) => {
    const response = await fetch(`${COMMITTEE_API_BASE}/cases/${caseId}/vote-tally`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch vote tally');
    return response.json();
  },
};
