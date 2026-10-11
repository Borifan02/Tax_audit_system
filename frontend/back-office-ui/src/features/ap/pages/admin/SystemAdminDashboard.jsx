import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, Users, Lock, Unlock, KeyRound, UserPlus, Activity, Search,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Building2, Edit3,
  Eye, EyeOff, Filter, ShieldAlert, ShieldCheck, Clock, Power
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext.jsx';

const TAX_CENTER_OPTIONS = [
  'FEDERAL',
  'federal-lto1',
  'federal-lto2',
  'addis_ababa-tc1',
  'addis_ababa-tc2',
  'addis_ababa-tc3',
  'oromia-tc1',
  'oromia-tc2',
  'oromia-tc3',
  'amhara-tc1',
  'amhara-tc2',
  'amhara-tc3',
  'dire_dawa-tc1',
  'dire_dawa-tc2',
  'dire_dawa-tc3',
  'snnpr-tc1',
  'snnpr-tc2',
  'snnpr-tc3',
  'somali-tc1',
  'somali-tc2',
  'somali-tc3',
];

const ROLE_OPTIONS = [
  { value: 'SYSTEM_ADMIN', label: 'System Administrator' },
  { value: 'PLANNING_TEAM', label: 'Audit Planning Team' },
  { value: 'DIRECTOR', label: 'Audit Director' },
  { value: 'SENIOR_MANAGEMENT', label: 'Senior Management' },
  { value: 'REGIONAL_DIRECTOR', label: 'Regional Director' },
  { value: 'TAX_CENTER_MANAGER', label: 'Tax Center Manager' },
  { value: 'COMMITTEE_CHAIR', label: 'Committee Chair' },
  { value: 'COMMITTEE_MEMBER', label: 'Committee Member' },
  { value: 'TEAM_LEADER', label: 'Audit Team Leader' },
  { value: 'AUDITOR', label: 'Tax Auditor' },
  { value: 'AUDIT_REQUESTER', label: 'Directorate Audit Requester' },
];

const AUDIT_TYPE_OPTIONS = [
  { value: '', label: 'None / All Audit Types' },
  { value: 'DESK_AUDIT', label: 'Desk Audit (DESK_AUDIT)' },
  { value: 'COMPREHENSIVE_AUDIT', label: 'Comprehensive Audit (COMPREHENSIVE_AUDIT)' },
  { value: 'ISSUE_AUDIT', label: 'Issue Audit (ISSUE_AUDIT)' },
  { value: 'TRANSFER_PRICING', label: 'Transfer Pricing (TRANSFER_PRICING)' },
  { value: 'JOINT_AUDIT', label: 'Joint Audit (JOINT_AUDIT)' },
];

export default function SystemAdminDashboard({ view = 'dashboard', onNavigate }) {
  const { user: adminUser } = useAuth();
  const [activeTab, setActiveTab] = useState(view === 'dashboard' ? 'dashboard' : view);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters for User Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [taxCenterFilter, setTaxCenterFilter] = useState('ALL');
  const [auditTypeFilter, setAuditTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Filters for Security Audit Logs
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('Mor@2026!');
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [showTempPwd, setShowTempPwd] = useState(false);

  // Edit Scope Modal State
  const [scopeModalUser, setScopeModalUser] = useState(null);
  const [scopeForm, setScopeForm] = useState({
    fullName: '',
    email: '',
    userType: 'AUDITOR',
    assignedLevel: 'TAX_CENTER',
    assignedLocation: 'federal-lto1',
    auditType: ''
  });

  // Provision New User Form State
  const [provisionForm, setProvisionForm] = useState({
    fullName: '',
    username: '',
    email: '',
    userType: 'AUDITOR',
    assignedLevel: 'TAX_CENTER',
    assignedLocation: 'federal-lto1',
    auditType: 'DESK_AUDIT',
    initialPassword: 'Mor@2026!',
    mustChangePassword: true
  });

  useEffect(() => {
    if (view && ['dashboard', 'users', 'provision', 'security_logs', 'audit_trail'].includes(view)) {
      setActiveTab(view === 'audit_trail' ? 'security_logs' : view);
    }
  }, [view]);

  const showToastMsg = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetch('/api/v1/backoffice/auth/admin/users'),
        fetch('/api/v1/backoffice/auth/admin/security-logs')
      ]);
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
        setMetrics(uData.metrics || null);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
        if (lData.metrics) setMetrics(lData.metrics);
      }
    } catch (e) {
      console.error('Failed to fetch admin security data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const hay = `${u.username || ''} ${u.legacyUsername || ''} ${u.fullName || ''} ${u.email || ''} ${u.assignedLocation || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roleFilter !== 'ALL' && (u.userType || '').toUpperCase() !== roleFilter) return false;
      if (taxCenterFilter !== 'ALL' && (u.assignedLocation || '') !== taxCenterFilter) return false;
      if (auditTypeFilter !== 'ALL' && (u.auditType || '').toUpperCase() !== auditTypeFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'MUST_CHANGE' && !u.mustChangePassword) return false;
        if (statusFilter !== 'MUST_CHANGE' && (u.status || 'ACTIVE').toUpperCase() !== statusFilter) return false;
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, taxCenterFilter, auditTypeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  // Filtered Security Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (logFilter !== 'ALL' && l.eventType !== logFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.trim().toLowerCase();
        const hay = `${l.actorId || ''} ${l.targetUser || ''} ${l.eventType || ''} ${l.details || ''} ${l.taxCenter || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, logFilter, logSearch]);

  // Actions
  const handleUnlockUser = async (targetUsername) => {
    try {
      const res = await fetch(`/api/v1/backoffice/auth/admin/unlock/${encodeURIComponent(targetUsername)}`, {
        method: 'POST',
        headers: { 'X-Actor-Id': adminUser?.username || 'sysadmin-01' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unlock failed');
      showToastMsg('success', `Account ${targetUsername} unlocked and failed login counter reset.`);
      fetchAdminData();
    } catch (err) {
      showToastMsg('error', err.message);
    }
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      const res = await fetch(`/api/v1/backoffice/auth/admin/status/${encodeURIComponent(u.username)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': adminUser?.username || 'sysadmin-01'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Status update failed');
      showToastMsg('success', `Account ${u.username} status set to ${nextStatus}.`);
      fetchAdminData();
    } catch (err) {
      showToastMsg('error', err.message);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    try {
      const res = await fetch('/api/v1/backoffice/auth/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': adminUser?.username || 'sysadmin-01'
        },
        body: JSON.stringify({
          username: resetModalUser.username,
          temporaryPassword: tempPassword,
          mustChangePassword: forceChangeOnLogin
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Password reset failed');
      showToastMsg('success', `Password reset for ${resetModalUser.username} (BCrypt hashed).`);
      setResetModalUser(null);
      fetchAdminData();
    } catch (err) {
      showToastMsg('error', err.message);
    }
  };

  const openScopeModal = (u) => {
    setScopeModalUser(u);
    setScopeForm({
      fullName: u.fullName || u.name || '',
      email: u.email || '',
      userType: u.userType || 'AUDITOR',
      assignedLevel: u.assignedLevel || 'TAX_CENTER',
      assignedLocation: u.assignedLocation || 'federal-lto1',
      auditType: u.auditType || ''
    });
  };

  const handleScopeUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!scopeModalUser) return;
    try {
      const res = await fetch(`/api/v1/backoffice/auth/admin/scope/${encodeURIComponent(scopeModalUser.username)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': adminUser?.username || 'sysadmin-01'
        },
        body: JSON.stringify(scopeForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update scope');
      showToastMsg('success', `Updated role & organizational scope for ${scopeModalUser.username}.`);
      setScopeModalUser(null);
      fetchAdminData();
    } catch (err) {
      showToastMsg('error', err.message);
    }
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/backoffice/auth/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Id': adminUser?.username || 'sysadmin-01'
        },
        body: JSON.stringify(provisionForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to provision user');
      showToastMsg('success', `Provisioned new MOR staff account: ${data.user?.username}`);
      setProvisionForm({
        fullName: '',
        username: '',
        email: '',
        userType: 'AUDITOR',
        assignedLevel: 'TAX_CENTER',
        assignedLocation: 'federal-lto1',
        auditType: 'DESK_AUDIT',
        initialPassword: 'Mor@2026!',
        mustChangePassword: true
      });
      setActiveTab('users');
      if (onNavigate) onNavigate('users');
      fetchAdminData();
    } catch (err) {
      showToastMsg('error', err.message);
    }
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    if (onNavigate) onNavigate(tabId);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'error'
            ? 'bg-red-600 text-white border-red-500'
            : 'bg-emerald-600 text-white border-emerald-500'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Banner — Segregation of Duties & Security Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white border border-blue-800/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Shield className="text-blue-400" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-extrabold tracking-tight">
                  MOR Identity, Credential & Security Administration
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  BCrypt + Signed JWT Active
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-1 max-w-3xl">
                Strict Segregation of Duties (SoD): System Administrators manage user provisioning, BCrypt password resets, 5-attempt lockout recovery, tax center/audit-type scoping, and security logs — without modifying taxpayer audit working papers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {[
              { id: 'dashboard', label: 'Security Overview', icon: ShieldCheck },
              { id: 'users', label: `All Users (${users.length})`, icon: Users },
              { id: 'provision', label: 'Provision Staff', icon: UserPlus },
              { id: 'security_logs', label: 'Security Audit Log', icon: Activity },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 ring-1 ring-blue-400'
                      : 'bg-white/10 text-blue-100 hover:bg-white/15'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 transition cursor-pointer"
              title="Refresh Security Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Accounts</span>
            <Users size={15} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics?.totalAccounts ?? users.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">All existing MOR staff preserved</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Accounts</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics?.activeAccounts ?? users.filter(u => u.status === 'ACTIVE').length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Authorized for login</p>
        </div>

        <div
          onClick={() => { setStatusFilter('LOCKED'); switchTab('users'); }}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-200 dark:border-red-900/50 shadow-xs cursor-pointer hover:border-red-400 transition"
        >
          <div className="flex items-center justify-between text-red-500 text-xs font-semibold">
            <span>Locked Accounts</span>
            <Lock size={15} />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {metrics?.lockedAccounts ?? users.filter(u => u.status === 'LOCKED').length}
          </p>
          <p className="text-[11px] text-red-500/80 mt-0.5">5-attempt brute-force lock</p>
        </div>

        <div
          onClick={() => { setStatusFilter('MUST_CHANGE'); switchTab('users'); }}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-xs cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-500 text-xs font-semibold">
            <span>Must Change Pwd</span>
            <KeyRound size={15} />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {metrics?.mustChangePasswordCount ?? users.filter(u => u.mustChangePassword).length}
          </p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Temporary password issued</p>
        </div>

        <div
          onClick={() => { setStatusFilter('INACTIVE'); switchTab('users'); }}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-slate-400 transition"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Deactivated</span>
            <XCircle size={15} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
            {metrics?.inactiveAccounts ?? users.filter(u => u.status === 'INACTIVE').length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Access revoked</p>
        </div>

        <div
          onClick={() => switchTab('security_logs')}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-blue-400 transition"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Failed Login Alerts</span>
            <ShieldAlert size={15} className="text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
            {metrics?.failedLoginEvents ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Recorded in audit log</p>
        </div>
      </div>

      {/* ── TAB 1: SECURITY OVERVIEW DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Security Controls */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-500" />
              Active MOR Security Controls
            </h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  title: 'BCrypt Password Hashing (Cost 10)',
                  desc: 'All passwords are salted and hashed server-side using Spring Security BCrypt. Default initial password for existing accounts: Mor@2026!',
                  badge: 'ENFORCED'
                },
                {
                  title: 'Brute-Force Account Lockout',
                  desc: 'Accounts automatically lock for 15 minutes after 5 consecutive failed password attempts. System Admin can unlock immediately.',
                  badge: '5 ATTEMPTS'
                },
                {
                  title: 'Signed HMAC-SHA256 JWT Sessions',
                  desc: 'Every login issues a cryptographically signed Bearer JWT containing userId, role, taxCenter, and auditType.',
                  badge: 'HS256 JWT'
                },
                {
                  title: '15-Minute Idle Auto-Logout',
                  desc: 'Unattended back-office workstations display a 60-second warning at 14 minutes and auto-terminate at 15 minutes.',
                  badge: '15 MIN'
                },
                {
                  title: 'First-Login / Reset Forced Password Change',
                  desc: 'Temporary passwords issued or reset by System Admin require the staff member to set a private password on login.',
                  badge: 'ACTIVE'
                },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Security & Authentication Events */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={17} className="text-blue-500" />
                  Live Authentication & Security Audit Stream
                </h3>
                <button
                  type="button"
                  onClick={() => switchTab('security_logs')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View Full Audit Log →
                </button>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {logs.slice(0, 10).map(ev => (
                  <div
                    key={ev.eventId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          ev.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : ev.severity === 'WARNING'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {ev.eventType}
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ev.targetUser}
                        </span>
                        {ev.taxCenter && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                            🏢 {ev.taxCenter}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{ev.details}</p>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-slate-400">
                      <div>{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}</div>
                      <div className="font-mono text-[10px]">{ev.ipAddress}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Need to reset a forgotten password, unlock a locked auditor, or adjust tax center assignment?
              </div>
              <button
                type="button"
                onClick={() => switchTab('users')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Open User & Credential Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COMPLETE USER & CREDENTIAL DIRECTORY ── */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder="Search by username, name, email, or tax center..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Roles</option>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                <select
                  value={taxCenterFilter}
                  onChange={(e) => { setTaxCenterFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Tax Centers / Locations</option>
                  {TAX_CENTER_OPTIONS.map(tc => (
                    <option key={tc} value={tc}>{tc}</option>
                  ))}
                </select>

                <select
                  value={auditTypeFilter}
                  onChange={(e) => { setAuditTypeFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Audit Types</option>
                  <option value="DESK_AUDIT">DESK_AUDIT</option>
                  <option value="COMPREHENSIVE_AUDIT">COMPREHENSIVE_AUDIT</option>
                  <option value="ISSUE_AUDIT">ISSUE_AUDIT</option>
                  <option value="TRANSFER_PRICING">TRANSFER_PRICING</option>
                  <option value="JOINT_AUDIT">JOINT_AUDIT</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Security Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="LOCKED">Locked (Brute-Force)</option>
                  <option value="INACTIVE">Deactivated</option>
                  <option value="MUST_CHANGE">Must Change Password</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Staff Member & Login ID</th>
                  <th className="py-3 px-4">Role & Audit Type</th>
                  <th className="py-3 px-4">Tax Center / Scope</th>
                  <th className="py-3 px-4">Security & Password State</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/70 text-xs">
                {pagedUsers.map(u => {
                  const isLocked = u.status === 'LOCKED';
                  const isInactive = u.status === 'INACTIVE';
                  return (
                    <tr key={u.username} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          {u.username}
                          {u.legacyUsername && u.legacyUsername !== u.username ? ` (alias: ${u.legacyUsername})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {u.userType}
                        </span>
                        {u.auditType && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              🏷️ {u.auditType}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {u.assignedLocation || 'FEDERAL'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">{u.assignedLevel}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isLocked
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                              : isInactive
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                          }`}>
                            {u.status}
                          </span>
                          {u.mustChangePassword && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              Force Change on Login
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{u.customPasswordSet ? '🔐 Custom BCrypt Hash' : '🔑 Default (Mor@2026!)'}</span>
                          {u.failedLoginCount > 0 && (
                            <span className="text-red-500 font-bold">• {u.failedLoginCount} failed attempt(s)</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {(isLocked || u.failedLoginCount > 0) && (
                            <button
                              type="button"
                              onClick={() => handleUnlockUser(u.username)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition cursor-pointer"
                              title="Unlock Account & Reset Failed Attempts"
                            >
                              <Unlock size={12} />
                              <span>Unlock</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setTempPassword('Mor@2026!');
                              setForceChangeOnLogin(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer"
                            title="Reset User Password"
                          >
                            <KeyRound size={12} />
                            <span>Reset Pwd</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openScopeModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 transition cursor-pointer"
                            title="Edit Role, Tax Center & Audit Type"
                          >
                            <Edit3 size={12} />
                            <span>Scope</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                              isInactive
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 border-slate-300 dark:border-slate-600'
                            }`}
                            title={isInactive ? 'Activate Account' : 'Deactivate Account'}
                          >
                            <Power size={12} />
                            <span>{isInactive ? 'Activate' : 'Deactivate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {pagedUsers.length} of {filteredUsers.length} matching accounts (Total in system: {users.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROVISION NEW MOR STAFF ACCOUNT ── */}
      {activeTab === 'provision' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Provision New MOR Back-Office Staff Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign role, organizational level, tax center, audit type, and initial BCrypt temporary password.
              </p>
            </div>
          </div>

          <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={provisionForm.fullName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                  placeholder="e.g. Solomon Tadesse"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username / Staff ID *</label>
                <input
                  type="text"
                  required
                  value={provisionForm.username}
                  onChange={(e) => setProvisionForm({ ...provisionForm, username: e.target.value })}
                  placeholder="e.g. u-aud-federal-lto1-desk-1-3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official MOR Email *</label>
                <input
                  type="email"
                  required
                  value={provisionForm.email}
                  onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                  placeholder="e.g. solomon.tadesse@mor.gov.et"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                <select
                  value={provisionForm.userType}
                  onChange={(e) => setProvisionForm({ ...provisionForm, userType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organizational Level *</label>
                <select
                  value={provisionForm.assignedLevel}
                  onChange={(e) => setProvisionForm({ ...provisionForm, assignedLevel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="TAX_CENTER">TAX_CENTER</option>
                  <option value="REGIONAL">REGIONAL</option>
                  <option value="NATIONAL">NATIONAL</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax Center / Location *</label>
                <select
                  value={provisionForm.assignedLocation}
                  onChange={(e) => setProvisionForm({ ...provisionForm, assignedLocation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {TAX_CENTER_OPTIONS.map(tc => (
                    <option key={tc} value={tc}>{tc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Audit Type Specialization</label>
                <select
                  value={provisionForm.auditType}
                  onChange={(e) => setProvisionForm({ ...provisionForm, auditType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {AUDIT_TYPE_OPTIONS.map(at => (
                    <option key={at.value} value={at.value}>{at.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={provisionForm.initialPassword}
                  onChange={(e) => setProvisionForm({ ...provisionForm, initialPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={provisionForm.mustChangePassword}
                onChange={(e) => setProvisionForm({ ...provisionForm, mustChangePassword: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Require staff member to change this temporary password immediately upon first login
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => switchTab('users')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition cursor-pointer"
              >
                Provision Account with BCrypt Hash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 4: SECURITY & AUTHENTICATION AUDIT LOGS ── */}
      {activeTab === 'security_logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter security logs by user, event, IP..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGED', 'ADMIN_PASSWORD_RESET', 'ADMIN_ACCOUNT_UNLOCKED'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLogFilter(type)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    logFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70'
                  }`}
                >
                  {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Event ID & Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Actor → Target Account</th>
                  <th className="py-3 px-4">Role & Tax Center</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/70 text-xs">
                {filteredLogs.map(ev => (
                  <tr key={ev.eventId} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/25">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{ev.eventId}</div>
                      <div className="text-[11px] text-slate-400">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        ev.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                          : ev.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                      }`}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-slate-700 dark:text-slate-300">{ev.actorId}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{ev.targetUser}</span>
                      <div className="text-[10px] text-slate-400">IP: {ev.ipAddress}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{ev.role}</div>
                      <div className="text-[11px] text-slate-400">{ev.taxCenter}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {ev.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: SYSTEM ADMIN RESET PASSWORD ── */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound size={18} />
                <h3 className="text-sm font-bold">Reset Password — {resetModalUser.fullName}</h3>
              </div>
              <button type="button" onClick={() => setResetModalUser(null)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-200">{resetModalUser.username}</div>
                <div className="text-slate-500">{resetModalUser.email} • {resetModalUser.userType}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Temporary Password (BCrypt)
                </label>
                <div className="relative">
                  <input
                    type={showTempPwd ? 'text' : 'password'}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTempPwd(!showTempPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showTempPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceChangeOnLogin}
                  onChange={(e) => setForceChangeOnLogin(e.target.checked)}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Force user to change password on next login
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SYSTEM ADMIN EDIT SCOPE & ROLE ── */}
      {scopeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 size={18} />
                <h3 className="text-sm font-bold">Edit Scope — {scopeModalUser.username}</h3>
              </div>
              <button type="button" onClick={() => setScopeModalUser(null)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleScopeUpdateSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={scopeForm.fullName}
                  onChange={(e) => setScopeForm({ ...scopeForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={scopeForm.userType}
                  onChange={(e) => setScopeForm({ ...scopeForm, userType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax Center / Location</label>
                <select
                  value={scopeForm.assignedLocation}
                  onChange={(e) => setScopeForm({ ...scopeForm, assignedLocation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {TAX_CENTER_OPTIONS.map(tc => (
                    <option key={tc} value={tc}>{tc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Audit Type Specialization</label>
                <select
                  value={scopeForm.auditType}
                  onChange={(e) => setScopeForm({ ...scopeForm, auditType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {AUDIT_TYPE_OPTIONS.map(at => (
                    <option key={at.value} value={at.value}>{at.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setScopeModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Save Scope Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
