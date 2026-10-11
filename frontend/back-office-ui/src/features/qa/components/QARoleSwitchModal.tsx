/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Server,
  Code2,
  Layers,
  Database,
  RefreshCw,
  ExternalLink,
  Award,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { AuthUser, QACaseReview } from '../types/audit';
import { itasApi, getApiBaseUrl, setApiBaseUrl } from '../services/api';

interface QARoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onSwitchUser: (user: AuthUser) => void;
  allUsers: AuthUser[];
  activeReview?: QACaseReview | null;
  onSignOut: () => void;
}

export const QARoleSwitchModal: React.FC<QARoleSwitchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  allUsers,
  activeReview,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'ROLES' | 'BACKEND'>('ROLES');
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl() || '');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      itasApi.getBackendStatus().then(setBackendStatus).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      setApiBaseUrl(apiUrl);
      const res = await itasApi.getBackendStatus();
      setBackendStatus(res);
      setTestResult(`Success: Connected to ${res.system} (${res.status})`);
    } catch (err: any) {
      setTestResult(`Error: ${err.message || 'Cannot reach API base URL'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const getActorBadge = (role: string) => {
    switch (role) {
      case 'QA_OFFICER':
        return { label: 'QA Officer', color: 'bg-blue-900/60 text-blue-300 border-blue-700' };
      case 'QA_TEAM_LEADER':
        return { label: 'QA Team Leader', color: 'bg-amber-900/60 text-amber-300 border-amber-700' };
      case 'QA_DIRECTOR':
        return { label: 'QA Director', color: 'bg-purple-900/60 text-purple-300 border-purple-700' };
      default:
        return { label: 'Audited Team', color: 'bg-teal-900/60 text-teal-300 border-teal-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Quality Assurance Role Switcher & Sandbox</h2>
              <p className="text-2xs text-slate-400">
                Switch actor perspective to experience the inter-role information exchange
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-2xs font-bold">
              <button
                onClick={() => setActiveTab('ROLES')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'ROLES' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Roles (4 Personas)
              </button>
              <button
                onClick={() => setActiveTab('BACKEND')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'BACKEND' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Backend API Placeholders
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'ROLES' ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300 flex items-center justify-between">
                <span>
                  Currently Active Actor: <strong>{currentUser.name}</strong> ({currentUser.role.replace(/_/g, ' ')})
                </span>
                <span className="font-mono text-2xs px-2 py-0.5 rounded bg-purple-950 border border-purple-700">
                  {currentUser.badgeNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allUsers
                  .filter((u) => ['QA_OFFICER', 'QA_TEAM_LEADER', 'QA_DIRECTOR', 'COMPREHENSIVE_AUDITOR'].includes(u.role))
                  .map((user) => {
                    const isSelected = user.id === currentUser.id;
                    const badge = getActorBadge(user.role);

                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          onClose();
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                              {badge.label}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                          </div>

                          <div>
                            <h3 className="font-bold text-sm text-white">{user.name}</h3>
                            <p className="text-2xs text-slate-400 leading-snug">{user.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">{user.badgeNumber}</p>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-900 flex items-center justify-between text-2xs font-mono text-purple-400">
                          <span>Launch Portal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Sign out to Main Login Page */}
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Need to authenticate with formal credentials or test login screen?
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 text-xs font-bold transition-colors"
                >
                  Sign Out to Login Page
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Custom Backend Connection Configuration
                  </span>
                  <span className="text-2xs text-slate-400">Decoupled & Free to replace</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="e.g. http://localhost:5000 (blank for default Express /api)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-hidden focus:border-purple-500"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                    <span>Test & Save</span>
                  </button>
                </div>

                {testResult && (
                  <p className="text-2xs font-mono text-emerald-400 bg-emerald-950/50 p-2 rounded border border-emerald-800/60">
                    {testResult}
                  </p>
                )}
              </div>

              {/* Endpoint Catalog */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono block">
                  Available Backend REST Routes
                </span>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {(backendStatus?.routes || []).map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-2xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          {r.method}
                        </span>
                        <span className="text-slate-200">{r.path}</span>
                      </div>
                      <span className="text-slate-500 text-3xs">{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QARoleSwitchModal;
