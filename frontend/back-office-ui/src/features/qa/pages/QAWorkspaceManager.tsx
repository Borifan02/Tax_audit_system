import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import QAOfficerWorkspace from '../components/QAOfficerWorkspace';
import QATeamLeaderWorkspace from '../components/QATeamLeaderWorkspace';
import QADirectorWorkspace from '../components/QADirectorWorkspace';
import QAAuditTeamPortal from '../components/QAAuditTeamPortal';

const VALID_OFFICER_TABS = new Set([
  'DIMENSIONS',
  'DEFICIENCIES',
  'AUDIT_CONTEXT',
  'WORKING_PAPERS',
  'COMMUNICATION',
  'REPORT'
]);

export const QAWorkspaceManager: React.FC<{
  view?: string;
  onNavigate?: (view: string) => void;
}> = ({ view, onNavigate }) => {
  const { user } = useAuth();
  const [officerTab, setOfficerTab] = useState<any>('DIMENSIONS');
  const [selectedQACaseId, setSelectedQACaseId] = useState<string | undefined>('QA-REV-2026-001');

  useEffect(() => {
    if (view === 'dashboard') {
      setOfficerTab('DIMENSIONS');
    } else if (view && VALID_OFFICER_TABS.has(view)) {
      setOfficerTab(view);
    }
  }, [view]);

  if (!user) return null;

  const normalizedUser = {
    ...user,
    title: user.title || (user.role === 'qa_officer' ? 'Senior QA Assurance Inspector'
      : user.role === 'qa_team_leader' ? 'QA Review Team Leader'
      : user.role === 'qa_director' ? 'Director of Audit Quality Assurance'
      : user.role?.replace(/_/g, ' ') || 'Audit Officer')
  };

  if (view === 'qa-portal') {
    return (
      <QAAuditTeamPortal
        currentUser={normalizedUser as any}
        onBackToAudit={onNavigate ? () => onNavigate('dashboard') : undefined}
      />
    );
  }

  if (user.role === 'QA_TEAM_LEADER' || user.role === 'qa_team_leader') {
    return (
      <QATeamLeaderWorkspace
        currentUser={normalizedUser as any}
        onSelectCase={setSelectedQACaseId}
      />
    );
  }

  if (user.role === 'QA_DIRECTOR' || user.role === 'qa_director') {
    return (
      <QADirectorWorkspace
        currentUser={normalizedUser as any}
      />
    );
  }

  if (user.role === 'QA_OFFICER' || user.role === 'qa_officer') {
    return (
      <QAOfficerWorkspace
        currentUser={normalizedUser as any}
        caseId={selectedQACaseId || 'QA-REV-2026-001'}
        activeTab={officerTab}
        onTabChange={(tab) => {
          setOfficerTab(tab);
          if (onNavigate && VALID_OFFICER_TABS.has(tab)) {
            onNavigate(tab === 'DIMENSIONS' ? 'dashboard' : tab);
          }
        }}
        onSelectAuditCase={setSelectedQACaseId}
      />
    );
  }

  // Fallback / liaison portal for Auditors and Team Leaders
  return (
    <QAAuditTeamPortal
      currentUser={normalizedUser as any}
      onBackToAudit={onNavigate ? () => onNavigate('dashboard') : undefined}
    />
  );
};
