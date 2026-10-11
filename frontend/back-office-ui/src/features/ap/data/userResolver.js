/**
 * User Resolver Utility
 * 
 * Normalizes roles, regions, audit types, and guarantees complete user profiles
 * for authentication and UI components (App.jsx, Sidebar.jsx, TopBar.jsx).
 */

import { SEED_USERS } from './seed.js';

export function normalizeRole(role) {
  if (!role) return 'auditor';
  const r = role.toLowerCase().replace(/[\s-]+/g, '_');
  
  if (r.includes('qa_officer') || r === 'qa_officer') return 'qa_officer';
  if (r.includes('qa_team_leader') || r === 'qa_team_leader' || r === 'qa.tl1') return 'qa_team_leader';
  if (r.includes('qa_director') || r === 'qa_director' || r === 'qa.director') return 'qa_director';

  if (r.includes('plan')) return 'planning_team';
  if (r.includes('direct') && !r.includes('region')) return 'audit_director';
  if (r.includes('senior')) return 'senior_management';
  if (r.includes('region')) return 'regional_director';
  if (r.includes('tax_center_mgr') || r.includes('tax_center_manager') || r.includes('tcm') || r.includes('tax_center') || r.includes('taxcenter') || r.startsWith('tc_') || r === 'tc') return 'tax_center_manager';
  if (r.includes('team_leader') || r.includes('teamleader') || r === 'tl' || r.startsWith('tl_')) return 'team_leader';
  if (r.includes('chair') || r.includes('chairperson')) return 'committee_chair';
  if (r.includes('committee') || r.includes('member')) return 'committee_member';
  if (r.includes('request')) return 'audit_requester';
  if (r.includes('taxpayer') || r.includes('portal')) return 'taxpayer';
  if (r.includes('admin')) return 'planning_team';
  if (r.includes('auditor') || r === 'aud') return 'auditor';
  return r;
}

export function resolveRegion(loc) {
  if (!loc) return null;
  const l = loc.toLowerCase();
  if (l.startsWith('fed') || l.includes('lto')) return 'federal_level';
  if (l.startsWith('addis') || l.includes('aa')) return 'addis_ababa';
  if (l.startsWith('amhara') || l.includes('ba')) return 'amhara';
  if (l.startsWith('oromia') || l.includes('bb')) return 'oromia';
  if (l.startsWith('dire') || l.includes('ab')) return 'dire_dawa';
  if (l.startsWith('snnpr') || l.includes('ca')) return 'snnpr';
  if (l.startsWith('somali') || l.includes('so')) return 'somali';
  return loc;
}

export function resolveAuditType(str) {
  if (!str) return null;
  const s = str.toLowerCase();
  if (s.includes('transfer') || s.includes('tp')) return 'transfer_pricing';
  if (s.includes('joint') || s.includes('.ja') || s.includes('-ja') || s.includes('ja_') || s.includes('_ja') || s === 'ja') return 'joint_audit';
  if (s.includes('desk')) return 'desk_audit';
  if (s.includes('comp')) return 'comprehensive';
  if (s.includes('issue')) return 'issue_audit';
  return str;
}

export function buildCompleteUserProfile(rawUser) {
  if (!rawUser) return null;

  const id = rawUser.id || rawUser.userId || rawUser.username;
  const username = rawUser.username || id;
  const email = rawUser.email || `${username}@mor.gov.et`;
  const name = rawUser.fullName || rawUser.name || username;
  const role = normalizeRole(rawUser.role || rawUser.userType);
  const region = resolveRegion(rawUser.region || rawUser.assignedLocation);
  const taxCenter = rawUser.taxCenter || (rawUser.assignedLevel === 'TAX_CENTER' ? rawUser.assignedLocation : null) || null;
  const auditType = resolveAuditType(rawUser.auditType);
  const permissions = rawUser.permissions || [];

  return {
    id,
    userId: id,
    username,
    name,
    fullName: name,
    email,
    role,
    userType: role.toUpperCase(),
    region,
    taxCenter,
    auditType,
    permissions,
    password: rawUser.password || 'password123',
    status: rawUser.status || 'ACTIVE'
  };
}

/**
 * Maps raw user record from backend /api/v1/backoffice/ap/users into complete frontend user profile
 */
export function mapBackendUserToProfile(u) {
  if (!u) return null;
  const roleMapping = {
    'PLANNING_TEAM': 'planning_team',
    'NATIONAL_ADMIN': 'planning_team',
    'DIRECTOR': 'audit_director',
    'SENIOR_MANAGEMENT': 'senior_management',
    'REGIONAL_DIRECTOR': 'regional_director',
    'TAX_CENTER_MANAGER': 'tax_center_manager',
    'TEAM_LEADER': 'team_leader',
    'AUDITOR': 'auditor',
    'COMMITTEE_MEMBER': 'committee_member',
    'COMMITTEE_CHAIR': 'committee_chair',
    'AUDIT_REQUESTER': 'audit_requester',
    'TAXPAYER': 'taxpayer'
  };

  let region = null;
  if (u.assignedLevel === 'REGIONAL') {
    const codeMap = { 'FED':'federal_level', 'AA':'addis_ababa', 'BA':'amhara', 'BB':'oromia', 'AB':'dire_dawa', 'CA':'snnpr', 'SO':'somali' };
    region = codeMap[u.assignedLocation] || resolveRegion(u.assignedLocation);
  } else if (u.assignedLevel === 'TAX_CENTER') {
    const loc = (u.assignedLocation || '').toLowerCase();
    if (loc.startsWith('federal'))      region = 'federal_level';
    else if (loc.startsWith('addis'))   region = 'addis_ababa';
    else if (loc.startsWith('amhara'))  region = 'amhara';
    else if (loc.startsWith('oromia'))  region = 'oromia';
    else if (loc.startsWith('dire'))    region = 'dire_dawa';
    else if (loc.startsWith('snnpr'))   region = 'snnpr';
    else if (loc.startsWith('somali'))  region = 'somali';
    else region = resolveRegion(loc);
  } else if (u.assignedLevel === 'NATIONAL') {
    region = 'federal_level';
  } else if (u.region) {
    region = resolveRegion(u.region);
  }

  const role = roleMapping[u.userType] || normalizeRole(u.role || u.userType);
  const id = u.username || u.userId || u.id;
  const name = u.fullName || u.name || u.username || id;
  const email = u.email || `${u.username || id}@mor.gov.et`;
  const taxCenter = u.taxCenter || (u.assignedLevel === 'TAX_CENTER' ? u.assignedLocation : null);
  const auditType = u.auditType ? resolveAuditType(u.auditType) : null;

  return {
    id,
    userId: u.userId || id,
    username: u.username || id,
    name,
    fullName: name,
    email,
    role,
    userType: (u.userType || role).toUpperCase(),
    region,
    taxCenter,
    auditType,
    permissions: u.permissions || [],
    status: u.status || 'ACTIVE',
    password: u.password || 'password123'
  };
}

/**
 * Fallback synthesizer for any valid ITAS username convention (e.g. u-tl-addis_ababa-tc1-desk-1)
 */
export function synthesizeUserFromPattern(identifier) {
  if (!identifier) return null;
  const input = identifier.trim().toLowerCase();
  const cleanInput = input.replace(/@mor\.gov\.et$/, '');

  // 0. Direct match in SEED_USERS first
  if (Array.isArray(SEED_USERS)) {
    const foundInSeed = SEED_USERS.find(u => 
      (u.id && u.id.toLowerCase() === cleanInput) ||
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === input) ||
      (u.email && u.email.toLowerCase() === `${cleanInput}@mor.gov.et`)
    );
    if (foundInSeed) {
      return buildCompleteUserProfile(foundInSeed);
    }
  }

  // Pattern checks
  if (cleanInput === 'admin' || input.includes('admin@mor.gov.et')) {
    return buildCompleteUserProfile({
      id: 'admin',
      name: 'System Administrator',
      email: 'admin@mor.gov.et',
      role: 'planning_team'
    });
  }

  if (cleanInput === 'taxpayer1' || input.includes('cresttextiles.et') || input.includes('taxpayer')) {
    return buildCompleteUserProfile({
      id: 'taxpayer1',
      name: 'Crest Textiles CFO',
      email: 'cfo@cresttextiles.et',
      role: 'taxpayer'
    });
  }

  if (cleanInput === 'qa_officer' || cleanInput === 'usr-qa-01' || cleanInput === 'qa.officer1') {
    return buildCompleteUserProfile({
      id: cleanInput,
      username: cleanInput,
      name: 'QA Officer',
      email: `${cleanInput}@mor.gov.et`,
      role: 'qa_officer',
      region: 'federal_level',
      taxCenter: 'federal-lto1'
    });
  }

  if (cleanInput === 'qa_team_leader' || cleanInput === 'usr-qa-tl' || cleanInput === 'qa.tl1') {
    return buildCompleteUserProfile({
      id: cleanInput,
      username: cleanInput,
      name: 'QA Team Leader',
      email: `${cleanInput}@mor.gov.et`,
      role: 'qa_team_leader',
      region: 'federal_level',
      taxCenter: 'federal-lto1'
    });
  }

  if (cleanInput === 'qa_director' || cleanInput === 'qa.director') {
    return buildCompleteUserProfile({
      id: cleanInput,
      username: cleanInput,
      name: 'QA Director',
      email: `${cleanInput}@mor.gov.et`,
      role: 'qa_director',
      region: 'federal_level',
      taxCenter: 'federal-lto1'
    });
  }

  // Known auditor & team leader direct email aliases
  if (input === 'michael.abera@mor.gov.et' || input === 'michael.desta@mor.gov.et' || cleanInput === 'michael.abera' || cleanInput === 'michael.desta' || cleanInput === 'tolera.getachew') {
    return buildCompleteUserProfile({
      id: 'u-aud-addis_ababa-tc1-tp-1-1',
      username: 'u-aud-addis_ababa-tc1-tp-1-1',
      name: 'Michael Abera (TP Auditor)',
      email: 'michael.abera@mor.gov.et',
      role: 'auditor',
      region: 'addis_ababa',
      taxCenter: 'addis_ababa-tc1',
      auditType: 'transfer_pricing',
      teamLeader: 'u-tl-addis_ababa-tc1-tp-1'
    });
  }

  if (input === 'robel.girma@mor.gov.et' || cleanInput === 'robel.girma') {
    return buildCompleteUserProfile({
      id: 'u-tl-addis_ababa-tc1-tp-1',
      username: 'u-tl-addis_ababa-tc1-tp-1',
      name: 'Robel Girma (TP TL-1)',
      email: 'u-tl-addis_ababa-tc1-tp-1@mor.gov.et',
      role: 'team_leader',
      region: 'addis_ababa',
      taxCenter: 'addis_ababa-tc1',
      auditType: 'transfer_pricing'
    });
  }

  // Check prefix (using cleanInput without @mor.gov.et)
  const parts = cleanInput.split('-');
  if (parts[0] === 'u') {
    const type = parts[1]; // pt, ad, sm, rd, tcm, tc, com, tl, aud, req
    
    if (type === 'pt') {
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `Planning Team Lead (${cleanInput})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'planning_team',
        region: 'federal_level'
      });
    }
    if (type === 'ad') {
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `Audit Director (${cleanInput})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'audit_director',
        region: 'federal_level'
      });
    }
    if (type === 'sm') {
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `Senior Management (${cleanInput})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'senior_management',
        region: 'federal_level'
      });
    }
    if (type === 'rd') {
      const reg = parts[2] || 'aa';
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `Regional Director (${reg.toUpperCase()})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'regional_director',
        region: resolveRegion(reg)
      });
    }
    if (type === 'tcm' || type === 'tc') {
      const tc = parts.slice(2).join('-');
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `Tax Center Manager (${tc || cleanInput})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'tax_center_manager',
        region: resolveRegion(tc),
        taxCenter: tc || cleanInput
      });
    }
    if (type === 'com') {
      const isChair = cleanInput.includes('chair') || cleanInput.endsWith('-tp') || cleanInput.endsWith('-ja');
      let at = resolveAuditType(cleanInput);
      if (cleanInput.includes('fed-chair') && !cleanInput.includes('tp')) {
        at = 'joint_audit';
      }
      // Extract taxCenter: e.g. u-com-federal-lto1-tp -> federal-lto1, u-com-addis_ababa-tc1-tp -> addis_ababa-tc1
      let tc = cleanInput
        .replace(/^u-com-/, '')
        .replace(/-(?:tp|ja|joint|desk|comp|issue|chair|tpchair|jachair|mem\d*|tpmem\d*)$/, '');
      if (tc === 'fed' || tc === 'federal') tc = 'federal-lto1';
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `${at ? at.replace(/_/g, ' ').toUpperCase() : ''} Committee ${isChair ? 'Chair' : 'Member'} (${tc.replace(/-/g, ' ').toUpperCase()})`,
        email: `${cleanInput}@mor.gov.et`,
        role: isChair ? 'committee_chair' : 'committee_member',
        region: (tc.includes('federal') || tc.startsWith('fed')) ? 'federal_level' : resolveRegion(tc),
        taxCenter: tc,
        auditType: at || 'transfer_pricing'
      });
    }
    if (type === 'tl') {
      // e.g. u-tl-addis_ababa-tc1-desk-1
      const atShort = parts[parts.length - 2];
      const tc = parts.slice(2, parts.length - 2).join('-');
      const num = parts[parts.length - 1];
      const at = resolveAuditType(atShort);
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `${at ? at.replace(/_/g, ' ').toUpperCase() : ''} TL-${num} (${tc})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'team_leader',
        region: resolveRegion(tc),
        taxCenter: tc,
        auditType: at
      });
    }
    if (type === 'aud') {
      // e.g. u-aud-addis_ababa-tc1-desk-1-1
      const atShort = parts[parts.length - 3];
      const tc = parts.slice(2, parts.length - 3).join('-');
      const tlNum = parts[parts.length - 2];
      const audNum = parts[parts.length - 1];
      const at = resolveAuditType(atShort);
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `${at ? at.replace(/_/g, ' ').toUpperCase() : ''} Aud-${audNum} (TL-${tlNum}, ${tc})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'auditor',
        region: resolveRegion(tc),
        taxCenter: tc,
        auditType: at
      });
    }
    if (type === 'req') {
      return buildCompleteUserProfile({
        id: cleanInput,
        name: `Audit Referral Officer (${cleanInput})`,
        email: `${cleanInput}@mor.gov.et`,
        role: 'audit_requester',
        region: 'federal_level'
      });
    }
  }

  // Dynamic Region & Tax Center Heuristics
  let region = null;
  let taxCenter = null;
  if (cleanInput.includes('fed2') || cleanInput.includes('lto2')) {
    region = 'federal_level';
    taxCenter = 'federal-lto2';
  } else if (cleanInput.includes('fed') || cleanInput.includes('lto1') || cleanInput.includes('lto')) {
    region = 'federal_level';
    taxCenter = 'federal-lto1';
  } else if (cleanInput.includes('aa1') || cleanInput.includes('addis_ababa-tc1')) {
    region = 'addis_ababa';
    taxCenter = 'addis_ababa-tc1';
  } else if (cleanInput.includes('aa2') || cleanInput.includes('addis_ababa-tc2')) {
    region = 'addis_ababa';
    taxCenter = 'addis_ababa-tc2';
  } else if (cleanInput.includes('aa3') || cleanInput.includes('addis_ababa-tc3')) {
    region = 'addis_ababa';
    taxCenter = 'addis_ababa-tc3';
  } else if (cleanInput.includes('aa') || cleanInput.includes('addis')) {
    region = 'addis_ababa';
    taxCenter = 'addis_ababa-tc1';
  } else if (cleanInput.includes('or1') || cleanInput.includes('oromia-tc1')) {
    region = 'oromia';
    taxCenter = 'oromia-tc1';
  } else if (cleanInput.includes('or2') || cleanInput.includes('oromia-tc2')) {
    region = 'oromia';
    taxCenter = 'oromia-tc2';
  } else if (cleanInput.includes('or3') || cleanInput.includes('oromia-tc3')) {
    region = 'oromia';
    taxCenter = 'oromia-tc3';
  } else if (cleanInput.includes('or') || cleanInput.includes('bb') || cleanInput.includes('oromia')) {
    region = 'oromia';
    taxCenter = 'oromia-tc1';
  } else if (cleanInput.includes('ba1') || cleanInput.includes('amhara-tc1')) {
    region = 'amhara';
    taxCenter = 'amhara-tc1';
  } else if (cleanInput.includes('ba2') || cleanInput.includes('amhara-tc2')) {
    region = 'amhara';
    taxCenter = 'amhara-tc2';
  } else if (cleanInput.includes('ba3') || cleanInput.includes('amhara-tc3')) {
    region = 'amhara';
    taxCenter = 'amhara-tc3';
  } else if (cleanInput.includes('ba') || cleanInput.includes('amhara')) {
    region = 'amhara';
    taxCenter = 'amhara-tc1';
  } else if (cleanInput.includes('dd1') || cleanInput.includes('dire_dawa-tc1') || cleanInput.includes('dd') || cleanInput.includes('ab') || cleanInput.includes('dire')) {
    region = 'dire_dawa';
    taxCenter = 'dire_dawa-tc1';
  } else if (cleanInput.includes('sn1') || cleanInput.includes('snnpr-tc1') || cleanInput.includes('sn') || cleanInput.includes('ca') || cleanInput.includes('snnpr')) {
    region = 'snnpr';
    taxCenter = 'snnpr-tc1';
  } else if (cleanInput.includes('so1') || cleanInput.includes('somali-tc1') || cleanInput.includes('so') || cleanInput.includes('somali')) {
    region = 'somali';
    taxCenter = 'somali-tc1';
  }

  // Dynamic Audit Type
  let auditType = resolveAuditType(cleanInput);

  // Dynamic Role Heuristics
  let role = 'auditor';
  if (cleanInput.includes('chair') || cleanInput.includes('chairperson')) {
    role = 'committee_chair';
    if (!auditType) auditType = 'joint_audit';
  } else if (cleanInput.includes('member') || cleanInput.includes('com')) {
    role = 'committee_member';
    if (!auditType) auditType = 'joint_audit';
  } else if (cleanInput.includes('tl') || cleanInput.includes('team_leader') || cleanInput.includes('teamleader')) {
    role = 'team_leader';
  } else if (cleanInput.includes('tcm') || cleanInput.includes('tax_center_manager') || cleanInput.includes('tc_mgr') || cleanInput.includes('taxcenter') || cleanInput.includes('tax_center')) {
    role = 'tax_center_manager';
  } else if (cleanInput.includes('rd') || cleanInput.includes('regional_director')) {
    role = 'regional_director';
  } else if (cleanInput.includes('ad') || cleanInput.includes('director') || cleanInput.includes('audit_director')) {
    role = 'audit_director';
  } else if (cleanInput.includes('sm') || cleanInput.includes('senior')) {
    role = 'senior_management';
  } else if (cleanInput.includes('pt') || cleanInput.includes('plan')) {
    role = 'planning_team';
  } else if (cleanInput.includes('req')) {
    role = 'audit_requester';
  }

  const roleTitle = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return buildCompleteUserProfile({
    id: cleanInput,
    username: cleanInput,
    name: `${roleTitle} (${taxCenter || region || cleanInput})`,
    email: input.includes('@') ? input : `${cleanInput}@mor.gov.et`,
    role,
    region,
    taxCenter,
    auditType
  });
}
