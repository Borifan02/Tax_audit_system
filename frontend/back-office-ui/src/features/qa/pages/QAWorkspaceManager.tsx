import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import QAOfficerWorkspace from '../components/QAOfficerWorkspace';
import QATeamLeaderWorkspace from '../components/QATeamLeaderWorkspace';
import QADirectorWorkspace from '../components/QADirectorWorkspace';
import QAAuditTeamPortal from '../components/QAAuditTeamPortal';

export const QAWorkspaceManager = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [selectedQACaseId, setSelectedQACaseId] = useState(null);

  if (!user) return null;

  if (user.role === 'QA_TEAM_LEADER' || user.role === 'qa_team_leader') {
    return (
      <QATeamLeaderWorkspace
        currentUser={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectCase={setSelectedQACaseId}
      />
    );
  }

  if (user.role === 'QA_DIRECTOR' || user.role === 'qa_director') {
    return (
      <QADirectorWorkspace
        currentUser={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }

  if (user.role === 'QA_OFFICER' || user.role === 'qa_officer') {
    return (
      <QAOfficerWorkspace
        currentUser={user}
        caseId={selectedQACaseId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectAuditCase={setSelectedQACaseId}
      />
    );
  }

  // Fallback / liaison portal
  return <QAAuditTeamPortal currentUser={user} />;
};
