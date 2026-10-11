/**
 * AuditorAssignmentModal
 * Team Leader assigns a case to an auditor with workload balancing
 * Shows available auditors with their current workload
 */
import { useState, useMemo, useEffect } from 'react';
import { X, Users, CheckCircle, Search, Loader2, Send, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { SEED_USERS } from '../../ap/data/seed.js';

// Fetch team auditors from the committee API (filtered by tax center)
async function fetchTeamAuditors() {
  try {
    const token = localStorage.getItem('authToken');
    const session = JSON.parse(localStorage.getItem('mor_aps_session') || '{}');
    const idMap = {
      'u-tl-aa1a': '10000000-0000-0000-0001-000000000001',
      'u-tl-aa2a': '10000000-0000-0000-0002-000000000001',
      'u-tl-aa3a': '10000000-0000-0000-0003-000000000001',
      'u-tl-or1a': '10000000-0000-0000-0004-000000000001',
    };
    const actorId = idMap[session?.id] || session?.id || '';
    const res = await fetch(
      `/api/v1/backoffice/ap/committee/teams/my-team`,
      { headers: { 'Content-Type': 'application/json', 'X-Actor-Id': actorId, ...(token && { Authorization: `Bearer ${token}` }) } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.auditors || [];
  } catch (err) {
    console.warn('[AuditorAssignmentModal] Could not fetch team auditors:', err.message);
    return [];
  }
}

// Fetch selected team leader from the committee API
async function fetchSelectedTeamLeader(caseId) {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(
      `/api/v1/backoffice/ap/committee/cases/${caseId}/team-leader-nominations`,
      { headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const selected = (Array.isArray(data) ? data : []).find(n => n.selected);
    return selected || null;
  } catch (err) {
    console.warn('[AuditorAssignmentModal] Could not fetch team leader info:', err.message);
    return null;
  }
}

export default function AuditorAssignmentModal({ open, onClose, caseData, allCases, user, onAssign }) {
  const [selectedAuditor, setSelectedAuditor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamAuditors, setTeamAuditors] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
  const [nominationsLoading, setNominationsLoading] = useState(false);

  // Use the user prop (from AuthContext) — falls back to localStorage for backward compat
  const currentUser = useMemo(() => {
    if (user?.id) return user;
    try {
      const session = JSON.parse(localStorage.getItem('mor_aps_session') || '{}');
      if (session.id) {
        const found = SEED_USERS.find(u => u.id === session.id);
        if (found) return found;
      }
    } catch { /* ignore */ }
    return {};
  }, [user]);

  // Fetch team auditors (filtered by tax center) and team leader when modal opens
  useEffect(() => {
    if (!open || !caseData) return;

    const loadData = async () => {
      setNominationsLoading(true);
      try {
        const [auditors] = await Promise.all([
          fetchTeamAuditors(),
        ]);
        setTeamAuditors(auditors);
      } catch (err) {
        console.warn('Failed to load team data:', err);
      } finally {
        setNominationsLoading(false);
      }
    };
    loadData();
  }, [open, caseData]);

  // Use team auditors from the committee API (already filtered by tax center)
  const myAuditors = useMemo(() => {
    if (teamAuditors.length > 0) {
      return teamAuditors.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email || `${a.name.toLowerCase().replace(/\s+/g, '.')}@mor.gov.et`,
        expertise: a.expertise || 'General Audit',
        seniority: a.seniority || '',
        taxCenter: a.taxCenter || '',
        fromNomination: false,
      }));
    }
    const tlTaxCenter = currentUser.taxCenter;
    const tlAuditType = currentUser.auditType;
    return SEED_USERS.filter(u => u.role === 'auditor' && (!tlTaxCenter || u.taxCenter === tlTaxCenter) && (!tlAuditType || u.auditType === tlAuditType)).map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        expertise: a.auditType || 'General Audit',
        seniority: 'Senior',
        taxCenter: a.taxCenter,
        fromNomination: false
    }));
  }, [teamAuditors, currentUser]);

  // Calculate workload for each auditor (active cases assigned to them)
  const auditorWorkloads = useMemo(() => {
    const workloads = {};
    myAuditors.forEach(a => {
      workloads[a.id] = (allCases || []).filter(c =>
        (c.assignedAuditor === a.id || c.assignedAuditorId === a.id) &&
        c.status !== 'COMPLETED' && c.status !== 'CONCLUDED'
      ).length;
    });
    return workloads;
  }, [myAuditors, allCases]);

  // Filter auditors by search
  const filteredAuditors = useMemo(() => {
    if (!searchQuery.trim()) return myAuditors;
    const q = searchQuery.toLowerCase();
    return myAuditors.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }, [myAuditors, searchQuery]);

  const handleConfirm = async () => {
    if (!selectedAuditor || !caseData) return;
    setLoading(true);
    setError(null);
    try {
      const caseId = caseData.committeeCaseId || caseData.caseId || caseData.id;
      await onAssign(caseId, selectedAuditor.id);
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setSelectedAuditor(null);
        setLoading(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to assign case:', err);
      setError(err.message || 'Failed to assign case to auditor');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAuditor(null);
    setSearchQuery('');
    setConfirmed(false);
    setLoading(false);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assign Case to Auditor</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {caseData?.taxpayerName || caseData?.taxpayer_name || 'Case'} — {caseData?.caseCode || caseData?.caseNumber || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Team Leader Info Banner */}
        {selectedTeamLeader && (
          <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-sm">
              <Shield size={14} className="text-purple-600 dark:text-purple-400" />
              <span className="text-purple-800 dark:text-purple-200 font-medium">
                Team Leader: {selectedTeamLeader.auditorName || 'Appointed'}
              </span>
              <span className="text-purple-500 dark:text-purple-400">•</span>
              <span className="text-purple-600 dark:text-purple-300 text-xs">
                Showing auditors nominated for this team by committee members
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {confirmed ? (
            /* Confirmation Success */
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Case Assigned</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                <strong>{selectedAuditor?.name}</strong> has been assigned this case
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                The auditor will receive a notification
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Auditor List */}
              <div className="space-y-2">
                {nominationsLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Loader2 size={32} className="mx-auto mb-2 animate-spin opacity-50" />
                    <p className="text-sm">Loading nominated auditors...</p>
                  </div>
                ) : filteredAuditors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No auditors found for this team</p>
                    {myAuditors.length === 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          No auditors nominated by committee members yet.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Committee members must first nominate auditors for this team.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredAuditors.map((auditor) => (
                    <button
                      key={auditor.id}
                      onClick={() => setSelectedAuditor(auditor)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                        selectedAuditor?.id === auditor.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                          : auditor.fromNomination
                            ? 'border-purple-200 dark:border-purple-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        auditor.fromNomination
                          ? 'bg-purple-100 dark:bg-purple-800/50'
                          : 'bg-blue-100 dark:bg-blue-800/50'
                      }`}>
                        <span className={`text-xs font-bold ${
                          auditor.fromNomination
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {auditor.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{auditor.name}</p>
                          {auditor.fromNomination && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">NOMINATED</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{auditor.email}</p>
                        {auditor.expertise && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{auditor.expertise}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          (auditorWorkloads[auditor.id] || 0) === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          (auditorWorkloads[auditor.id] || 0) <= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {auditorWorkloads[auditor.id] || 0} active
                        </span>
                        {selectedAuditor?.id === auditor.id && (
                          <CheckCircle size={18} className="text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Selected Auditor Summary */}
              {selectedAuditor && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center">
                      <Shield size={18} className="text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAuditor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedAuditor.auditType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'General Auditor'}
                        {auditorWorkloads[selectedAuditor.id] > 0 && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">
                            · {auditorWorkloads[selectedAuditor.id]} active case{auditorWorkloads[selectedAuditor.id] !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                      {selectedAuditor.fromNomination && selectedAuditor.justification && (
                        <p className="text-xs text-purple-600 dark:text-purple-300 mt-1 italic">
                          Nomination reason: "{selectedAuditor.justification}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!confirmed && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-600">
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {selectedAuditor && (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Assigning...</>
                  ) : (
                    <><Send size={16} /> Assign to {selectedAuditor.name}</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
