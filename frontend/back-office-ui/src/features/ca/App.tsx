/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ComprehensiveAuditWorkspace from './components/comprehensive/ComprehensiveAuditWorkspace';
import TeamLeaderWorkspace from './components/comprehensive/TeamLeaderWorkspace';
import DirectorWorkspace from './components/comprehensive/DirectorWorkspace';
import FraudInvestigatorWorkspace from './components/comprehensive/FraudInvestigatorWorkspace';
import {
  ShieldCheck,
  Bell,
  CheckCircle2,
  ChevronDown,
  Building2,
  FileCheck2,
  BadgeAlert,
  ArrowRight,
  Shield,
  Briefcase
} from 'lucide-react';
import { AuthUser, SystemNotification } from './types/audit';
import { itasApi, setCurrentUserId, getCurrentUserId } from './services/api';

export default function App() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: 'usr-auditor-01',
    name: 'Jane Doe',
    email: 'jane.doe@itas.gov.tax',
    role: 'COMPREHENSIVE_AUDITOR',
    title: 'Senior Comprehensive Tax Auditor',
    directorate: 'Large Taxpayers Directorate (LTO) - Energy & Manufacturing',
    badgeNumber: 'LTO-AUD-2041',
    clearanceLevel: 'Level 3 (Restricted Financial Data)'
  });

  // Default to Comprehensive Tax Audit Case CA-2026-101
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CA-2026-101');

  // User Profile Switcher Dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Load auth users on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const allUsers = await itasApi.getAuthUsers();
        setUsers(allUsers);
        const savedId = getCurrentUserId();
        const current = allUsers.find((u) => u.id === savedId) || allUsers[0];
        if (current) {
          setCurrentUser(current);
        }
      } catch (err) {
        console.error('Failed to load authenticated users:', err);
      }
    }
    initAuth();
  }, []);

  // Load notifications for current user
  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await itasApi.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, [loadNotifications, currentUser]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle switching authentic user & auto-routing to their designated role portal
  const handleSelectUser = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentUserId(user.id);
    setIsUserMenuOpen(false);
    loadNotifications();

    // Contextually adjust default active case based on selected role
    if (user.role === 'TEAM_LEADER') {
      setSelectedCaseId('CA-2026-102'); // submitted case
    } else if (user.role === 'AUDIT_DIRECTOR') {
      setSelectedCaseId('CA-2026-103'); // pending director approval case
    } else if (user.role === 'FRAUD_INVESTIGATOR') {
      setSelectedCaseId('CA-2026-104'); // criminal fraud case
    } else {
      setSelectedCaseId('CA-2026-101'); // lead auditor case in progress
    }
  };

  const handleCaseChange = (newCaseId: string) => {
    setSelectedCaseId(newCaseId);
  };

  const handleNotificationClick = async (notif: SystemNotification) => {
    await itasApi.markNotificationRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.caseId) {
      setSelectedCaseId(notif.caseId);
    }
    setIsNotificationsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await itasApi.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Application Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs shadow-md text-white border border-indigo-400/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-100">
                ITAS Comprehensive Tax Audit
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                LTO Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Large Taxpayers Directorate · System of Requirements FR-04.4 & FR-04.7
            </p>
          </div>
        </div>

        {/* Center: Current Authorized Role Portal Badge */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2 shadow-inner">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                currentUser.role === 'COMPREHENSIVE_AUDITOR'
                  ? 'bg-indigo-400'
                  : currentUser.role === 'TEAM_LEADER'
                  ? 'bg-amber-400'
                  : currentUser.role === 'AUDIT_DIRECTOR'
                  ? 'bg-purple-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-2xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Active Portal:
            </span>
            <span
              className={`text-xs font-bold ${
                currentUser.role === 'COMPREHENSIVE_AUDITOR'
                  ? 'text-indigo-300'
                  : currentUser.role === 'TEAM_LEADER'
                  ? 'text-amber-300'
                  : currentUser.role === 'AUDIT_DIRECTOR'
                  ? 'text-purple-300'
                  : 'text-rose-300'
              }`}
            >
              {currentUser.role === 'COMPREHENSIVE_AUDITOR'
                ? 'Comprehensive Auditor Execution Workspace'
                : currentUser.role === 'TEAM_LEADER'
                ? 'Team Leader Technical Review & Endorsement'
                : currentUser.role === 'AUDIT_DIRECTOR'
                ? 'Director Statutory Decision & Executive Governance'
                : 'Special Criminal Fraud Investigation Directorate'}
            </span>
          </div>
        </div>

        {/* Right: Notifications & Authentic User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors relative"
              title="System Notifications & Audit Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Audit Notifications
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-2xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications for your role.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.read ? 'bg-indigo-50/60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-900 leading-tight">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-slate-600 text-2xs leading-relaxed">{n.message}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Case: {n.caseNumber}</span>
                          <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authentic User Switcher / Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors text-left"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                  currentUser.role === 'COMPREHENSIVE_AUDITOR'
                    ? 'bg-indigo-600'
                    : currentUser.role === 'TEAM_LEADER'
                    ? 'bg-amber-600'
                    : currentUser.role === 'AUDIT_DIRECTOR'
                    ? 'bg-purple-600'
                    : 'bg-rose-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>

              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold block text-slate-100 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {currentUser.role === 'COMPREHENSIVE_AUDITOR'
                    ? 'Comprehensive Auditor'
                    : currentUser.role === 'TEAM_LEADER'
                    ? 'Audit Team Leader'
                    : currentUser.role === 'AUDIT_DIRECTOR'
                    ? 'Audit Director'
                    : 'Fraud Investigator'}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Switcher Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                    Comprehensive Audit Personnel
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Switch authenticated user to test role-separated workspaces
                  </span>
                </div>

                <div className="p-2 space-y-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-200 shadow-2xs'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                                u.role === 'COMPREHENSIVE_AUDITOR'
                                  ? 'bg-indigo-600'
                                  : u.role === 'TEAM_LEADER'
                                  ? 'bg-amber-600'
                                  : u.role === 'AUDIT_DIRECTOR'
                                  ? 'bg-purple-600'
                                  : 'bg-rose-600'
                              }`}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block leading-tight">
                                {u.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {u.title}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{u.badgeNumber}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              u.role === 'COMPREHENSIVE_AUDITOR'
                                ? 'bg-indigo-100 text-indigo-800'
                                : u.role === 'TEAM_LEADER'
                                ? 'bg-amber-100 text-amber-800'
                                : u.role === 'AUDIT_DIRECTOR'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body - Strictly Role-Separated Portals */}
      <main className="flex-1">
        {currentUser.role === 'TEAM_LEADER' ? (
          <TeamLeaderWorkspace
            currentUser={currentUser}
            onSelectCase={handleCaseChange}
          />
        ) : currentUser.role === 'AUDIT_DIRECTOR' ? (
          <DirectorWorkspace
            currentUser={currentUser}
            onSelectCase={handleCaseChange}
          />
        ) : currentUser.role === 'FRAUD_INVESTIGATOR' ? (
          <FraudInvestigatorWorkspace
            currentUser={currentUser}
            onSelectCase={handleCaseChange}
          />
        ) : (
          /* Comprehensive Auditor Workspace */
          <ComprehensiveAuditWorkspace
            caseId={selectedCaseId}
            currentUser={currentUser}
            onCaseChange={handleCaseChange}
          />
        )}
      </main>
    </div>
  );
}
