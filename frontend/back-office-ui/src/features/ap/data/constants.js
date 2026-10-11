// ============================================================
// CONSTANTS — single source of truth for all static data
// ============================================================

export const REGIONS = [
  { id: 'federal_level', name: 'Federal Level (LTO)', code: 'FED' },
  { id: 'addis_ababa',    name: 'Addis Ababa',          code: 'AA' },
  { id: 'amhara',         name: 'Amhara',               code: 'BA' },
  { id: 'oromia',         name: 'Oromia',               code: 'BB' },
  { id: 'dire_dawa',      name: 'Dire Dawa',            code: 'AB' },
  { id: 'snnpr',          name: 'SNNPR',                code: 'CA' },
  { id: 'somali',         name: 'Somali',               code: 'SO' },
];

export const TAX_CENTERS = {
  federal_level: [
    { id: 'federal-lto1', name: 'Federal Large Taxpayers Office 1', shortName: 'FED-LTO1' },
    { id: 'federal-lto2', name: 'Federal Large Taxpayers Office 2', shortName: 'FED-LTO2' },
  ],
  addis_ababa: [
    { id: 'addis_ababa-tc1', name: 'Addis Ababa TC1', shortName: 'AA-TC1' },
    { id: 'addis_ababa-tc2', name: 'Addis Ababa TC2', shortName: 'AA-TC2' },
    { id: 'addis_ababa-tc3', name: 'Addis Ababa TC3', shortName: 'AA-TC3' },
  ],
  amhara: [
    { id: 'amhara-tc1', name: 'Amhara TC1', shortName: 'BA-TC1' },
    { id: 'amhara-tc2', name: 'Amhara TC2', shortName: 'BA-TC2' },
    { id: 'amhara-tc3', name: 'Amhara TC3', shortName: 'BA-TC3' },
  ],
  oromia: [
    { id: 'oromia-tc1', name: 'Oromia TC1', shortName: 'BB-TC1' },
    { id: 'oromia-tc2', name: 'Oromia TC2', shortName: 'BB-TC2' },
    { id: 'oromia-tc3', name: 'Oromia TC3', shortName: 'BB-TC3' },
  ],
  dire_dawa: [
    { id: 'dire_dawa-tc1', name: 'Dire Dawa TC1', shortName: 'AB-TC1' },
    { id: 'dire_dawa-tc2', name: 'Dire Dawa TC2', shortName: 'AB-TC2' },
    { id: 'dire_dawa-tc3', name: 'Dire Dawa TC3', shortName: 'AB-TC3' },
  ],
  snnpr: [
    { id: 'snnpr-tc1', name: 'SNNPR TC1', shortName: 'CA-TC1' },
    { id: 'snnpr-tc2', name: 'SNNPR TC2', shortName: 'CA-TC2' },
    { id: 'snnpr-tc3', name: 'SNNPR TC3', shortName: 'CA-TC3' },
  ],
  somali: [
    { id: 'somali-tc1', name: 'Somali TC1', shortName: 'SO-TC1' },
    { id: 'somali-tc2', name: 'Somali TC2', shortName: 'SO-TC2' },
    { id: 'somali-tc3', name: 'Somali TC3', shortName: 'SO-TC3' },
  ],
};

export const AUDIT_TYPES = [
  { id: 'desk_audit',       name: 'Desk Audit',        color: 'blue',   shortName: 'Desk'   },
  { id: 'joint_audit',      name: 'Joint Audit',       color: 'purple', shortName: 'Joint'  },
  { id: 'transfer_pricing', name: 'Transfer Pricing',  color: 'orange', shortName: 'TP'    },
  { id: 'comprehensive',    name: 'Comprehensive',     color: 'red',    shortName: 'Comp'   },
  { id: 'issue_audit',      name: 'Issue Audit',       color: 'teal',   shortName: 'Issue'  },
];

export const PLAN_STATUS = {
  DRAFT:                       { id: 'DRAFT',                       label: 'Draft',                        color: 'gray'   },
  SUBMITTED_TO_DIRECTOR:       { id: 'SUBMITTED_TO_DIRECTOR',       label: 'Pending Director Approval',    color: 'yellow' },
  REVISION_REQUESTED:          { id: 'REVISION_REQUESTED',          label: 'Revision Requested',           color: 'orange' },
  DIRECTOR_APPROVED:           { id: 'DIRECTOR_APPROVED',           label: 'Director Approved',            color: 'blue'   },
  AWAITING_REGIONAL_FEEDBACK:  { id: 'AWAITING_REGIONAL_FEEDBACK',  label: 'Awaiting Regional Feedback',   color: 'purple' },
  FEEDBACK_COLLECTED:          { id: 'FEEDBACK_COLLECTED',          label: 'All Feedback Received',        color: 'teal'   },
  AMENDMENT_REQUIRED:          { id: 'AMENDMENT_REQUIRED',          label: 'Amendment Required',           color: 'orange' },
  SUBMITTED_TO_SENIOR_MGMT:    { id: 'SUBMITTED_TO_SENIOR_MGMT',    label: 'Pending Senior Approval',      color: 'indigo' },
  SENIOR_MGMT_APPROVED:        { id: 'SENIOR_MGMT_APPROVED',        label: 'Senior Management Approved',   color: 'green'  },
  SENIOR_MGMT_REJECTED:        { id: 'SENIOR_MGMT_REJECTED',        label: 'Rejected by Senior Mgmt',      color: 'red'    },
  APPROVED_TO_REGIONS:         { id: 'APPROVED_TO_REGIONS',         label: 'Approved - Deploy to Tax Centers', color: 'purple' },
  FINALIZED:                   { id: 'FINALIZED',                   label: 'Finalized & Deployed',         color: 'green'  },
};

export const ROLES = {
  PLANNING_TEAM:    { id: 'planning_team',    label: 'Audit Planning Team',    icon: 'ClipboardList', level: 2 },
  AUDIT_DIRECTOR:   { id: 'audit_director',   label: 'Audit Director',         icon: 'ShieldCheck',   level: 1 },
  REGIONAL_DIRECTOR:{ id: 'regional_director',label: 'Regional Director',      icon: 'Map',           level: 3 },
  TAX_CENTER_MGR:   { id: 'tax_center_manager',label:'Tax Center Manager',     icon: 'Building',      level: 4 },
  TEAM_LEADER:      { id: 'team_leader',      label: 'Team Leader',            icon: 'Users',         level: 5 },
  AUDITOR:          { id: 'auditor',          label: 'Auditor',                icon: 'Search',        level: 6 },
  SENIOR_MANAGEMENT:{ id: 'senior_management',label: 'Senior Management',      icon: 'Star',          level: 0 },
};

export const CASE_STATUS = {
  // Frontend-canonical statuses (used in UI logic)
  PENDING:                    { id: 'PENDING',                    label: 'Pending Assignment',      color: 'gray'   },
  ASSIGNED:                   { id: 'ASSIGNED',                   label: 'Assigned',                color: 'blue'   },
  IN_PROGRESS:                { id: 'IN_PROGRESS',                label: 'In Progress',             color: 'yellow' },
  COMPLETED:                  { id: 'COMPLETED',                  label: 'Completed',               color: 'green'  },
  CLOSED:                     { id: 'CLOSED',                     label: 'Closed',                  color: 'teal'   },

  // Backend-canonical statuses (returned by the API)
  PENDING_ASSIGNMENT:         { id: 'PENDING_ASSIGNMENT',         label: 'Pending Assignment',      color: 'gray'   },
  ASSIGNED_TO_TEAM_LEADER:    { id: 'ASSIGNED_TO_TEAM_LEADER',    label: 'Assigned to Team Leader', color: 'blue'   },
  ASSIGNED_TO_COMMITTEE:      { id: 'ASSIGNED_TO_COMMITTEE',      label: 'Assigned to Committee',   color: 'purple' },

  // Workflow Approval States
  PLANNING_TRIGGERED:         { id: 'PLANNING_TRIGGERED',         label: 'Planning Mandate Issued', color: 'indigo' },
  RISK_ASSESSMENT_SUBMITTED_TL: { id: 'RISK_ASSESSMENT_SUBMITTED_TL', label: '⚡ Risk Assessment Awaiting TL', color: 'amber' },
  AUDIT_PLAN_SUBMITTED_TL:      { id: 'AUDIT_PLAN_SUBMITTED_TL',      label: '⚡ Audit Plan Awaiting TL',      color: 'amber' },
  AUDIT_PLAN_SUBMITTED_COMMITTEE: { id: 'AUDIT_PLAN_SUBMITTED_COMMITTEE', label: 'Plan Awaiting Committee', color: 'indigo' },
  SUBMITTED_FOR_TL_REVIEW:    { id: 'SUBMITTED_FOR_TL_REVIEW',    label: 'Pending TL Review',       color: 'purple' },
  SUBMITTED_TO_TL:            { id: 'SUBMITTED_TO_TL',            label: 'Pending TL Review',       color: 'purple' },
  REPORT_SUBMITTED_FOR_TL_REVIEW: { id: 'REPORT_SUBMITTED_FOR_TL_REVIEW', label: 'Report Pending TL Review', color: 'purple' },
  REVISION_REQUESTED:         { id: 'REVISION_REQUESTED',         label: 'Revisions Requested',     color: 'orange' },
  RETURNED_TO_AUDITOR:        { id: 'RETURNED_TO_AUDITOR',        label: 'Returned for Revision',   color: 'rose' },
  TL_APPROVED:                { id: 'TL_APPROVED',                label: 'TL Endorsed',             color: 'blue'   },
  SUBMITTED_TO_TC_DIRECTOR:   { id: 'SUBMITTED_TO_TC_DIRECTOR',   label: 'Pending TC Director Decision', color: 'indigo' },
  SUBMITTED_FOR_COMMITTEE:    { id: 'SUBMITTED_FOR_COMMITTEE',    label: 'Pending Committee Deliberation', color: 'indigo' },
  AWAITING_COMMITTEE_DECISION:{ id: 'AWAITING_COMMITTEE_DECISION',label: 'Awaiting Committee Vote', color: 'indigo' },
  COMMITTEE_APPROVED:         { id: 'COMMITTEE_APPROVED',         label: 'Committee Approved ✓',    color: 'green'  },
  RETURNED_BY_COMMITTEE:      { id: 'RETURNED_BY_COMMITTEE',      label: 'Returned by Committee',   color: 'orange' },
  PENDING_NOTICE_ISSUANCE:    { id: 'PENDING_NOTICE_ISSUANCE',    label: 'Pending Notice Issuance', color: 'teal'   },
  REPORT_FINALIZED:           { id: 'REPORT_FINALIZED',           label: 'Report Finalized',        color: 'green'  },
  REFERRED_TO_FRAUD:          { id: 'REFERRED_TO_FRAUD',          label: 'Referred to Tax Fraud',   color: 'rose'   },
  REFERRED_TO_COMPREHENSIVE:  { id: 'REFERRED_TO_COMPREHENSIVE',  label: 'Escalated to Comp Audit', color: 'purple' },
};

export const SECTORS = [
  'Manufacturing', 'Retail', 'Import/Export', 'Construction', 'Finance & Banking',
  'Hospitality', 'Real Estate', 'Telecom', 'Healthcare', 'Agriculture', 'Transport', 'Energy',
];

export const RISK_LEVELS = [
  { id: 'CRITICAL', label: 'Critical', color: 'red',    minScore: 90 },
  { id: 'HIGH',     label: 'High',     color: 'orange', minScore: 70 },
  { id: 'MEDIUM',   label: 'Medium',   color: 'yellow', minScore: 50 },
  { id: 'LOW',      label: 'Low',      color: 'blue',   minScore: 0  },
];

export const getRiskLevel = (score) => {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
};

export const getRegionById = (id) => REGIONS.find(r => r.id === id);
export const getAuditTypeById = (id) => AUDIT_TYPES.find(a => a.id === id);
export const getTaxCentersForRegion = (regionId) => TAX_CENTERS[regionId] || [];
export const getTaxCenterById = (id) => {
  for (const tcs of Object.values(TAX_CENTERS)) {
    const found = tcs.find(tc => tc.id === id);
    if (found) return found;
  }
  return null;
};

/**
 * Map backend audit type identifiers to frontend audit type IDs.
 * Backend cascade stores: DESK_AUDIT, JOINT_AUDIT, TRANSFER_PRICING, COMPREHENSIVE_AUDIT, ISSUE_AUDIT
 * Frontend constants use:  desk_audit, joint_audit, transfer_pricing, comprehensive, issue_audit
 */
export const BACKEND_AUDIT_TYPE_TO_FRONTEND = {
  'DESK_AUDIT':          'desk_audit',
  'JOINT_AUDIT':         'joint_audit',
  'TRANSFER_PRICING':    'transfer_pricing',
  'COMPREHENSIVE_AUDIT': 'comprehensive',
  'ISSUE_AUDIT':         'issue_audit',
};

export const FRONTEND_AUDIT_TYPE_TO_BACKEND = {
  'desk_audit':       'DESK_AUDIT',
  'joint_audit':      'JOINT_AUDIT',
  'transfer_pricing': 'TRANSFER_PRICING',
  'comprehensive':    'COMPREHENSIVE_AUDIT',
  'issue_audit':      'ISSUE_AUDIT',
};

/**
 * Committee-managed audit types
 */
export const COMMITTEE_AUDIT_TYPES = new Set(['JOINT_AUDIT', 'TRANSFER_PRICING']);

/**
 * Normalize a backend case status to a simple frontend status for tab filtering.
 */
export const normalizeBackendStatus = (backendStatus) => {
  switch (backendStatus) {
    case 'PENDING_ASSIGNMENT':      return 'PENDING';
    case 'ASSIGNED_TO_TEAM_LEADER': return 'ASSIGNED';
    case 'ASSIGNED_TO_COMMITTEE':   return 'ASSIGNED';
    case 'IN_PROGRESS':             return 'IN_PROGRESS';
    case 'APPROVED':                return 'COMPLETED';
    case 'COMPLETED':               return 'COMPLETED';
    case 'CLOSED':                  return 'COMPLETED';
    case 'RISK_ASSESSMENT_SUBMITTED_TL': return 'RISK_ASSESSMENT_SUBMITTED_TL';
    case 'AUDIT_PLAN_SUBMITTED_TL': return 'AUDIT_PLAN_SUBMITTED_TL';
    case 'AUDIT_PLAN_SUBMITTED_COMMITTEE': return 'AUDIT_PLAN_SUBMITTED_COMMITTEE';
    default:                        return backendStatus || 'PENDING';
  }
};

/**
 * Get the audit type definition matching a backend or frontend id.
 */
export const getAuditTypeDef = (id) => {
  if (!id) return null;
  // Try direct match first
  const direct = AUDIT_TYPES.find(at => at.id === id);
  if (direct) return direct;
  // Try mapping from backend to frontend id
  const frontendId = BACKEND_AUDIT_TYPE_TO_FRONTEND[id];
  return frontendId ? AUDIT_TYPES.find(at => at.id === frontendId) : null;
};

/**
 * Convert distribution from backend format (region codes like "AA") to frontend format (region IDs like "addis_ababa")
 * Backend stores distribution as { "AA": { "desk_audit": 30, ... }, ... }
 * Frontend expects { "addis_ababa": { "desk_audit": 30, ... }, ... }
 */
export const convertDistributionFromBackend = (backendDistribution) => {
  if (!backendDistribution) return null;
  const codeToId = {};
  REGIONS.forEach(r => { codeToId[r.code] = r.id; });
  const frontendDistribution = {};
  Object.entries(backendDistribution).forEach(([code, auditTypes]) => {
    const regionId = codeToId[code];
    if (regionId) frontendDistribution[regionId] = auditTypes;
  });
  return frontendDistribution;
};

/**
 * Flexible comparison of two audit type strings.
 * Accurately matches:
 * - 'desk_audit' <-> 'DESK_AUDIT' <-> 'desk' <-> 'DESK'
 * - 'joint_audit' <-> 'JOINT_AUDIT' <-> 'joint' <-> 'JOINT' <-> 'ja'
 * - 'transfer_pricing' <-> 'TRANSFER_PRICING' <-> 'tp' <-> 'TP'
 * - 'comprehensive' <-> 'COMPREHENSIVE' <-> 'COMPREHENSIVE_AUDIT' <-> 'comp'
 * - 'issue_audit' <-> 'ISSUE_AUDIT' <-> 'issue' <-> 'ISSUE'
 */
export const isAuditTypeMatch = (type1, type2) => {
  if (!type1 || !type2) return false;
  const t1 = String(type1).trim().toUpperCase().replace(/[\s-]+/g, '_');
  const t2 = String(type2).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (t1 === t2) return true;

  const normalize = (t) => {
    if (t === 'DESK' || t === 'DESK_AUDIT') return 'DESK';
    if (t === 'JOINT' || t === 'JOINT_AUDIT' || t === 'JA') return 'JOINT';
    if (t === 'TP' || t === 'TRANSFER_PRICING' || t === 'TRANSFER') return 'TP';
    if (t === 'COMP' || t === 'COMPREHENSIVE' || t === 'COMPREHENSIVE_AUDIT') return 'COMP';
    if (t === 'ISSUE' || t === 'ISSUE_AUDIT') return 'ISSUE';
    return t;
  };

  return normalize(t1) === normalize(t2);
};

