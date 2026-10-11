import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useApp } from './context/AppContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './features/ap/pages/Login.jsx';

// Role-specific dashboard pages
import PlanningDashboard from './features/ap/pages/planning/PlanningDashboard.jsx';
import DirectorDashboard from './features/ap/pages/director/DirectorDashboard.jsx';
import RegionalDashboard from './features/ap/pages/regional/RegionalDashboard.jsx';
import SeniorDashboard from './features/ap/pages/senior/SeniorDashboard.jsx';
import TaxCenterDashboard from './features/ap/pages/taxcenter/TaxCenterDashboard.jsx';
import CaseManagement from './features/ap/pages/taxcenter/CaseManagement.jsx';
import TeamLeaderDashboard from './features/ap/pages/teamleader/TeamLeaderDashboard.jsx';
import AuditorDashboard from './features/ap/pages/auditor/AuditorDashboard.jsx';
import CommitteeDashboard from './features/ap/pages/committee/CommitteeDashboard.jsx';
import CommitteeCaseAssignment from './features/ap/pages/committee/CommitteeCaseAssignment.jsx';
import RiskAnalysisDashboard from './features/ap/pages/planning/RiskAnalysisDashboard.jsx';
import RiskEngineDashboard from './features/ap/pages/riskengine/RiskEngineDashboard.jsx';
import AuditRequesterDashboard from './features/ap/pages/requester/AuditRequesterDashboard.jsx';
import TaxpayerPortalDashboard from './features/portal/pages/TaxpayerPortalDashboard.jsx';
import { QAWorkspaceManager } from './features/qa/pages/QAWorkspaceManager';
import {
  CommitteeDashboard as JaCommitteeDashboard,
  CommitteeCases as JaCommitteeCases,
  CaseDetail as JaCaseDetail,
  ResearchWorkspace as JaResearchWorkspace,
  AuditorNomination as JaAuditorNomination,
  SessionManager as JaSessionManager,
  AuditTrail as JaAuditTrail,
  CommitteeProvider
} from './features/ja/index.js';
import {
  TeamLeaderDashboard as JaTeamLeaderDashboard,
  TeamLeaderCases as JaTeamLeaderCases,
  WorkflowProvider,
} from './features/teamleader/index.js';
import JaAuditorWorkspace from './features/ja/pages/AuditorWorkspace.jsx';
import { isJointAuditUser } from './components/layout/Sidebar.jsx';
import AuditTrail from './features/committee/pages/AuditTrail.jsx';
import { Spinner } from './components/ui/index.jsx';
import DeskAuditWorkspace from './features/da/components/workspace/DeskAuditWorkspace';
import { ComprehensiveAuditWorkspace } from './features/ca/components/comprehensive/ComprehensiveAuditWorkspace';

const TP_PHASE_TITLES = {
  'phase-1':          { title: '1. Risk Assessment & Evidence',         subtitle: 'Detailed TP risk scoring, BEPS indicators, and baseline evidence' },
  'phase-2':          { title: '2. Audit Planning & Programming',       subtitle: 'Audit scope definition, materiality thresholds, and Entry Conference' },
  'phase-3':          { title: '3. Field Work & Facts',                 subtitle: 'FAR functional analysis, IDR log, and Statement of Facts' },
  'phase-4':          { title: '4. Economic Analysis & IQR',            subtitle: 'Method selection, comparable screening, and interquartile range' },
  'phase-5':          { title: '5. TP Audit Report & Exit Conference',  subtitle: 'Comprehensive TP audit report, Exit Conference, and rebuttal' },
  'phase-6':          { title: '6. Assessment & Notice Draft',          subtitle: 'Arm’s length tax adjustments, penalty calculations, and notice draft' },
  'phase-assessment': { title: '6. Assessment & Notice Draft',          subtitle: 'Arm’s length tax adjustments, penalty calculations, and notice draft' },
  'phase-7':          { title: '7. Notice & Objection',                 subtitle: 'Statutory 30-day objection window and auditor defense rejoinder' },
  'phase-8':          { title: '8. Audit Closure',                      subtitle: 'Statutory clearance certification, digital dossier archival, and case closure' },
};

const JA_PHASE_TITLES = {
  workspace:             { title: 'Joint Audit Workspace',          subtitle: '10-step statutory audit execution workflow' },
  'ja-aud-viability':    { title: 'Viability Assessment',           subtitle: 'Pre-audit viability check and risk profile' },
  'ja-aud-fieldwork':    { title: 'On-Site Inspection',             subtitle: 'Field investigation, questionnaires & interviews' },
  'ja-aud-customs':      { title: 'Customs Discrepancy Matching',   subtitle: 'ASYCUDA import/export data matching vs tax filings' },
  'ja-aud-findings':     { title: 'Findings & Working Papers',      subtitle: 'Audit observations, adjustments and supporting evidence' },
  'ja-aud-report':       { title: 'Joint Audit Report',             subtitle: 'Draft and final joint audit assessment report' },
};

const COMP_PHASE_TITLES = {
  'comp-phase-planning':   { title: 'Comprehensive Audit Planning', subtitle: 'Multi-year multi-tax audit plan & materiality scope' },
  'comp-phase-fieldwork':  { title: 'Books & Records Examination',  subtitle: 'Comprehensive on-site books and accounting records audit' },
  'comp-phase-findings':   { title: 'Comprehensive Audit Findings', subtitle: 'Draft assessment across VAT, income tax and withholding' },
  'comp-phase-response':   { title: 'Taxpayer Objection Review',   subtitle: 'Taxpayer response evaluation and rebuttal hearing' },
  'comp-phase-conclusion': { title: 'Final Assessment & Sign-Off', subtitle: 'Statutory assessment notice and case closure' },
};

const DESK_PHASE_TITLES = {
  'desk-phase-screening':  { title: 'Return Cross-Matching',       subtitle: 'Automated return discrepancy screening & third-party data match' },
  'desk-phase-inquiry':    { title: 'Clarification Requests',      subtitle: 'Statutory 15-day information query notices and replies' },
  'desk-phase-findings':   { title: 'Desk Adjustment Findings',    subtitle: 'Disallowed deductions and mathematical error corrections' },
  'desk-phase-conclusion': { title: 'Summary Assessment Order',    subtitle: 'Automated summary tax assessment and closure' },
};

const ISSUE_PHASE_TITLES = {
  'issue-phase-scope':       { title: 'Single Issue Scoping',          subtitle: 'Targeted verification of specific flagged transactions or refunds' },
  'issue-phase-verification':{ title: 'Voucher & Invoice Verification',subtitle: 'Direct supplier/customer verification and banking trails' },
  'issue-phase-findings':    { title: 'Issue Determination',          subtitle: 'Tax adjustment determination on targeted items' },
  'issue-phase-conclusion':  { title: 'Targeted Assessment Notice',   subtitle: 'Issue audit closure and assessment notice generation' },
};

const ALL_AUDIT_PHASE_TITLES = {
  ...TP_PHASE_TITLES,
  ...JA_PHASE_TITLES,
  ...COMP_PHASE_TITLES,
  ...DESK_PHASE_TITLES,
  ...ISSUE_PHASE_TITLES,
};

const PAGE_TITLES = {
  planning_team: {
    dashboard:           { title: 'Planning Dashboard',          subtitle: 'Manage and track national audit plans' },
    plans:               { title: 'Audit Plans',                 subtitle: 'All audit plans overview' },
    regional_allocation: { title: 'Regional Allocation',         subtitle: 'National quota and case distribution across regions' },
    deployment:          { title: 'Plan Deployment',             subtitle: 'National audit plan deployment lifecycle & regional tracking' },
    risk_analysis:       { title: 'Risk Engine Analysis',        subtitle: 'Live taxpayer risk data from the MOR Risk Engine' },
    risk_distribution:   { title: 'Risk Distribution',           subtitle: 'Taxpayer risk tier distributions and profiling' },
    config:              { title: 'Planning Configuration',      subtitle: 'Dynamic statutory audit types, regions, and effort multipliers' },
    'plan-configuration':{ title: 'Planning Configuration',      subtitle: 'Dynamic statutory audit types, regions, and effort multipliers' },
    audit_trail:         { title: 'Governance Audit Trail',      subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail':       { title: 'Governance Audit Trail',      subtitle: 'Immutable compliance & statutory governance audit log' },
  },
  audit_director: {
    dashboard:   { title: 'Director Dashboard',     subtitle: 'Review and approve audit plans' },
    review:      { title: 'Plan Review',            subtitle: 'Plans awaiting your decision' },
    deploy:      { title: 'Deploy Plans',           subtitle: 'Send approved plans to regions' },
    approvals:   { title: 'Plan Approvals',         subtitle: 'All active and approved national plans' },
    risk_engine: { title: 'Risk Engine',            subtitle: 'AI-powered risk assessment and taxpayer mapping' },
    audit_trail: { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail': { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
  },
  regional_director: {
    dashboard:   { title: 'Regional Dashboard',     subtitle: 'Manage your regional allocation' },
    plans:       { title: 'Regional Plans',         subtitle: 'Plans assigned to your region' },
    feedback:    { title: 'Capacity Feedback',      subtitle: 'Provide regional feedback and tax center allocations' },
    audit_trail: { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail': { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
  },
  tax_center_manager: {
    dashboard:   { title: 'Tax Center Dashboard',   subtitle: 'Manage and assign audit cases for your tax center' },
    cases:       { title: 'Case Management',        subtitle: 'Assign and track audit cases' },
    risk_engine: { title: 'Risk Classifier',        subtitle: 'Map taxpayers to plans and generate cases' },
    audit_trail: { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail': { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
  },
  team_leader: {
    dashboard:   { title: 'Team Leader Dashboard',  subtitle: 'Assign cases and supervise audit team' },
    cases:       { title: 'Assigned Cases',         subtitle: 'Cases under your supervisory team' },
    'tp-tasks':  { title: 'TP Workflow Tasks',      subtitle: 'Review gates and pending supervisory actions' },
    audit_trail: { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail': { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    ...ALL_AUDIT_PHASE_TITLES,
  },
  auditor: {
    dashboard:   { title: 'Auditor Dashboard',      subtitle: 'Your active audit cases' },
    cases:       { title: 'My Cases',               subtitle: 'Cases assigned to you' },
    'da-workspace': { title: 'Desk Audit Workspace', subtitle: 'Execute desk audit procedures and evidence' },
    'ca-workspace': { title: 'Comprehensive Audit Workspace', subtitle: 'Execute comprehensive audit procedures and multi-tax examination' },
    audit_trail: { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail': { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
    ...ALL_AUDIT_PHASE_TITLES,
  },
  committee: {
    dashboard:      { title: 'Committee Dashboard',       subtitle: 'Review and approve audit committee matters' },
    cases:          { title: 'Committee Cases',           subtitle: 'Manage and review all cases' },
    research:       { title: 'Research Workspace',        subtitle: 'Collaborative analysis & research notes' },
    sessions:       { title: 'Session Management',        subtitle: 'Create and manage committee sessions' },
    audit_trail:    { title: 'Audit Trail',               subtitle: 'Immutable compliance & activity log' },
    'audit-trail':  { title: 'Audit Trail',               subtitle: 'Immutable compliance & activity log' },
    reviews:        { title: 'Pending Reviews',           subtitle: 'Cases awaiting your committee review' },
    'assign-cases': { title: 'Assign Cases to Team Leaders', subtitle: 'Distribute cases from committee to team leaders' },
    assign:         { title: 'Assign Cases to Team Leaders', subtitle: 'Distribute cases from committee to team leaders' },
    intake:         { title: 'Intake & Hypotheses',       subtitle: 'Pre-audit case intake & risk hypotheses' },
    planning:       { title: 'Planning & Mandates',       subtitle: 'Audit scope definition & mandates' },
    approvals:      { title: 'Plan & Report Approvals',   subtitle: 'Committee approvals & sign-offs' },
    deliberations:  { title: 'Committee Deliberations',   subtitle: 'Formal session records and statutory voting resolutions' },
    ...ALL_AUDIT_PHASE_TITLES,
  },
  committee_member: {
    dashboard:      { title: 'Committee Dashboard',       subtitle: 'Review and approve audit committee matters' },
    cases:          { title: 'Committee Cases',           subtitle: 'Manage and review all cases' },
    research:       { title: 'Research Workspace',        subtitle: 'Collaborative analysis & research notes' },
    sessions:       { title: 'Session Management',        subtitle: 'Create and manage committee sessions' },
    audit_trail:    { title: 'Audit Trail',               subtitle: 'Immutable compliance & activity log' },
    'audit-trail':  { title: 'Audit Trail',               subtitle: 'Immutable compliance & activity log' },
    reviews:        { title: 'Pending Reviews',           subtitle: 'Cases awaiting your committee review' },
    'assign-cases': { title: 'Assign Cases to Team Leaders', subtitle: 'Distribute cases from committee to team leaders' },
    assign:         { title: 'Assign Cases to Team Leaders', subtitle: 'Distribute cases from committee to team leaders' },
    intake:         { title: 'Intake & Hypotheses',       subtitle: 'Pre-audit case intake & risk hypotheses' },
    planning:       { title: 'Planning & Mandates',       subtitle: 'Audit scope definition & mandates' },
    approvals:      { title: 'Plan & Report Approvals',   subtitle: 'Committee approvals & sign-offs' },
    deliberations:  { title: 'Committee Deliberations',   subtitle: 'Formal session records and statutory voting resolutions' },
    ...ALL_AUDIT_PHASE_TITLES,
  },
  committee_chair: {
    dashboard:      { title: 'Joint Committee Chair Dashboard', subtitle: 'Executive Control Center & Team Formation' },
    cases:          { title: 'Committee Cases',           subtitle: 'Manage and review all cases' },
    research:       { title: 'Research Workspace',        subtitle: 'Collaborative analysis & research notes' },
    auditors:       { title: 'Team Formation',            subtitle: 'Select auditors and team leaders for audit cases' },
    sessions:       { title: 'Session Management',        subtitle: 'Create and manage committee sessions' },
    audit_trail:    { title: 'Audit Trail',               subtitle: 'Immutable compliance & activity log' },
    'audit-trail':  { title: 'Audit Trail',               subtitle: 'Immutable compliance & activity log' },
    reviews:        { title: 'Pending Reviews',           subtitle: 'Cases awaiting your committee review' },
    'assign-cases': { title: 'Assign Cases to Team Leaders', subtitle: 'Distribute cases from committee to team leaders' },
    assign:         { title: 'Assign Cases to Team Leaders', subtitle: 'Distribute cases from committee to team leaders' },
    intake:         { title: 'Intake & Hypotheses',       subtitle: 'Pre-audit case intake & risk hypotheses' },
    planning:       { title: 'Planning & Mandates',       subtitle: 'Audit scope definition & mandates' },
    approvals:      { title: 'Plan & Report Approvals',   subtitle: 'Committee approvals & sign-offs' },
    deliberations:  { title: 'Committee Deliberations',   subtitle: 'Formal session records and statutory voting resolutions' },
    ...ALL_AUDIT_PHASE_TITLES,
  },
  senior_management: {
    dashboard:   { title: 'Senior Management',       subtitle: 'Final approval of national audit plans' },
    approval:    { title: 'National Plan Approval',  subtitle: 'Plans awaiting senior management approval' },
    audit_trail: { title: 'Governance Audit Trail',  subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail': { title: 'Governance Audit Trail', subtitle: 'Immutable compliance & statutory governance audit log' },
  },
  audit_requester: {
    dashboard:    { title: 'Directorate Referral Dashboard', subtitle: 'Submit & track statutory audit case referrals' },
    referrals:    { title: 'My Referrals & Flags',             subtitle: 'Cases flagged for tax clearance, closure & fraud audit' },
    new_referral: { title: 'Submit Audit Referral',            subtitle: 'Flag taxpayer for desk, comprehensive or TP audit' },
    audit_trail:  { title: 'Governance Audit Trail',          subtitle: 'Immutable compliance & statutory governance audit log' },
    'audit-trail':{ title: 'Governance Audit Trail',          subtitle: 'Immutable compliance & statutory governance audit log' },
  },
  taxpayer: {
    dashboard: { title: 'Taxpayer Compliance Portal', subtitle: 'View audit cases, statutory notices, and upload requested documents' }
  }
};

function RoleRouter({ user, view, onNavigate }) {
  const role = user.role;

  // Taxpayer Portal route or role
  if (window.location.pathname.startsWith('/portal') || role === 'taxpayer' || role === 'TAXPAYER') {
    return <TaxpayerPortalDashboard />;
  }

  // Global Governance Audit Trail (accessible across all roles/dashboards except Joint Audit Committee)
  if (view === 'audit_trail' || view === 'audit-trail') {
    const isCommittee = ['committee', 'committee_member', 'committee_chair'].includes(role);
    const isTp = (user?.auditType || '').toUpperCase().includes('TP') ||
                 (user?.auditType || '').toUpperCase().includes('TRANSFER') ||
                 (user?.username || '').toLowerCase().includes('tp') ||
                 (user?.name || '').toLowerCase().includes('tp');
    if (!isCommittee || isTp) {
      return <AuditTrail />;
    }
  }

  // Risk Engine page (accessible to tax center managers, directors, planning team)
  if (view === 'risk_engine') {
    if (['tax_center_manager', 'audit_director', 'planning_team'].includes(role)) {
      return <RiskEngineDashboard />;
    }
  }

  // Standalone risk analysis / distribution page (accessible to planning team via sidebar)
  if ((view === 'risk_analysis' || view === 'risk_distribution') && role === 'planning_team') {
    return <RiskAnalysisDashboard />;
  }

  if (role === 'planning_team')    return <PlanningDashboard view={view} onNavigate={onNavigate} />;
  if (role === 'audit_director')   return <DirectorDashboard view={view} onNavigate={onNavigate} />;
  if (role === 'regional_director') return <RegionalDashboard view={view} onNavigate={onNavigate} />;
  if (role === 'senior_management') return <SeniorDashboard view={view} onNavigate={onNavigate} />;
  if (role === 'tax_center_manager') {
    if (view === 'cases') return <CaseManagement onNavigate={onNavigate} />;
    return <TaxCenterDashboard view={view} onNavigate={onNavigate} />;
  }
  
  if (role === 'qa_officer' || role === 'qa_team_leader' || role === 'qa_director' || role === 'QA_OFFICER' || role === 'QA_TEAM_LEADER' || role === 'QA_DIRECTOR') {
    return <QAWorkspaceManager />;
  }

  if (role === 'team_leader') {
    // Single shared heuristic — must agree with the sidebar's nav selection.
    if (isJointAuditUser(user)) {
      // Only 'cases' routes to the case list; every other view is the dashboard
      // (execution workspace & ja-phase-* supervisory views were removed from the sidebar).
      return (
        <WorkflowProvider>
          {view === 'cases' ? (
            <JaTeamLeaderCases view={view} onNavigate={onNavigate} />
          ) : (
            <JaTeamLeaderDashboard onNavigate={onNavigate} />
          )}
        </WorkflowProvider>
      );
    }
    return <TeamLeaderDashboard view={view} onNavigate={onNavigate} />;
  }
  if (role === 'auditor') {
    if (view === 'da-workspace') {
      const activeCaseId = sessionStorage.getItem('auditor_active_case_id') || user?.assignedCaseId || user?.caseId || null;
      let initialCaseInfo = null;
      try {
        initialCaseInfo = JSON.parse(sessionStorage.getItem('auditor_active_case_data'));
      } catch(e) {}
      return <DeskAuditWorkspace caseId={activeCaseId} initialCaseInfo={initialCaseInfo} />;
    }
    if (view === 'ca-workspace') {
      const activeCaseId = sessionStorage.getItem('auditor_active_case_id') || user?.assignedCaseId || user?.caseId || null;
      let initialCaseInfo = null;
      try {
        initialCaseInfo = JSON.parse(sessionStorage.getItem('auditor_active_case_data'));
      } catch(e) {}
      return <ComprehensiveAuditWorkspace caseData={{ id: activeCaseId, ...initialCaseInfo }} onClose={() => onNavigate('dashboard')} />;
    }
    const activeView = (isJointAuditUser(user) && view && view.startsWith('phase-')) ? 'dashboard' : view;
    return (
      <WorkflowProvider>
        <AuditorDashboard view={activeView} onNavigate={onNavigate} />
      </WorkflowProvider>
    );
  }
  if (role === 'committee' || role === 'committee_member' || role === 'committee_chair') {
    const isTp = (user?.auditType || '').toUpperCase().includes('TP') ||
                 (user?.auditType || '').toUpperCase().includes('TRANSFER') ||
                 (user?.username || '').toLowerCase().includes('tp') ||
                 (user?.name || '').toLowerCase().includes('tp');

    if (isTp) {
      if (view === 'assign-cases' || view === 'assign') return <CommitteeDashboard view="assign" />;
      return <CommitteeDashboard view={view} />;
    }

    // Joint Audit Committee (JAC)
    const isChair = role === 'committee_chair';
    return (
      <CommitteeProvider>
        {view === 'cases' && <JaCommitteeCases />}
        {view === 'research' && <JaResearchWorkspace />}
        {view === 'auditors' && (isChair ? <JaAuditorNomination /> : <JaCommitteeDashboard />)}
        {view === 'sessions' && <JaSessionManager />}
        {(view === 'audit-trail' || view === 'audit_trail') && <JaAuditTrail />}
        {(!['cases', 'research', 'auditors', 'sessions', 'audit-trail', 'audit_trail'].includes(view)) && (
          <JaCommitteeDashboard />
        )}
      </CommitteeProvider>
    );
  }
  if (role === 'audit_requester')  return <AuditRequesterDashboard view={view} />;

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Role not recognized: {role}</p>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { ready } = useApp();
  const [view, setView] = useState('dashboard');

  // Reset active view whenever user switches or logs in
  useEffect(() => {
    setView('dashboard');
  }, [user?.id, user?.username, user?.role, user?.auditType]);

  // For Joint Audit users, TP phases are not valid views
  useEffect(() => {
    if (isJointAuditUser(user) && view && view.startsWith('phase-')) {
      setView('dashboard');
    }
  }, [user, view]);

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading MOR Audit Planning System…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  // Direct URL prefix check for /portal
  if (window.location.pathname.startsWith('/portal')) {
    return <TaxpayerPortalDashboard />;
  }

  const pageInfo =
    PAGE_TITLES[user.role]?.[view] ||
    PAGE_TITLES[user.role]?.['dashboard'] ||
    { title: 'Dashboard', subtitle: '' };

  return (
    <Layout
      activeView={view}
      onNavigate={(v) => setView(v)}
      title={pageInfo.title}
      subtitle={pageInfo.subtitle}
    >
      <RoleRouter user={user} view={view} onNavigate={(v) => setView(v)} />
    </Layout>
  );
}
